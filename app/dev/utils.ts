import { parse } from "@prantlf/jsonlint";
// JSON
export function prettyJson(str: string, indent: number): string {
  try {
    const obj = JSON.parse(str);
    return JSON.stringify(obj, null, indent);
  } catch (error: any) {
    return validateJSON(str)
  }
}

export function validateJSON(e: string): string {
  try {
    parse(e);
    return ""
  } catch (e: any) {
    return e.message
  }
}

export function validJSON(str: string): boolean {
  try {
    JSON.parse(str);
    return true;
  } catch (error) {
    return false;
  }
}
