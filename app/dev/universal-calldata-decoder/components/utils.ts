import { Interface } from "ethers";
import { IFunctionFragement } from "./type";

const signatureDataApi = process.env.NEXT_PUBLIC_SIGNATURE_DATA_API;
const sourcify4ByteApi =
  "https://api.4byte.sourcify.dev/signature-database/v1/lookup?function=";

// Maximum recursion depth to prevent infinite loops
const MAX_DEPTH = 10;

// Both APIs answer with:
// { "result": { "function": { "0x...": [{ "name": "transfer(address,uint256)" }] } } }
async function fetchSignatures(url: string, selector: string): Promise<string[]> {
  try {
    const response = await fetch(url + selector);
    if (!response.ok) return [];
    const data = await response.json();
    const list = data?.result?.function?.[selector];
    return Array.isArray(list)
      ? list
          .map((item: { name?: string }) => item?.name)
          .filter((name): name is string => !!name)
      : [];
  } catch (error) {
    console.error("Signature lookup failed:", error);
    return [];
  }
}

// Cache lookups per selector: nested calldata (multicall, batches) asks for
// the same selector many times, which used to fire one request each time
const signatureCache = new Map<string, Promise<string[]>>();

// Fetch all known signatures for a selector, with fallback
function fetchFunctionInterfaces(selector: string): Promise<string[]> {
  let cached = signatureCache.get(selector);
  if (!cached) {
    cached = (async () => {
      // Try OpenChain API first (if configured)
      if (signatureDataApi) {
        const result = await fetchSignatures(signatureDataApi, selector);
        if (result.length > 0) return result;
      }
      // Fallback to Sourcify 4byte API
      return fetchSignatures(sourcify4ByteApi, selector);
    })();
    signatureCache.set(selector, cached);
    // do not keep failed/empty lookups, so a retry can succeed
    cached.then((list) => {
      if (list.length === 0) signatureCache.delete(selector);
    });
  }
  return cached;
}

// Check if a hex string looks like valid calldata (starts with 0x + 4 byte selector)
function isValidCalldata(value: string): boolean {
  if (typeof value !== "string") return false;
  // Must be hex string starting with 0x, at least 10 chars (0x + 8 hex chars for selector)
  if (!value.startsWith("0x") || value.length < 10) return false;
  // Must be valid hex
  if (!/^0x[0-9a-fA-F]+$/.test(value)) return false;
  // Skip null selector to avoid spam results
  if (value.slice(0, 10) === "0x00000000") return false;
  return true;
}

// Convert bytes value to hex string
function toHexString(value: any): string {
  if (typeof value === "string") {
    return value.startsWith("0x") ? value : "0x" + value;
  }
  if (value instanceof Uint8Array) {
    return (
      "0x" +
      Array.from(value)
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("")
    );
  }
  if (Buffer.isBuffer(value)) {
    return "0x" + value.toString("hex");
  }
  return "";
}

// Try to decode bytes as calldata recursively with depth tracking
async function tryDecodeAsCalldata(
  value: string,
  depth: number = 0
): Promise<IFunctionFragement | null> {
  // Check depth to prevent infinite recursion
  if (depth >= MAX_DEPTH) {
    console.log(`Max depth ${MAX_DEPTH} reached, stopping recursion`);
    return null;
  }

  if (!isValidCalldata(value)) return null;

  try {
    const decoded = await decodeFunctionDataNoABI(value, false, depth + 1);
    return decoded;
  } catch {
    return null;
  }
}

export const decodeFunctionDataNoABI = async (
  inputData: string,
  root: boolean = false,
  depth: number = 0
): Promise<IFunctionFragement | null> => {
  // Check depth limit
  if (depth >= MAX_DEPTH) {
    console.log(`Max depth ${MAX_DEPTH} reached at decodeFunctionDataNoABI`);
    return null;
  }

  inputData = inputData.trim();
  // The signature databases are keyed by lowercase selector
  const selector = getFunctionName(inputData).toLowerCase();

  // Skip null selector
  if (selector === "0x00000000") {
    if (root) throw Error("Cannot decode null selector");
    return null;
  }

  // Fetch function signatures using fallback strategy
  const candidates = await fetchFunctionInterfaces(selector);

  if (candidates.length === 0) {
    if (root) throw Error("Function signature not found");
    return null;
  }

  // Selectors can collide: try every known signature until one decodes
  for (const funcRes of candidates) {
    try {
      const iface = new Interface([`function ${funcRes}`]);
      const funcFrag = iface.getFunction(funcRes);
      if (!funcFrag) continue;

      const decodeData = iface.decodeFunctionData(funcFrag, inputData);

      const newFuncFrag: IFunctionFragement = {
        type: "function",
        name: funcFrag.name,
        inputs: [],
      };

      // Append inputs to newFuncFrag
      for (let i = 0; i < funcFrag.inputs.length; i++) {
        const paramType = funcFrag.inputs[i];
        const newInput = await getParamType(paramType, decodeData[i], depth);
        newFuncFrag.inputs.push(newInput);
      }

      return newFuncFrag;
    } catch (e) {
      console.error(e);
    }
  }

  if (!root) {
    return null;
  }
  throw Error("Unable to decode function data");
};

// Recursively process parameter types with depth tracking
async function getParamType(paramType: any, value: any, depth: number = 0) {
  const newParamType: any = {
    name: paramType.name || "",
    type: paramType.type,
    baseType: paramType.baseType,
    value: paramType.arrayChildren ? value.flat().join(",") : value,
  };

  // case array type[], eg: uint256[], string[], address[], tuple[]
  if (paramType.baseType === "array" && paramType.arrayChildren) {
    const child = paramType.arrayChildren;
    newParamType.arrayChildren = await Promise.all(
      value.map((childValue: any) => {
        return getParamType(child, childValue, depth);
      })
    );
  } else {
    if (paramType.baseType === "tuple" && paramType.components) {
      newParamType.components = await Promise.all(
        paramType.components.map((child: any, index: number) => {
          return getParamType(child, value[index], depth);
        })
      );
    } else if (paramType.baseType === "bytes" || paramType.type === "bytes") {
      // Try to decode dynamic bytes as nested calldata
      const hexValue = toHexString(value);
      if (isValidCalldata(hexValue)) {
        newParamType.functionFragment = await tryDecodeAsCalldata(
          hexValue,
          depth
        );
      }
    } else if (
      paramType.type.startsWith("bytes") &&
      paramType.type !== "bytes"
    ) {
      // Handle fixed-size bytes (bytes1-bytes32)
      // Try to decode as calldata recursively
      const hexValue = toHexString(value);
      if (isValidCalldata(hexValue)) {
        newParamType.functionFragment = await tryDecodeAsCalldata(
          hexValue,
          depth
        );
      }
    }
    newParamType.value = value;
  }
  return newParamType;
}

function getFunctionName(inputData: string) {
  return inputData.substring(0, 10);
}
