import * as crypto from 'crypto';

// Function to retrieve the key from AWS KMS
const getSecureCredentialsFromStore = async () => {
    // To be provided by Joe
    //const encryptionKey = "TODO-GET FROM STORAGE";
    //const iv = "TODO-GET FROM STORAGE";
    const encryptionKey = "00f952a963f38a818e9980a17882acd6b8dfa6c20f514af996ad7fafa771da08";
    const iv = "ef00cbd191f27019f407d2db29ae5bc0";

    console.log(encryptionKey);
    console.log(iv);
    return {encryptionKey, iv};
}

export const encryptText = async (inputData: string): Promise<string> => {
    try {
      // Retrieve the encryption key from environment variables (must be pre-configured in the Segment environment)
      const {encryptionKey, iv} = await getSecureCredentialsFromStore(); 

      if (!encryptionKey || !iv) {
        throw new Error('Encryption key or IV not found in secure store');
      }
  
      // Convert the key and IV from hex back to Buffers (assuming they're stored as hex strings)
      const keyBuffer = Buffer.from(encryptionKey, 'hex');
      const ivBuffer = Buffer.from(iv, 'hex');
  
      // Create the cipher using AES-256-CBC with the pre-known key and IV
      const cipher = crypto.createCipheriv('aes-256-cbc', keyBuffer, ivBuffer);
  
      // Encrypt the input data
      let encryptedData = cipher.update(inputData, 'utf8', 'hex');
      encryptedData += cipher.final('hex');
  
      // Return only the encrypted data (since the key and IV are already known)
      return encryptedData;
    } catch (error) {
      console.error('Encryption failed:', error);
      throw new Error('Encryption failed');
    }
  };