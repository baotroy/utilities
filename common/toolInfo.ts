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
  "/dev/universal-calldata-decoder": "Decode calldata with or without an ABI, including nested calls.",
  "/dev/abi-selectors": "List the selectors of every function, event and error in a contract ABI.",
  "/dev/signature-to-selector": "Turn a function, event or error signature into its hex selector or topic hash.",
  "/dev/array-sorter": "Sort an array of numbers, strings or objects by value or by several fields.",
  "/dev/cron-editor": "Write a cron expression and see when it will run next.",
  "/dev/object-serializer": "Convert a JavaScript object literal to JSON and back.",
  "/dev/hash-generator": "Compute MD5, SHA-1, SHA-256 and SHA-512 hashes, with HMAC.",
  "/dev/keccak256": "Compute the Keccak-256 hash used by Ethereum.",
  "/dev/http-status-codes": "Look up what an HTTP status code means.",
  "/dev/diff-viewer": "Show the differences between two texts as a unified diff.",
  "/dev/base64-encoder": "Encode text to Base64 or decode it back.",
  "/dev/csp-header-generator": "Compose a Content-Security-Policy header step by step.",
  "/dev/regex-builder": "Build a regular expression from ready-made blocks.",
  "/dev/block-timestamp": "Find the block closest to a date, the time of a block, or the block range of a period.",
  "/dev/evm-transaction-simulator": "Simulate an EVM transaction against an RPC node before sending it.",
  "/dev/transaction-decoder": "Decode a transaction by its hash: function, arguments, events, transfers and revert reason.",
  "/file/file-to-base64": "Encode any file as Base64 or a data URI.",
  "/file/chmod-calculator": "Work out Unix file permissions in numeric and symbolic form.",
  "/file/csv-to-json": "Convert CSV data to JSON.",
  "/file/json-to-csv": "Convert a JSON array to CSV.",
  "/image/image-resize": "Resize, crop, rotate and flip images in the browser.",
  "/image/favicon-generator": "Create a full favicon set from one image.",
  "/misc/random-password-generator": "Generate strong random passwords.",
  "/misc/password-strength-analyzer": "Check how hard a password is to crack and why.",
  "/dev/aes-encrypt-decrypt": "Encrypt and decrypt text with AES-GCM, CBC or CTR using a password or key.",
  "/misc/qr-code-reader": "Scan a QR code from an image or camera, or generate one.",
  "/misc/ethereum-private-key-address-database": "Browse Ethereum private keys and their addresses page by page.",
  "/misc/color-picker": "Pick a color and convert between HEX, RGB and HSL.",
  "/misc/ip-address-lookup": "Show your public IP address and where it is located.",
  "/misc/dns-lookup": "Query the DNS records of a domain.",
  "/devops/docker-compose-converter": "Turn docker run commands into a docker-compose.yml, and compose services back into docker run.",
  "/devops/env-converter": "Convert .env files to JSON or YAML, and flatten JSON / YAML config into .env variables.",
  "/devops/nginx-config-generator": "Build an NGINX server block for a reverse proxy, SPA, static site or PHP, with HTTPS.",
  "/devops/robots-txt-generator": "Create a robots.txt with rules per crawler and sitemaps, and test a URL against it.",
  "/string/string-escape": "Escape or unescape text for JSON, JavaScript, HTML, XML, SQL, CSV, regex and shell.",
  "/number/byte-converter": "Convert between bytes, KB, MB, GB and KiB, MiB, GiB, with transfer time.",
  "/number/bitwise-calculator": "AND, OR, XOR, NOT and shifts on 8 to 256-bit integers, shown bit by bit.",
  "/dev/abi-encoder": "Pick a function from an ABI, fill in its arguments and get the calldata.",
  "/dev/event-log-decoder": "Decode event logs from topics and data, a log JSON or a transaction hash.",
  "/dev/revert-decoder": "Find out why a call reverted: Error(string), Panic codes and custom errors.",
  "/dev/signature-verifier": "Recover and check the signer of a personal_sign, EIP-712 or raw-hash signature.",
  "/dev/address-tools": "Checksum addresses, predict CREATE and CREATE2 addresses, resolve ENS names.",
  "/dev/storage-slot-reader": "Compute storage slots for mappings and arrays and read them from the chain.",
  "/dev/yaml-json-converter": "Convert between YAML, TOML and JSON.",
  "/dev/url-encoder": "Percent-encode or decode text, and split a URL into its parts and parameters.",
  "/dev/json-path": "Query JSON with JSONPath expressions and see each match with its path.",
  "/dev/json-diff": "Compare two JSON documents by structure and list what was added, removed or changed.",
  "/file/base64-to-file": "Turn Base64 or a data URI back into a file, with type detection and preview.",
  "/image/image-compressor": "Compress images and convert between JPEG, PNG, WebP and AVIF in the browser.",
  "/misc/cidr-calculator": "Network, broadcast, host range and subnets of an IPv4 or IPv6 CIDR block.",
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

// Favorite tools (hrefs, in the order they were starred), kept in localStorage
const FAVORITES_KEY = "favorite-tools";
export const FAVORITES_EVENT = "favorite-tools";

export function readFavoriteTools(): string[] {
  try {
    const value = JSON.parse(localStorage.getItem(FAVORITES_KEY) || "[]");
    return Array.isArray(value) ? value.filter((v) => typeof v === "string") : [];
  } catch {
    return [];
  }
}

export function toggleFavoriteTool(href: string): boolean {
  const list = readFavoriteTools();
  const on = !list.includes(href);
  try {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(on ? [...list, href] : list.filter((h) => h !== href)));
    window.dispatchEvent(new Event(FAVORITES_EVENT));
  } catch {
    // storage unavailable: favorites are optional
  }
  return on;
}
