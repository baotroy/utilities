import { parse } from "@prantlf/jsonlint";
import jwt, { Secret } from "jsonwebtoken";
import { TypeAlgorithm } from "./type";
// JSON
export function prettyJson(str: string, indent = 2): string {
  try {
    const obj = JSON.parse(str);
    return JSON.stringify(obj, null, indent);
  } catch (error: any) {
    return validateJSON(str);
  }
}

export function validateJSON(e: string): string {
  try {
    parse(e);
    return "";
  } catch (e: any) {
    return e.message;
  }
}

export function validJSON(str: string): boolean {
  try {
    JSON.parse(str);
    return true;
  } catch (error) {
    // console.error(error, str, typeof str);
    return false;
  }
}

export const base64UrlEncode = (input: string): string => {
  if (!input) return "";
  const base64 = Buffer.from(input).toString("base64");
  const base64Url = base64
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  return base64Url;
};

export const base64UrlDecode = (input: string): string => {
  if (!input) return "";
  const base64 = input.replace(/-/g, "+").replace(/_/g, "/");
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const decoded = Buffer.from(base64 + padding, "base64").toString("utf-8");
  return decoded;
};

export const createJwt = (
  payload: string | object | Buffer,
  algorithm: TypeAlgorithm,
  secret: Secret
): string => {
  return jwt.sign(payload, secret, { algorithm });
};

// export const jwtDecode = (token: string) => {
//   // if (typeof token !== "string") {
//   //     throw new InvalidTokenError("Invalid token specified: must be a string");
//   // }
//   // options || (options = {});
//   const part = token.split(".")[0];
//   // if (typeof part !== "string") {
//   //     throw new InvalidTokenError(`Invalid token specified: missing part #${pos + 1}`);
//   // }
//   let decoded;
//   try {
//     decoded = base64UrlDecode(part);
//   } catch (e) {
//     ret
//     // throw new InvalidTokenError(
//     //   `Invalid token specified: invalid base64 for part #${pos + 1} (${
//     //     e.message
//     //   })`
//     // );
//   }
//   try {
//     return JSON.parse(decoded);
//   } catch (e) {
//     // throw new InvalidTokenError(
//     //   `Invalid token specified: invalid json for part #${pos + 1} (${
//     //     e.message
//     //   })`
//     // );
//   }
// };
// export const verifyJwt = (token: string, secret: Secret, algorithms: TypeAlgorithm) : JwtPayload | string=> {
//   try {
//     const res = jwt.verify(token, secret, {algorithms: [algorithms] });
//     return res;
//   } catch (error: any) {
//     console.error(error)
//     return {};
//   }
// }
