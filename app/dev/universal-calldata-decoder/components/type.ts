// One decoded parameter (recursive for arrays and tuples)
export interface IDecodedParam {
  name: string;
  type: string;
  baseType: string;
  // Display value: string for elementary types, joined text for arrays/tuples
  value: string;
  // tuple members
  components?: IDecodedParam[];
  // array elements
  arrayChildren?: IDecodedParam[];
  // bytes that turned out to be another call
  functionFragment?: IFunctionFragement | null;
  // bytes4 that matches known function selectors
  selectorSignatures?: string[];
}

export interface IFunctionFragement {
  type: string;
  name: string;
  // full signature, e.g. transfer(address,uint256)
  signature?: string;
  selector?: string;
  inputs: IDecodedParam[];
  // true when re-encoding the decoded values gives back the same calldata
  exact?: boolean;
  // length of the re-encoded calldata (how much of the input it explains)
  matchedLength?: number;
  // where the signature came from: the ABI the user entered or the database
  source?: "abi" | "database";
}

export interface IDecodeResult {
  selector: string;
  // normalized calldata (0x-prefixed)
  calldata: string;
  // Signatures from the database that decode this calldata, best first
  candidates: string[];
  // Decoded with candidates[0]; null when no signature is known/usable
  fragment: IFunctionFragement | null;
  // Raw 32-byte words after the selector (shown when fragment is null)
  words: string[];
  // true when an ABI was entered but it has no function with this selector
  notInAbi?: boolean;
}
