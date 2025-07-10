
import AESSimple from "../src/meituan/aesCrypto";
describe('AES Crypto Tests', () => {
  it('should encrypt and decrypt data', () => {
    // const data = {"param":"123456"};
    // const encryptedBase64 = AESSimple.encryptBase64(JSON.stringify(data));
    // console.log("Encrypted Base64:", encryptedBase64);
    let encryptData = `/Ico34vDOAepEmZorFA9nEd7rh4ENvVdlQtmFX16b59QoRBf6vVWA35XAc5kYotI`;
    const decryptedBase64 = AESSimple.decryptBase64(encryptData);
    console.log("Decrypted Base64:", decryptedBase64);

  });
});
