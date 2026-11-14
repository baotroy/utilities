/**
 * One-line description per tool (keyed by href), shown on the home page.
 * Add an entry here when adding a tool to menu.tsx; a tool without one is
 * still listed, just without the description.
 */
export const TOOL_DESCRIPTIONS: Record<string, string> = {
  "/string/convert-case": "Switch text between UPPER, lower, camelCase, snake_case, kebab-case and more.",
  "/string/text-compare": "Compare two texts side by side and highlight what changed.",
  "/string/regex-tester": "Test a regular expression against sample text with live matches.",
  "/number/big-number-calculator": "Add, multiply, divide and raise numbers of any size without losing precision.",
  "/number/number-conversion": "Convert numbers between binary, octal, decimal and hexadecimal.",
  "/number/decimal-to-fraction": "Turn a decimal into its simplest fraction.",
  "/number/ethereum-unit-converter": "Convert between wei, gwei, ether and the other Ethereum units.",
  "/date/epoch-converter": "Convert Unix timestamps to readable dates and back.",
  "/date/date-difference": "Count the days, hours and minutes between two dates.",
  "/date/timezone-converter": "See what a time is in other time zones.",
  "/dev/uuid-generator": "Generate UUIDs in bulk, in several versions.",
  "/dev/json-prettier": "Format, validate and minify JSON.",
  "/dev/jwt-decoder": "Decode, verify and sign JSON Web Tokens (HMAC, RSA, ECDSA, EdDSA).",
  "/dev/mongodb-objectid-time": "Read the creation time inside a MongoDB ObjectId, or build one from a date.",
  "/dev/basic-authentication-header": "Build an HTTP Basic Authorization header from a username and password.",
  "/dev/htpasswd-generator": "Create htpasswd entries for NGINX or Apache basic auth.",
  "/dev/ethereum-input-data-decoder": "Decode Ethereum transaction input data with an ABI.",
  "/dev/universal-calldata-decoder": "Decode calldata without an ABI, including nested calls.",
  "/dev/encode-function": "Get the selector and hash of a Solidity function, event or error.",
  "/dev/cron-editor": "Write a cron expression and see when it will run next.",
  "/dev/object-serializer": "Convert a JavaScript object literal to JSON and back.",
  "/dev/hash-generator": "Compute MD5, SHA-1, SHA-256 and SHA-512 hashes, with HMAC.",
  "/dev/keccak256": "Compute the Keccak-256 hash used by Ethereum.",
  "/dev/http-status-codes": "Look up what an HTTP status code means.",
  "/dev/diff-viewer": "Show the differences between two texts as a unified diff.",
  "/dev/base64-encoder": "Encode text to Base64 or decode it back.",
  "/dev/csp-header-generator": "Compose a Content-Security-Policy header step by step.",
  "/dev/regex-builder": "Build a regular expression from ready-made blocks.",
  "/dev/evm-transaction-simulator": "Simulate an EVM transaction against an RPC node before sending it.",
  "/file/file-to-base64": "Encode any file as Base64 or a data URI.",
  "/file/chmod-calculator": "Work out Unix file permissions in numeric and symbolic form.",
  "/file/csv-to-json": "Convert CSV data to JSON.",
  "/file/json-to-csv": "Convert a JSON array to CSV.",
  "/image/image-resize": "Resize, crop, rotate and flip images in the browser.",
  "/image/favicon-generator": "Create a full favicon set from one image.",
  "/misc/random-password-generator": "Generate strong random passwords.",
  "/misc/qr-code-reader": "Scan a QR code from an image or camera, or generate one.",
  "/misc/ethereum-private-key-address-database": "Browse Ethereum private keys and their addresses page by page.",
  "/misc/color-picker": "Pick a color and convert between HEX, RGB and HSL.",
  "/misc/ip-address-lookup": "Show your public IP address and where it is located.",
  "/misc/dns-lookup": "Query the DNS records of a domain.",
};

// Recently opened tools (hrefs, newest first), kept in localStorage
const RECENT_KEY = "recent-tools";
const RECENT_MAX = 8;

export function readRecentTools(): string[] {
  try {
    const value = JSON.parse(localStorage.getItem(RECENT_KEY) || "[]");
    return Array.isArray(value) ? value.filter((v) => typeof v === "string") : [];
  } catch {
    return [];
  }
}

export function rememberTool(href: string): void {
  if (!href || href === "/") return;
  try {
    const list = [href, ...readRecentTools().filter((h) => h !== href)];
    localStorage.setItem(RECENT_KEY, JSON.stringify(list.slice(0, RECENT_MAX)));
  } catch {
    // storage unavailable (private mode): recents are optional
  }
}
