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
  "/dev/ethereum-input-data-decoder": "abi input data transaction tx eth web3 giai ma",
  "/dev/universal-calldata-decoder": "abi input data transaction tx eth 4byte selector giai ma",
  "/dev/encode-function": "abi selector signature function event error hex 4byte eth solidity ma hoa",
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
  "/misc/qr-code-reader": "qrcode scan barcode camera quet ma",
  "/misc/ethereum-private-key-address-database": "eth wallet keys balance vi khoa",
  "/misc/color-picker": "hex rgb hsl colour palette mau",
  "/misc/ip-address-lookup": "ip geo location whois my ip dia chi",
  "/misc/dns-lookup": "domain record mx txt cname nameserver ten mien",
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
