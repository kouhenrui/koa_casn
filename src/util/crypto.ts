import jwt from "jsonwebtoken";
import dayjs from "dayjs";
import { v4 as uuidv4 } from "uuid";
import * as svgCaptcha from "svg-captcha";
import bcrypt from "bcrypt";
import { CaptchaType, sensitive } from "./key";
import crypto from "crypto";
import axios from "axios";
import os from "os";
import { ServerConfig } from "./env";
const SALT_ROUNDS = 10;


/**
 * Encrypt password with bcrypt.
 * @param password - Password to encrypt.
 * @returns Encrypted password.
 */
async function hashPassword(password: string): Promise<string> {
  const hash = await bcrypt.hash(password, SALT_ROUNDS);
  return hash;
}

/**
 * Compare a plain password with its hashed version.
 * @param password - The plain password.
 * @param hashedPassword - The hashed password.
 * @returns Whether the plain password matches the hashed password.
 */
async function comparePassword(password: string, hashedPassword: string): Promise<boolean> {
  return await bcrypt.compare(password, hashedPassword);
}


//  使用crypto生成加密的盐 8位输出10位
const getSelfSalt = (length: number) => {
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result + "==";
};


// const SECRET_KEY = ServerConfig.jwt.secret; //process.env.JWT_SECRET! || "your_secret_key";
// const REFRESH_SECRET_KEY =
//   ServerConfig.jwt.refreshSecret || "your_refresh_secret";
// /**
//  * Encrypts data using AES encryption.
//  * @param data - The data to encrypt.
//  * @returns The encrypted data as a string.
//  */

// function encryptToken(data: Record<string, any>): string {
//   const ciphertext = CryptoJS.AES.encrypt(
//     JSON.stringify(data),
//     SECRET_KEY
//   ).toString();
//   return ciphertext;
// }

// /**
//  * Decrypts an encrypted token using AES decryption.
//  * @param token - The encrypted token to decrypt.
//  * @returns The decrypted data as an object if successful, or null if decryption fails.
//  */

// function decryptToken(token: string): any | null {
//   try {
//     const bytes = CryptoJS.AES.decrypt(token, SECRET_KEY);
//     const decryptedData = bytes.toString(CryptoJS.enc.Utf8);
//     return JSON.parse(decryptedData);
//   } catch (error) {
//     return null;
//   }
// }
const SECRET_KEY = process.env.JWT_SECRET! || getSelfSalt(16);
/**
 * Generates a JSON Web Token (JWT) for a given payload.
 * @param payload - The data to include in the token.
 * @returns A signed JWT as a string.
 */

function generateToken(payload: any) {
  let exp = new Date();
  exp.setTime(exp.getTime() + 24 * 60 * 60 * 1000);
  let etime = exp.getTime();
  const token = jwt.sign(payload, SECRET_KEY, { expiresIn: "1d" }); // 可配置过期时间
  return { token, etime };
}

/**
 * Verifies a JSON Web Token (JWT) signature.
 * @param token - The JWT to verify.
 * @returns The decoded payload if the token is valid, or null if verification fails.
 */

function verifyToken(token: string): any {
  try {
    return jwt.verify(token, SECRET_KEY);
  } catch (error: any) {
    throw new Error(error.message);
  }
}

/**
 * Generates a random alphanumeric string of specified length.
 * @param length - Optional. The length of the generated string. Defaults to 16 if not provided.
 * @returns A random alphanumeric string.
 */

function radonString(length?: number) {
  let result = "";
  if (!length) length = 16;
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

/**
 * 脱敏敏感信息
 * @param str - 需要脱敏的字符串
 * @param type - 脱敏类型，见 {@link sensitive}
 * @returns 脱敏后的字符串
 */
const replaceSensitiveInfo = (str: string, type: sensitive): string => {
  try {
    if (!type) throw new Error("缺少参数");
    if (!str || str.length < 1) throw new Error("缺少参数");
    switch (type) {
      case sensitive.phone:
        return str.replace(/(\d{3})\d*(\d{4})/, "$1****$2");
      case sensitive.email:
        return str.replace(/(\w{1})[^@]*(@\w+\.\w+)/, "$1***$2");
      case sensitive.idCard:
        return str.replace(/(\d{4})\d*(\d{4})/, "$1****$2");
      case sensitive.bankCard:
        return str.replace(/(\d{6})\d+(\d{4})/, "$1****$2");
      case sensitive.name: {
        const length = str.length;
        switch (length) {
          case 1:
            return str; // 只有一个字符，不隐藏
          case 2:
            return str[0] + "*"; // 两个字符，只显示第一个
          case 3:
            return str[0] + "*" + str[2]; // 三个字符，隐藏中间
          default:
            return str[0] + "**" + str.slice(-1); // 其他情况，显示首尾，隐藏中间
        }
      }
      default:
        return str;
    }
  } catch (error: unknown) {
    console.error("未知错误:", error);
    const e = `未知错误:${String(error)}`;
    throw new Error(e); // 将未知错误转换为 Error
  }
};

/**
 * 白名单正则表达式
 * @param path - 请求路径
 * @returns 是否在白名单中
 */
const whiteListRegex = async (path: string): Promise<boolean> => {
  const regexesWhiteList = ServerConfig.jwt.whiteList.map((paths) => {
    const escaped = paths.replace(/\//g, "\\/").replace(/\*/g, ".*");
    return new RegExp(`^${escaped}$`);
  });
  return regexesWhiteList.some((regex) => regex.test(path));
};

// /**
//  * Encrypts a given text using AES-256-CBC algorithm.
//  *
//  * @param text - The plain text to be encrypted.
//  * @param key - A 32-byte key used for encryption.
//  *
//  * @returns The encrypted text in hexadecimal format.
//  */
// const encryptAES = (text: string, key: string): string => {
//   try {
//     if (!text || test.length < 1 || key.length < 32)
//       throw new Error("字符长度错误");
//     // Create a cipher instance with the specified algorithm, key, and initialization vector
//     const cipher = crypto.createCipheriv("aes-256-cbc", key, key.slice(0, 16));
//     // Encrypt the text and return the result in hexadecimal format
//     return cipher.update(text, "utf8", "hex") + cipher.final("hex");
//   } catch (error: unknown) {
//     console.log(error);
//     throw error;
//   }
// };

// /**
//  * Decrypts an encrypted text using AES-256-CBC algorithm.
//  *
//  * @param encryptedText - The text to be decrypted, in hexadecimal format.
//  * @param key - A 32-byte key used for decryption.
//  *
//  * @returns The decrypted plain text.
//  */
// const decryptAES = (encryptedText: string, key: string): string => {
//   try {
//     if (key.length < 32) throw new Error("字符长度错误");
//     // Create a decipher instance with the specified algorithm, key, and initialization vector
//     const decipher = crypto.createDecipheriv(
//       "aes-256-cbc",
//       key,
//       key.slice(0, 16)
//     );
//     // Decrypt the encrypted text and return the result in UTF-8 format
//     return (
//       decipher.update(encryptedText, "hex", "utf8") + decipher.final("utf8")
//     );
//   } catch (error: unknown) {
//     console.log(error);
//     throw error;
//   }
// };


// //  生成随机字符串,base64格式
// const makeRandString = (length: number) => {
//   return crypto.randomBytes(length).toString("base64");
// };

const generateAccessToken = () => {
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < 10; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result + "==";
};

/**
 * 生成验证码
 *
 * 生成4位验证码，图片宽80px，高28px，字符大小36px，2条干扰线
 * @returns {Promise<svgCaptcha.Captcha>} 验证码对象
 */
const getCaptcha = (type: CaptchaType, length?: number) => {
  try {
    let captcha;
    const size = length || 4;
    switch (type) {
      case CaptchaType.ALPHANUMERIC:
        captcha = captcha = svgCaptcha.create({
          size: size,
          ignoreChars: "0o1il",
          noise: 2,
          background: "#f2f2f2",
          color: true,
        });
        break;
      case CaptchaType.NUMERIC:
        captcha = svgCaptcha.create({
          size: size, // 长度
          ignoreChars: "0o1il", // 去除易混淆字符
          noise: 2, // 干扰线数量
          background: "#f2f2f2", // 背景色
          color: true, // 颜色
          charPreset: "0123456789", // 限制为纯数字
        });
        break;
      case CaptchaType.MATH:
        captcha = svgCaptcha.createMathExpr({
          size: size, //生成验证码长度
          width: 80, //图片宽度
          height: 28, //生成的图片高度
          color: true, //生成图片色彩度
          background: "#cc9966", //背景颜色
          noise: 3, //干扰线条数
        });
        break;
      default:
        captcha = svgCaptcha.create({
          size: size,
          ignoreChars: "0o1il",
          noise: 2,
          background: "#f2f2f2",
          color: true,
        });
        break;
    }
    const base64 = `data:image/svg+xml;base64,${Buffer.from(
      captcha.data
    ).toString("base64")}`;
    const id = uuidv4();
    return { base64, text: captcha.text as string, id };
  } catch (error: unknown) {
    console.log(error);
    throw error;
  }
};
// 格式化单个时间
function formatDate(date: Date | string | number): string {
  const d = new Date(date);
  const pad = (n: number) => (n < 10 ? "0" + n : n);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

// 自动识别对象中的所有 xxxAt 字段并格式化
 function autoFormatObjectDates(obj: any) {
  if (!obj || typeof obj !== "object") return;

  Object.keys(obj).forEach((key) => {
    if ((key.endsWith("At") || key.endsWith("Time")) && obj[key]) {
      obj[key] = formatDate(obj[key]);
    }
  });
}

// 自动识别数组中的所有对象并格式化 xxxAt 字段
 function autoFormatArrayDates(arr: any[]) {
  if (!Array.isArray(arr)) return;

  arr.forEach((item) => {
    autoFormatObjectDates(item);
  });
}

/**
 * 格式化日期
 * @param date - 日期
 * @param format - 格式
 * @returns 格式化后的日期
 */
function dayjsFormat(date: Date | string | number,format:string = "YYYY-MM-DD HH:mm:ss"): string {
return dayjs(date).format(format);
}

/**
 * 生成RSA密钥对
 * @returns 公钥和私钥
 */
function generateRsa() {
  const { publicKey, privateKey } = crypto.generateKeyPairSync("rsa", {
    modulusLength: 2048,
    publicKeyEncoding: {
      type: "spki",
      format: "pem",
    },
    privateKeyEncoding: {
      type: "pkcs8",
      format: "pem",
    },
  });
  return { publicKey, privateKey };
}

/**
 * 加密RSA
 * @param data - 需要加密的数据
 * @param publicKey - 公钥
 * @returns 加密后的数据
 */
function encryptRsa(data: string, publicKey: string) :string{
  return crypto.publicEncrypt(publicKey, Buffer.from(data)).toString("base64");
}

/**
 * 解密RSA
 * @param data - 加密后的数据
 * @param privateKey - 私钥
 * @returns 解密后的数据
 */
function decryptRsa(data: string, privateKey: string) {
  return crypto.privateDecrypt(privateKey, Buffer.from(data, "base64"));
}

function getLocalIp(){
  const interfaces = os.networkInterfaces();
  for (const key in interfaces) {
    const iface = interfaces[key];
    for (const alias of iface) {
      if (alias.family === 'IPv4' && !alias.internal) {
        return alias.address;
      }
    }
  }
  return '127.0.0.1';
}

async function getPublicIp(){
  try {
    const response = await axios.get('https://api.ipify.org?format=json',{
      timeout: 3000
    });
    return response.data.ip;
  } catch (error) {
    return '127.0.0.1';
  }
}

export {
  generateToken,
  verifyToken,
  radonString,
  hashPassword,
  replaceSensitiveInfo,
  whiteListRegex,
  getSelfSalt,
  comparePassword,
  getCaptcha,
  generateAccessToken,
  formatDate,
  autoFormatObjectDates,
  autoFormatArrayDates,
  dayjsFormat,
  generateRsa,
  encryptRsa,
  decryptRsa,
  getLocalIp,
  getPublicIp
};
