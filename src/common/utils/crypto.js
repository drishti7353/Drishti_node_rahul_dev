const CryptoJS = require('crypto-js');
require('dotenv').config();

// Get encryption key and IV from environment
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'drishti_secure_encryption_key_20';
const IV = process.env.IV || '0123456789abcdef';

// Convert key and IV to proper format
const key = CryptoJS.enc.Utf8.parse(ENCRYPTION_KEY);
const iv = CryptoJS.enc.Utf8.parse(IV);

const encode = (data) => {
  try {
    if (!data) {
      throw new Error('Data to encrypt is required');
    }

    // Convert data to string if it's not already
    const stringData = typeof data === 'string' ? data : JSON.stringify(data);
    //console.log('Encrypting data:', { dataLength: stringData.length });

    // Encrypt using AES
    const encrypted = CryptoJS.AES.encrypt(stringData, key, {
      iv: iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    });

    const result = encrypted.toString();
    //console.log('Encryption successful:', { resultLength: result.length });
    return result;

  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data: ' + error.message);
  }
};

const decode = async (encryptedData) => {
  try {
    if (!encryptedData) {
      throw new Error('Encrypted data is required');
    }

    //console.log('Attempting to decrypt data:', {
    //   inputLength: encryptedData.length
    // });

    // Decrypt the data
    const decrypted = CryptoJS.AES.decrypt(encryptedData, key, {
      iv: iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    });

    const result = decrypted.toString(CryptoJS.enc.Utf8);
    if (!result) {
      throw new Error('Decryption resulted in empty string');
    }

    //console.log('Decryption successful:', {
    //   resultLength: result.length
    // });

    return result;

  } catch (error) {
    console.error('Decryption error:', {
      message: error.message,
      stack: error.stack
    });
    throw new Error('Invalid encrypted data: ' + error.message);
  }
};

module.exports = { encode, decode };
