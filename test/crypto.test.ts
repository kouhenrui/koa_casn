import { hashPassword, comparePassword, generateToken, verifyToken,generateRsa, encryptRsa, decryptRsa, replaceSensitiveInfo, generateQRCode } from "../src/util/crypto";
import { sensitive } from "../src/util/key";

// describe('bcrypt hash Tests', () => {
//   it('should encrypt and decrypt data', async() => {
//     const encryptedData = await hashPassword('123456');
//     const decryptedData = await comparePassword( "123456",encryptedData);
//     expect(decryptedData).toBe(true);
//   });
// });


// describe('RSA Crypto Tests', () => {

//   it('should generate rsa key pair', () => {
//     const { publicKey, privateKey } = generateRsa();
//     console.log("Public Key:", publicKey);
//     console.log("Private Key:", privateKey);
//   });
//   it('should encrypt and decrypt data', () => {
//     const data = {"param":"123456"};
//     const { publicKey, privateKey } = generateRsa();
//     const encryptedData = encryptRsa(JSON.stringify(data), publicKey);
//     console.log("Encrypted Data:", encryptedData);
//     const decryptedData = decryptRsa(encryptedData.toString(), privateKey);
//     console.log("Decrypted Data:", decryptedData.toString());
//     expect(decryptedData.toString()).toBe(JSON.stringify(data));
//   });
// });


// // describe('jwt Tests', () => {
// //   it('should generate jwt', () => {
// //     const payload = { id: 1, role: "admin" };
// //     const token = generateToken(payload);
// //     const decoded = verifyToken(token.token);
// //     expect(decoded.id).toBe(payload.id);
// //     expect(decoded.role).toBe(payload.role);
// //   });
// // });


// describe('replaceSensitiveInfo Tests', () => {
//     it("phone should replace sensitive info", () => {
//       const sensitiveInfo = "13800138000";
//       const replacedInfo = replaceSensitiveInfo(sensitiveInfo, sensitive.phone);
//       expect(replacedInfo).toBe("138****8000");
//     });
//   it('email should replace sensitive info', () => {
//     const sensitiveInfo = "test@test.com";
//     const replacedInfo = replaceSensitiveInfo(sensitiveInfo, sensitive.email);
//     expect(replacedInfo).toBe("t***@test.com");
//   });
//   it('idCard should replace sensitive info', () => {
//     const sensitiveInfo = "123456789012345678";
//     const replacedInfo = replaceSensitiveInfo(sensitiveInfo, sensitive.idCard);
//     expect(replacedInfo).toBe("1234****5678");
//   });
//   it('bankCard should replace sensitive info', () => {
//     const sensitiveInfo = "123456789012345678";
//     const replacedInfo = replaceSensitiveInfo(sensitiveInfo, sensitive.bankCard);
//     expect(replacedInfo).toBe("123456****5678");
//   });
//   it('name should replace sensitive info', () => {
//     const sensitiveInfo = "张三";
//     const replacedInfo = replaceSensitiveInfo(sensitiveInfo, sensitive.name);
//     expect(replacedInfo).toBe("张*");
//   });
//   it('name should replace sensitive info', () => {
//     const sensitiveInfo = "张三丰";
//     const replacedInfo = replaceSensitiveInfo(sensitiveInfo, sensitive.name);
//     expect(replacedInfo).toBe("张*丰");
//   });
//   it('name should replace sensitive info', () => {
//     const sensitiveInfo = "诸葛孔明";
//     const replacedInfo = replaceSensitiveInfo(sensitiveInfo, sensitive.name);
//     expect(replacedInfo).toBe("诸**明");
//   });
// });

describe('generateQRCode Tests', () => {
  it('should generate qrcode', async () => {
    const qrcode = await generateQRCode("https://www.baidu.com");
    console.log(qrcode);
    expect(qrcode).toEqual(expect.any(String));
  });
});
