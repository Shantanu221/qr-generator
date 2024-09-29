# **QR Code-Based Driver Pass System for Police Checkpoints**

## **Project Overview**
This project provides a secure and efficient QR code-based system for police officers to issue, scan, and verify driver passes at checkpoints. The system leverages encryption techniques to protect sensitive data and ensure tamper-proof QR codes. Each pass contains details such as the driver's mobile number, car number, and violation, and includes an expiration date to prevent the reuse of passes after their validity period.

## **Features**
- **AES-256 Encryption:** Ensures sensitive pass details are encrypted before embedding them into the QR code.
- **HMAC Signature Verification:** Guarantees the integrity and authenticity of the QR code data.
- **QR Code Scanning:** Scans and verifies the pass details at checkpoints using mobile devices.
- **Real-time Pass Validation:** Validates the pass’s expiration and prevents the reuse of expired passes.
- **Animated Scanning UI:** Provides an intuitive and smooth animated interface for scanning QR codes.

## **How it Works**
1. **Pass Generation:** The system generates a QR code containing encrypted pass details (driver info, violation, etc.) and a valid-until timestamp. An HMAC signature is added to ensure the data's integrity.
2. **QR Code Scanning:** Police officers scan the driver's QR code at the checkpoint using the mobile app.
3. **Decryption and Verification:** Upon scanning, the app decrypts the data using AES-256 and verifies the HMAC signature. It checks the expiration timestamp to determine if the pass is valid or expired.
4. **Result Display:** The app displays the pass details along with a status (Valid/Expired/Invalid) in a user-friendly card UI.

## **Tech Stack**
- **React Native:** Mobile application development framework.
- **RNCamera:** Camera API for scanning QR codes.
- **CryptoJS:** Library for implementing AES-256 encryption and HMAC signatures.
- **Moment.js:** Library for handling timestamps and date validation.
- **React Native Animated API:** For smooth animation in the scanning interface.

## **Installation Guide**
1. Clone this repository:
   ```bash
   git clone https://github.com/your-repo-url/qr-pass-checkpoint-system.git
   cd qr-pass-checkpoint-system

## **Encryption and Security**
- **AES-256 Encryption:** The system uses AES-256 encryption to secure sensitive information within the QR code. A salt is applied to the key for extra security, making brute-force and rainbow table attacks ineffective.
- **HMAC Integrity Check:** An HMAC signature is generated using SHA-256 to ensure the integrity of the QR code data. This prevents tampering and guarantees the authenticity of the pass.
- **Salted Key:** A salt combined with the secret key is hashed using SHA-256, enhancing the security of the encryption process.

## **Usage**
1. **Issue a Pass:** The system generates a QR code containing encrypted pass details. The QR code can be printed or shared with the driver electronically.
2. **Scan a Pass:** Use the mobile app to scan the QR code presented at the checkpoint.
3. **Verify the Pass:** The system will automatically verify the pass by decrypting the data and checking its validity. If the QR code is tampered with or expired, the app will alert the officer.

## **Demo**
Link to demo video: [Demo Video]([https://link-to-demo-video.com](https://drive.google.com/file/d/17qV2AlNT2Fj60qKdGXk99iaAWMtIs7OY/view?usp=drive_link))

## **Contributors**
- **[Shantanu Ingale]** - Full Stack Developer,ML
- **[Anant Mahambrey]** - UI/UX,Ml
- **[Poonam Prabhugaonkar]** - App Developer,UI/UX


## **License**
This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
