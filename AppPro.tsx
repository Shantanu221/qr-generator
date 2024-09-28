import React, { useState } from 'react';
import { View, Text, Button, Alert, StyleSheet } from 'react-native';
import { RNCamera } from 'react-native-camera';
import CryptoJS from 'crypto-js';
import moment from 'moment';
import 'react-native-get-random-values';

const AppPro = () => {
  const [scannedData, setScannedData] = useState(null);
  const [lastLocation, setLastLocation] = useState(null);

  const handleQRCodeScanned = ({data}) => {
    try {
      const date = moment().format('YYYY-MM-DD');
      const secretKey = CryptoJS.SHA256(date).toString();

      // Decrypt the scanned QR data
      const decryptedData = CryptoJS.AES.decrypt(data, secretKey).toString(
        CryptoJS.enc.Utf8,
      );
      const qrData = JSON.parse(decryptedData);

      // Validate expiry time
      const isExpired = moment().isAfter(qrData.validUntil);

      // Save the last scanned location
      const lastScannedLocation = qrData.issuedLocation;

      // Store scanned data
      setScannedData({...qrData, isExpired});
      setLastLocation(lastScannedLocation);

      // Log last scanned location
      console.log('Last scanned location:', lastScannedLocation);
    } catch (error) {
      console.error('Invalid QR Code', error);
      Alert.alert('Wrong or tampered QR', '');
    }
  };

  return (
    <View style={styles.container}>
      <RNCamera
        style={styles.camera}
        onBarCodeRead={handleQRCodeScanned}
        captureAudio={false}
      />

      {scannedData ? (
        <View style={styles.formContainer}>
          <Text style={styles.header}>Scanned Pass Information</Text>

          <Text style={styles.label}>Mobile Number:</Text>
          <TextInput
            style={styles.input}
            value={scannedData.mobileNumber}
            editable={false}
          />

          <Text style={styles.label}>Car Number:</Text>
          <TextInput
            style={styles.input}
            value={scannedData.carNumber}
            editable={false}
          />

          <Text style={styles.label}>Violation:</Text>
          <TextInput
            style={styles.input}
            value={scannedData.violation}
            editable={false}
          />

          <Text style={styles.label}>Issued Location:</Text>
          <TextInput
            style={styles.input}
            value={`Lat: ${lastLocation.latitude}, Lon: ${lastLocation.longitude}`}
            editable={false}
          />

          <Text style={styles.label}>Valid Until:</Text>
          <TextInput
            style={styles.input}
            value={moment(scannedData.validUntil).format('YYYY-MM-DD HH:mm:ss')}
            editable={false}
          />

          <Text style={styles.validity}>
            {scannedData.isExpired
              ? 'This pass has expired.'
              : 'This pass is valid.'}
          </Text>
        </View>
      ) : (
        <Text style={styles.message}>No valid QR scanned yet.</Text>
      )}

      {lastLocation && (
        <Text style={styles.location}>
          Last Scanned Location: Lat {lastLocation.latitude}, Lon{' '}
          {lastLocation.longitude}
        </Text>
      )}
    </View>
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
    flex: 1,
    width: '100%',
  },
  formContainer: {
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
    marginTop: 20,
    width: '90%',
  },
  header: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
    marginTop: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
  },
  validity: {
    fontSize: 16,
    color: 'red',
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 10,
  },
  message: {
    fontSize: 18,
    color: '#666',
  },
  location: {
    marginTop: 10,
    fontSize: 16,
    color: '#333',
  },
});
