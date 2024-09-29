import React, {useState, useEffect, useRef} from 'react';
import {
  View,
  Text,
  Button,
  Alert,
  StyleSheet,
  Linking,
  TouchableOpacity,
  ScrollView,
  Animated,
} from 'react-native';
import {RNCamera} from 'react-native-camera';
import CryptoJS from 'crypto-js';
import moment from 'moment';
import 'react-native-get-random-values';
import QRCodeScanner from 'react-native-qrcode-scanner';

const generateSecretKey = () => {
  const date = moment().format('YYYY-MM-DD'); // Format date as YYYY-MM-DD
  // return CryptoJS.SHA256(date).toString();
  return 'hey-you';
};

const verifyHMACSignature = (data, secretKey, hmacSignature) => {
  const computedSignature = CryptoJS.HmacSHA256(
    JSON.stringify(data),
    secretKey,
  ).toString();
  // console.log('Computed HMAC:', computedSignature); // Debugging: log computed HMAC
  // console.log('Provided HMAC:', hmacSignature);
  return computedSignature === hmacSignature;
};

const decryptData = (encryptedData, secretKey, salt) => {
  try {
    // Generate the salted key using the provided salt
    const saltedKey = CryptoJS.SHA256(secretKey + salt).toString();

    const bytes = CryptoJS.AES.decrypt(encryptedData, saltedKey, {
      format: CryptoJS.format.OpenSSL, // Explicitly using OpenSSL format
    });
    const decrypted = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
    console.log('Decrypted Data:', decrypted); // Debugging: log decrypted data
    return decrypted;
  } catch (error) {
    console.error('Decryption failed:', error); // Debugging: log any decryption errors
    throw new Error('Decryption failed');
  }
};

const AppPro = () => {
  const [scanned, setScanned] = useState(false);
  const [passStatus, setPassStatus] = useState('');
  const [qrData, setQrData] = useState({});

  // Animation state for the scanning line
  const moveAnim = useRef(new Animated.Value(0)).current;

  const handleQRCodeRead = e => {
    if (!scanned) {
      setScanned(true);
      try {
        const parsedQR = JSON.parse(e.data); // Parse the scanned QR code data
        const {encryptedQRData, hmacSignature, salt} = parsedQR;

        const secretKey = generateSecretKey();

        // Decrypt the data
        const decryptedData = decryptData(encryptedQRData, secretKey, salt);

        const parsedQrData =
          typeof decryptedData === 'string'
            ? JSON.parse(decryptedData)
            : decryptedData;

        // Verify the HMAC signature
        const isSignatureValid = verifyHMACSignature(
          decryptedData,
          secretKey,
          hmacSignature,
        );

        if (!isSignatureValid) {
          Alert.alert('Invalid QR Code', 'The QR code has been tampered with.');
          setPassStatus('Invalid QR Code');
          return;
        }

        // Check pass expiry

        // const isValid = moment().isBefore(moment(decryptedData.validUntil)); // Check if current time is before expiry
        const validUntil = moment(decryptedData.validUntil);
        const currentTime = moment();
        let isValid = true;
        // Check if the pass is expired
        if (currentTime.isAfter(validUntil)) {
          isValid = false;
        } else {
          isValid = true;
          // Proceed with valid pass actions (e.g., log, display details, etc.)
        }
        if (isValid) {
          setPassStatus('Valid Pass');
        } else {
          setPassStatus('Expired Pass');
        }

        setQrData(parsedQrData);
        console.log('data:', qrData);
      } catch (error) {
        Alert.alert('Invalid QR Code', 'The QR code is not valid.');
        console.log('Error:', error);
        setPassStatus('Invalid Pass');
        setScanned(true);
      }
    }
  };

  // Function to reset the scanner for another scan
  const resetScanner = () => {
    setScanned(false);
    setPassStatus('');
    setQrData({});
    startAnimation();
  };

  // Animation logic to move the line up and down
  // Scanning line animation loop
  const startAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(moveAnim, {
          toValue: 1,
          duration: 2000, // Time for the line to move across the screen
          useNativeDriver: true,
        }),
        Animated.timing(moveAnim, {
          toValue: 0,
          duration: 2000, // Time for the line to reset back
          useNativeDriver: true,
        }),
      ]),
    ).start(); // Start the animation
  };

  useEffect(() => {
    startAnimation(); // Start the animation when the component mounts
  }, []);

  const translateY = moveAnim.interpolate({
    inputRange: [0.5, 1],
    outputRange: [0, 150], // Adjust for how far the line should move
  });

  useEffect(() => {
    console.log('Updated qrData:', qrData); // This should show the latest state
  }, [qrData]);

  return (
    <>
      <View style={styles.container}>
        {!scanned ? (
          <RNCamera
            style={styles.camera}
            onBarCodeRead={handleQRCodeRead}
            captureAudio={false}>
            <View style={styles.overlayTop} />
            <View style={styles.overlayBottom} />
            <View style={styles.overlayLeft} />
            <View style={styles.overlayRight} />
            <View style={styles.scanArea}>
              {/* Scanning Line Animation */}
              <Animated.View
                style={[
                  styles.scanLine,
                  {transform: [{translateY}]}, // Apply translation animation
                ]}
              />
              <Text style={styles.scanText}>Scan QR Code</Text>
            </View>
          </RNCamera>
        ) : (
          <View
            style={[
              styles.card,
              passStatus === 'Valid Pass'
                ? styles.validCard
                : styles.invalidCard,
            ]}>
            <Text
              style={[
                styles.statusText,
                passStatus === 'Valid Pass'
                  ? styles.validText
                  : styles.invalidText,
              ]}>
              {passStatus}
            </Text>

            {/* Conditional rendering based on pass validity */}
            <View style={styles.cardRow}>
              <Text style={styles.label}>Mobile Number:</Text>
              <Text style={styles.value}>{qrData?.mobileNumber || 'N/A'}</Text>
            </View>
            <View style={styles.cardRow}>
              <Text style={styles.label}>Car Number:</Text>
              <Text style={styles.value}>{qrData?.carNumber || 'N/A'}</Text>
            </View>
            <View style={styles.cardRow}>
              <Text style={styles.label}>Violation:</Text>
              <Text style={styles.value}>{qrData?.violation || 'N/A'}</Text>
            </View>
            <View style={styles.cardRow}>
              <Text style={styles.label}>Latitude:</Text>
              <Text style={styles.value}>
                {qrData?.issuedLocation?.latitude || 'N/A'}
              </Text>
            </View>
            <View style={styles.cardRow}>
              <Text style={styles.label}>Longitude:</Text>
              <Text style={styles.value}>
                {qrData?.issuedLocation?.longitude || 'N/A'}
              </Text>
            </View>
            <View style={styles.cardRow}>
              <Text style={styles.label}>Valid Until:</Text>
              <Text style={styles.value}>
                {qrData?.validUntil
                  ? moment(qrData.validUntil).format('YYYY-MM-DD HH:mm:ss')
                  : 'N/A'}
              </Text>
            </View>

            <Button title="Scan Again" onPress={resetScanner} />
          </View>
        )}
      </View>
    </>
  );
};

export default AppPro;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  camera: {
    width: '100%',
    height: '100%',
  },
  scanArea: {
    width: '80%',
    height: '40%',
    borderColor: '#fff',
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 3,
    left: 39,
    top: 232,
  },
  scanLine: {
    width: '90%',
    height: 2,
    backgroundColor: 'red',
    position: 'absolute',
  },
  scanText: {
    color: '#fee5e5',
    fontSize: 18,
    marginTop: 20,
    fontWeight: 'bold',
  },
  overlayTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '30%',
    backgroundColor: 'rgba(0, 0, 0, 0.3)', // Semi-transparent blur effect
    zIndex: 0,
  },
  overlayBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '30%',
    backgroundColor: 'rgba(0, 0, 0, 0.3)', // Semi-transparent blur effect
    zIndex: 0,
  },
  overlayLeft: {
    position: 'absolute',
    top: '30%',
    bottom: '30%',
    left: 0,
    width: '10%',
    backgroundColor: 'rgba(0, 0, 0, 0.3)', // Semi-transparent blur effect
    zIndex: 0,
  },
  overlayRight: {
    position: 'absolute',
    top: '30%',
    bottom: '30%',
    right: 0,
    width: '10%',
    backgroundColor: 'rgba(0, 0, 0, 0.3)', // Semi-transparent blur effect
    zIndex: 0,
  },
  card: {
    padding: 20,
    borderRadius: 10,
    marginTop: 20,
    width: '90%',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },
  validCard: {
    backgroundColor: '#e0f7fa',
    borderColor: '#00c853',
    borderWidth: 2,
  },
  invalidCard: {
    backgroundColor: '#ffebee',
    borderColor: '#d50000',
    borderWidth: 2,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  value: {
    fontSize: 16,
    color: '#222',
  },
  statusText: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  validText: {
    color: '#00c853',
  },
  invalidText: {
    color: '#d50000',
  },
});
