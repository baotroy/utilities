import menus from "./menu";

/**
 * Extra search terms per tool (keyed by href), so a tool can be found by what
 * it does and not only by its name. Vietnamese terms are written without
 * accents; queries are normalized the same way.
 * Kept apart from menu.tsx so adding a tool there needs no change here.
 */
const KEYWORDS: Record<string, string> = {
  "/": "home trang chu",
  "/string/convert-case": "uppercase lowercase camel snake kebab pascal slug title sentence chu hoa chu thuong",
  "/string/text-compare": "diff difference so sanh van ban",
  "/string/regex-tester": "regexp regular expression match bieu thuc chinh quy",
  "/number/big-number-calculator": "bignumber bigint math add multiply divide power tinh so lon may tinh",
  "/number/number-conversion": "binary octal decimal hex hexadecimal base radix nhi phan thap luc phan he co so",
  "/number/decimal-to-fraction": "fraction ratio phan so thap phan",
  "/number/ethereum-unit-converter": "eth wei gwei ether web3 don vi",
  "/date/epoch-converter": "unix timestamp time date thoi gian",
  "/date/date-difference": "duration days between age khoang cach ngay thoi gian",
  "/date/timezone-converter": "time zone utc gmt mui gio",
  "/dev/uuid-generator": "guid v1 v4 v5 random id",
  "/dev/json-prettier": "format formatter beautify validate lint dinh dang",
  "/dev/jwt-decoder": "json web token hs256 sign verify bearer auth",
  "/dev/mongodb-objectid-time": "mongo object id timestamp date",
  "/dev/basic-authentication-header": "basic auth http authorization username password",
  "/dev/htpasswd-generator": "apache nginx bcrypt apr1 password mat khau",
  "/dev/universal-calldata-decoder": "abi input data transaction tx eth web3 ethereum 4byte selector giai ma",
  "/dev/transaction-decoder": "tx hash txhash explorer etherscan receipt event log revert reason internal trace eth web3 ethereum giai ma giao dich",
  "/dev/abi-selectors": "extract extractor encode function signature event topic error hex 4byte eth solidity ma hoa",
  "/dev/signature-to-selector": "function event error hex selector topic hash 4byte keccak eth solidity abi encode ma hoa chu ky",
  "/dev/array-sorter": "sort order json list object field multiple asc desc sap xep mang",
  "/dev/cron-editor": "crontab schedule job lich",
  "/dev/object-serializer": "json stringify minify javascript object",
  "/dev/hash-generator": "md5 sha1 sha256 sha512 hmac checksum bam ma hoa",
  "/dev/keccak256": "sha3 hash eth solidity bam",
  "/dev/http-status-codes": "404 500 200 301 response error",
  "/dev/diff-viewer": "compare text unified patch so sanh",
  "/dev/base64-encoder": "b64 encode decode ma hoa giai ma",
  "/dev/csp-header-generator": "content security policy header",
  "/dev/regex-builder": "regexp regular expression pattern bieu thuc chinh quy",
  "/file/file-to-base64": "b64 data uri upload encode ma hoa",
  "/file/chmod-calculator": "permission linux unix 755 644 rwx quyen",
  "/file/csv-to-json": "convert excel spreadsheet chuyen doi",
  "/file/json-to-csv": "convert excel spreadsheet export chuyen doi",
  "/image/image-resize": "crop rotate flip scale photo picture anh hinh cat xoay",
  "/image/favicon-generator": "icon ico png apple touch manifest bieu tuong",
  "/misc/random-password-generator": "secure random string mat khau ngau nhien",
  "/misc/password-strength-analyzer": "password checker strength meter zxcvbn crack time entropy kiem tra do manh mat khau",
  "/dev/aes-encrypt-decrypt": "aes gcm cbc ctr cipher encryption decryption pbkdf2 symmetric key ma hoa giai ma",
  "/misc/qr-code-reader": "qrcode scan barcode camera quet ma",
  "/misc/ethereum-private-key-address-database": "eth wallet keys balance vi khoa",
  "/misc/color-picker": "hex rgb hsl colour palette mau",
  "/misc/ip-address-lookup": "ip geo location whois my ip dia chi",
  "/misc/dns-lookup": "domain record mx txt cname nameserver ten mien",
  "/devops/docker-compose-converter": "docker compose yml yaml container run convert podman devops chuyen doi",
  "/devops/env-converter": "dotenv env environment variables json yaml config convert bien moi truong chuyen doi",
  "/devops/nginx-config-generator": "nginx server block reverse proxy ssl https vhost spa php config web server cau hinh",
  "/devops/robots-txt-generator": "robots seo crawler bot googlebot sitemap disallow gptbot ai chan",
  "/string/string-escape": "escape unescape backslash quote json html entities xml sql csv regex shell unicode ky tu dac biet",
  "/number/byte-converter": "bytes kb mb gb tb kib mib gib bit size storage bandwidth dung luong don vi",
  "/number/bitwise-calculator": "bit and or xor not shift binary mask two complement nhi phan phep toan bit",
  "/dev/abi-encoder": "calldata encode function data abi transaction tx eth web3 ethereum solidity ma hoa",
  "/dev/event-log-decoder": "event log topic receipt emit abi eth web3 ethereum 4byte giai ma su kien",
  "/dev/revert-decoder": "revert reason error panic custom error require failed transaction eth web3 ethereum solidity loi giai ma",
  "/dev/signature-verifier": "signature sign verify recover ecrecover eip712 eip191 personal sign typed data permit eth web3 chu ky xac minh",
  "/dev/address-tools": "address checksum eip55 create create2 ens deploy contract eth web3 ethereum dia chi",
  "/dev/storage-slot-reader": "storage slot getstorageat mapping proxy eip1967 implementation erc7201 eth web3 solidity",
  "/dev/yaml-json-converter": "yaml yml toml json convert config chuyen doi",
  "/dev/url-encoder": "url uri encode decode percent query string parse parameters link ma hoa",
  "/dev/json-path": "jsonpath query filter json select extract truy van",
  "/dev/json-diff": "json compare diff difference structure so sanh",
  "/file/base64-to-file": "base64 b64 decode data uri download file image pdf giai ma",
  "/image/image-compressor": "compress optimize jpeg jpg png webp avif convert format size nen anh chuyen doi",
  "/misc/cidr-calculator": "cidr subnet ip ipv4 ipv6 netmask network mask range mang",
};

export interface MenuSearchResult {
  label: string;
  href: string;
  group: string;
  beta?: boolean;
}

interface IndexEntry extends MenuSearchResult {
  name: string; // normalized label
  words: string[]; // normalized words of the label and keywords
  extra: string; // normalized group + keywords + path
}

/** Lowercase and strip diacritics ("Mã hoá" -> "ma hoa"). */
export const normalizeSearch = (text: string): string =>
  text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .trim();

const index: IndexEntry[] = menus.flatMap((group) =>
  group.items.map((item) => {
    const name = normalizeSearch(item.label);
    return {
      label: item.label,
      href: item.href,
      group: group.groupName || "",
      beta: item.beta,
      name,
      words: `${name} ${KEYWORDS[item.href] || ""}`.split(/[^a-z0-9]+/).filter(Boolean),
      extra: normalizeSearch(
        `${group.groupName || ""} ${KEYWORDS[item.href] || ""} ${item.href.replace(/[/-]/g, " ")}`
      ),
    };
  })
);

// true when every character of `needle` appears in `haystack` in order
const isSubsequence = (needle: string, haystack: string): boolean => {
  let i = 0;
  for (let j = 0; j < haystack.length && i < needle.length; j++) {
    if (haystack[j] === needle[i]) i++;
  }
  return i === needle.length;
};

// Score one query word against a tool; 0 means no match
const scoreToken = (token: string, entry: IndexEntry): number => {
  if (entry.name.startsWith(token)) return 100;
  if (entry.name.split(/[^a-z0-9]+/).some((word) => word.startsWith(token))) return 80;
  if (entry.name.includes(token)) return 60;
  if (entry.extra.split(" ").some((word) => word.startsWith(token))) return 40;
  if (entry.extra.includes(token)) return 30;
  // fuzzy inside one word, same first letter: "b64" -> "base64", "pwd" -> "password"
  if (
    token.length >= 3 &&
    entry.words.some((word) => word[0] === token[0] && isSubsequence(token, word))
  ) {
    return 10;
  }
  return 0;
};

/** Find tools matching every word of the query, best match first. */
export function searchMenu(query: string): MenuSearchResult[] {
  const tokens = normalizeSearch(query).split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return [];

  const scored: { entry: IndexEntry; score: number }[] = [];
  for (const entry of index) {
    let total = 0;
    let matched = true;
    for (const token of tokens) {
      const score = scoreToken(token, entry);
      if (score === 0) {
        matched = false;
        break;
      }
      total += score;
    }
    if (matched) scored.push({ entry, score: total });
  }

  return scored
    .sort((a, b) => b.score - a.score || a.entry.label.localeCompare(b.entry.label))
    .map(({ entry }) => ({
      label: entry.label,
      href: entry.href,
      group: entry.group,
      beta: entry.beta,
    }));
}
