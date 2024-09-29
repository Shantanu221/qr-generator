import React, {useState, useEffect} from 'react';
import {
  View,
  TextInput,
  Button,
  Text,
  Alert,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import AppHeader from './components/Header';
import {Picker} from '@react-native-picker/picker';
import 'react-native-get-random-values';
import CryptoJS from 'crypto-js';
import Geolocation from 'react-native-geolocation-service';
import moment from 'moment';

const App = () => {
  const [mobileNumber, setMobileNumber] = useState('');
  const [carNumber, setCarNumber] = useState('');
  const [qrValue, setQrValue] = useState(null);
  const [validUntil, setValidUntil] = useState(null);
  const [violation, setViolation] = useState('nil');
  const [location, setLocation] = useState(null);
  const [isGenerated, setIsGenerated] = useState(false);

  const violations = [
    'No license',
    'Expired vehicle registration',
    'No valid insurance',
    'No PUC',
    'Overloading of Passengers',
    'Illegal modifications',
    'Nil',
  ];

  const currentDate = new Date();

  // Format the date to a readable format
  const formattedDate = currentDate.toLocaleDateString('en-US', {
    weekday: 'short', // "Monday"
    year: 'numeric', // "2024"
    month: 'short', // "September"
    day: 'numeric', // "28"
  });

  const formattedTime = currentDate.toLocaleTimeString('en-US', {
    hour: 'numeric', // "1" or "01"
    minute: 'numeric', // "2" or "02"
    second: 'numeric', // "3" or "03"
    hour12: true, // Set to false for 24-hour format
  });

  useEffect(() => {
    const requestLocationPermission = async () => {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Location Permission',
            message: 'This app requires access to your location.',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          },
        );
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          getLocation();
        } else {
          console.log('Location permission denied');
          setLocation(null);
        }
      } else {
        getLocation(); // Automatically handles permission for iOS
      }
    };

    Geolocation.getCurrentPosition(
      position => {
        const {latitude, longitude} = position.coords;
        setLocation({latitude, longitude});
      },
      error => {
        console.log(error.message);
        setLocation(null);
      },
      {enableHighAccuracy: true, timeout: 15000, maximumAge: 10000},
    );
  }, []);

  const date = moment().format('YYYY-MM-DD');
  // const secretKey = CryptoJS.SHA256(date).toString();
  const secretKey = 'hey-you';

  // Function to generate HMAC signature for tamper protection
  const generateHMACSignature = (data, secretKey) => {
    return CryptoJS.HmacSHA256(JSON.stringify(data), secretKey).toString();
  };

  // Function to generate a random salt
  const generateSalt = () => {
    return CryptoJS.lib.WordArray.random(16).toString(); // Generate a 16-byte salt
  };

  // Function to encrypt data
  const encryptData = (data, secretKey) => {
    const salt = generateSalt(); // Generate a new salt for this encryption
    const saltedKey = CryptoJS.SHA256(secretKey + salt).toString(); // Combine key with salt
    const encrypted = CryptoJS.AES.encrypt(
      JSON.stringify(data),
      saltedKey,
    ).toString();
    return {encryptedData: encrypted, salt}; // Return encrypted data and salt
  };

  // Generate QR code with 4-hour validity
  const generatePass = () => {
    if (!mobileNumber || !carNumber) {
      Alert.alert('Error', 'Please enter both Mobile Number and Car Number');
      return;
    }

    const now = new Date();
    const expirationTime = new Date(now.getTime() + 4 * 60 * 60 * 1000); // 4 hours from now

    const qrData = JSON.stringify({
      mobileNumber,
      carNumber,
      violation,
      validUntil: expirationTime.toISOString(),
      issuedLocation: location ? location : null,
    });

    const {encryptedData, salt} = encryptData(qrData, secretKey);

    const hmacSignature = generateHMACSignature(qrData, secretKey);

    const finalQRData = {
      encryptedQRData: encryptedData,
      hmacSignature,
      salt,
    };

    // const encryptedData = encryptData(qrData);
    setQrValue(JSON.stringify(finalQRData));
    setValidUntil(expirationTime);
    setIsGenerated(true);
  };

  const resetFields = () => {
    setMobileNumber('');
    setCarNumber('');
    setViolation('nil');
    setQrValue(null);
    setValidUntil(null);
    setIsGenerated(false);
  };

  return (
    <ScrollView>
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          {/* <TouchableOpacity>
            <Icon name="menu" size={30} color="#fff" />
          </TouchableOpacity> */}
          <Image
            source={require('./data/logo-removebg.png')} // Update with the path to your logo
            style={styles.logo}
          />
          <Text style={styles.headerText}>Goa Police Pass Issuing System</Text>
        </View>

        {/* Body Content */}
        <View style={styles.content}>
          <Text style={styles.label}>Mobile Number:</Text>
          <TextInput
            value={mobileNumber}
            onChangeText={setMobileNumber}
            keyboardType="phone-pad"
            placeholder="Enter mobile number"
            style={styles.input}
            editable={!isGenerated}
          />

          <Text style={styles.label}>Car Number:</Text>
          <TextInput
            value={carNumber}
            onChangeText={setCarNumber}
            placeholder="Enter car number"
            style={styles.input}
            editable={!isGenerated}
          />

          <Text style={styles.label}>Violation:</Text>
          <View
            style={{
              borderColor: 'black',
              borderWidth: 1,
              borderRadius: 5,
              backgroundColor: '#f8f8f8',
            }}>
            <Picker
              selectedValue={violation}
              onValueChange={itemValue => setViolation(itemValue)}
              style={{color: 'black', height: 50}}
              enabled={!isGenerated}>
              {violations.map((violation, index) => (
                <Picker.Item key={index} label={violation} value={violation} />
              ))}
            </Picker>
          </View>

          <View style={{marginTop: 20, flex: 1, gap: 5}}>
            <Button
              title="Generate Pass"
              onPress={generatePass}
              color="#57d4e5"
              disabled={isGenerated}
            />
            <Button title="Reset" onPress={resetFields} color="#ff6347" />
          </View>

          {qrValue && (
            <View style={styles.qrSection}>
              <View style={styles.detailHead}>
                <Text style={styles.passDetail}>Pass Details</Text>
              </View>
              <View style={styles.detailBody}>
                <View>
                  <Text style={styles.genText}>
                    <Text style={{fontWeight: 'bold'}}>Car Number:</Text>{' '}
                    {carNumber.toUpperCase()}
                  </Text>
                  <Text style={styles.genText}>
                    <Text style={{fontWeight: 'bold'}}>Date of issue:</Text>{' '}
                    {formattedDate}
                  </Text>
                  <Text style={styles.genText}>
                    <Text style={{fontWeight: 'bold'}}>Time:</Text>{' '}
                    {formattedTime}
                  </Text>
                  <Text style={styles.genText}>
                    <Text style={{fontWeight: 'bold'}}>Violation:</Text>{' '}
                    {violation.slice(0, 19)}
                  </Text>
                  <Text style={styles.genText}>
                    <Text style={{fontWeight: 'bold'}}>Issued by:</Text>{' '}
                    {'User x'}
                  </Text>
                </View>
                <View>
                  <QRCode
                    value={qrValue}
                    size={80}
                    backgroundColor="white"
                    color="black"
                  />
                </View>
              </View>

              <Text style={styles.validText}>
                <Text style={{fontWeight: 'bold'}}>Valid until:</Text>{' '}
                {validUntil?.toLocaleString()}
              </Text>
            </View>
          )}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Powered by Goa Police ©️</Text>
        </View>
      </SafeAreaView>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  genText: {
    color: '#333',
    fontSize: 14,
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
    minHeight: Dimensions.get('window').height,
  },
  logo: {
    width: 40, // Adjust as necessary
    height: 40, // Adjust as necessary
    marginRight: 10,
  },
  header: {
    height: 110,
    backgroundColor: '#42c5d6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
    color: '#333',
    fontWeight: 'bold',
  },
  picker: {
    height: 50,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    marginBottom: 20,
    borderRadius: 5,
    color: '#222',
  },
  detailHead: {
    flex: 1,
    maxHeight: 50,
    alignItems: 'center',
    borderBottomColor: '#ccc',
    borderBottomWidth: 1,
  },
  detailBody: {
    padding: 15,
    gap: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  detailB: {
    marginHorizontal: 20,
  },
  passDetail: {
    fontWeight: 'bold',
    color: '#333',
    fontSize: 30,
  },
  qrSection: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    marginTop: 30,
    marginBottom: 50,
    paddingBottom: 15,
  },
  validText: {
    marginTop: 10,
    fontSize: 16,
    color: '#222',
    paddingHorizontal: 25,
  },
  footer: {
    height: 70,
    backgroundColor: '#42c5d6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    color: '#fff',
    fontSize: 16,
  },
});

export default App;
