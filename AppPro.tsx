import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  Button,
  Alert,
  StyleSheet,
  Linking,
  TouchableOpacity,
  ScrollView,
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

  const handleQRCodeRead = e => {
    if (!scanned) {
      setScanned(true);
      try {
        const parsedQR = JSON.parse(e.data); // Parse the scanned QR code data
        const {encryptedQRData, hmacSignature, salt} = parsedQR;

        const secretKey = generateSecretKey();

        // Decrypt the data
        const decryptedData = decryptData(encryptedQRData, secretKey, salt);

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
        const isValid = moment().isBefore(decryptedData.validUntil); // Check if current time is before expiry

        if (isValid) {
          setPassStatus('Valid Pass');
        } else {
          setPassStatus('Expired Pass');
        }

        setQrData(decryptedData);
      } catch (error) {
        Alert.alert('Invalid QR Code', 'The QR code is not valid.');
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
  };

  return (
    <>
      <View style={styles.container}>
        {!scanned ? (
          <RNCamera
            style={styles.camera}
            onBarCodeRead={handleQRCodeRead}
            captureAudio={false}>
            <View style={styles.scanArea}>
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

            {qrData && (
              <>
                <View style={styles.cardRow}>
                  <Text style={styles.label}>Mobile Number:</Text>
                  <Text style={styles.value}>
                    {qrData.mobileNumber || 'N/A'}
                  </Text>
                </View>
                <View style={styles.cardRow}>
                  <Text style={styles.label}>Car Number:</Text>
                  <Text style={styles.value}>{qrData.carNumber || 'N/A'}</Text>
                </View>
                <View style={styles.cardRow}>
                  <Text style={styles.label}>Violation:</Text>
                  <Text style={styles.value}>
                    {qrData['violation'] || 'N/A'}
                  </Text>
                </View>
                <View style={styles.cardRow}>
                  <Text style={styles.label}>Latitude:</Text>
                  <Text style={styles.value}>
                    <Text style={styles.value}>
                      {qrData.issuedLocation?.latitude || 'N/A'}
                    </Text>
                  </Text>
                </View>
                <View style={styles.cardRow}>
                  <Text style={styles.label}>Longitude:</Text>
                  <Text style={styles.value}>
                    {qrData.issuedLocation?.longitude || 'N/A'}
                  </Text>
                </View>
                <View style={styles.cardRow}>
                  <Text style={styles.label}>Valid Until:</Text>
                  <Text style={styles.value}>
                    {qrData.validUntil
                      ? moment(qrData.validUntil).format('YYYY-MM-DD HH:mm:ss')
                      : 'N/A'}
                  </Text>
                </View>
              </>
            )}

            <Button title="Scan Again" onPress={() => setScanned(false)} />
          </View>
        )}
      </View>
    </>
  );
};

export default AppPro;

const styles = StyleSheet.create({
  centerText: {
    flex: 1,
    fontSize: 18,
    padding: 32,
    color: '#777',
  },
  textBold: {
    fontWeight: '500',
    color: '#000',
  },
  buttonText: {
    fontSize: 21,
    color: 'rgb(0,122,255)',
  },
  buttonTouchable: {
    padding: 16,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  camera: {
    // flex: 1,
    width: '100%',
    height: '50%',
  },
  scanArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderColor: '#fff',
    borderWidth: 2,
    width: '80%',
    height: '80%',
    margin: '10%',
  },
  scanText: {
    color: '#fff',
    fontSize: 18,
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
    backgroundColor: '#e0f7fa', // Light green for valid
    borderColor: '#00c853',
    borderWidth: 2,
  },
  invalidCard: {
    backgroundColor: '#ffebee', // Light red for invalid
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
