// JSON
export function prettyJson(str: string, indent: number): string {
    try {
      const obj = JSON.parse(str);
      return JSON.stringify(obj, null, indent);
    } catch (error) {
      return str;
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
  