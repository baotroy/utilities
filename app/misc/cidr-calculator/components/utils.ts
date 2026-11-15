export interface ParsedIp {
  version: 4 | 6;
  value: bigint;
}

const B = (n: number | string) => BigInt(n);

export function parseIpv4(s: string): bigint | null {
  const parts = s.trim().split(".");
  if (parts.length !== 4) return null;
  let v = B(0);
  for (const p of parts) {
    if (!/^\d{1,3}$/.test(p) || Number(p) > 255) return null;
    v = (v << B(8)) | B(p);
  }
  return v;
}

export function parseIpv6(s: string): bigint | null {
  let text = s.trim().replace(/^\[|\]$/g, "").split("%")[0];
  // embedded IPv4 at the end (::ffff:1.2.3.4)
  const v4 = text.match(/(\d+\.\d+\.\d+\.\d+)$/);
  if (v4) {
    const n = parseIpv4(v4[1]);
    if (n === null) return null;
    text = text.slice(0, -v4[1].length) + `${(n >> B(16)).toString(16)}:${(n & B(0xffff)).toString(16)}`;
  }
  const halves = text.split("::");
  if (halves.length > 2) return null;
  const head = halves[0] ? halves[0].split(":") : [];
  const tail = halves.length === 2 && halves[1] ? halves[1].split(":") : [];
  const missing = 8 - head.length - tail.length;
  if (halves.length === 1 ? missing !== 0 : missing < 1) return null;
  const groups = [...head, ...Array(halves.length === 2 ? missing : 0).fill("0"), ...tail];
  let v = B(0);
  for (const g of groups) {
    if (!/^[0-9a-fA-F]{1,4}$/.test(g)) return null;
    v = (v << B(16)) | B(parseInt(g, 16));
  }
  return v;
}

export function parseIp(s: string): ParsedIp | null {
  if (s.includes(":")) {
    const v = parseIpv6(s);
    return v === null ? null : { version: 6, value: v };
  }
  const v = parseIpv4(s);
  return v === null ? null : { version: 4, value: v };
}

export function formatIp(v: bigint, version: 4 | 6, full = false): string {
  if (version === 4) {
    return [B(24), B(16), B(8), B(0)].map((s) => ((v >> s) & B(255)).toString()).join(".");
  }
  const groups = Array.from({ length: 8 }, (_, i) => ((v >> B(16 * (7 - i))) & B(0xffff)).toString(16));
  if (full) return groups.map((g) => g.padStart(4, "0")).join(":");
  // compress the longest run of zero groups
  let best = { start: -1, len: 0 };
  for (let i = 0; i < 8; ) {
    if (groups[i] !== "0") {
      i++;
      continue;
    }
    let j = i;
    while (j < 8 && groups[j] === "0") j++;
    if (j - i > best.len && j - i > 1) best = { start: i, len: j - i };
    i = j;
  }
  if (best.start < 0) return groups.join(":");
  return `${groups.slice(0, best.start).join(":")}::${groups.slice(best.start + best.len).join(":")}`;
}

export interface CidrInfo {
  version: 4 | 6;
  prefix: number;
  bits: number;
  ip: bigint;
  network: bigint;
  last: bigint;
  mask: bigint;
  size: bigint;
}

/** "10.0.0.0/8", "10.0.0.5 255.255.0.0" or "2001:db8::/32" */
export function parseCidr(input: string): CidrInfo {
  const t = input.trim();
  let ipText = t;
  let prefix: number | null = null;
  const slash = t.split("/");
  if (slash.length === 2) {
    ipText = slash[0];
    const p = slash[1].trim();
    if (/^\d+$/.test(p)) prefix = Number(p);
    else {
      const m = parseIpv4(p);
      if (m === null) throw new Error("The part after / must be a prefix length or a netmask");
      prefix = maskToPrefix(m);
    }
  } else {
    const parts = t.split(/\s+/);
    if (parts.length === 2) {
      ipText = parts[0];
      const m = parseIpv4(parts[1]);
      if (m === null) throw new Error("Second value is not a netmask");
      prefix = maskToPrefix(m);
    }
  }
  const ip = parseIp(ipText);
  if (!ip) throw new Error(`"${ipText}" is not a valid IPv4 or IPv6 address`);
  const bits = ip.version === 4 ? 32 : 128;
  if (prefix === null) prefix = bits;
  if (prefix < 0 || prefix > bits) throw new Error(`Prefix must be between 0 and ${bits}`);
  const all = (B(1) << B(bits)) - B(1);
  const mask = prefix === 0 ? B(0) : (all << B(bits - prefix)) & all;
  const network = ip.value & mask;
  const size = B(1) << B(bits - prefix);
  return { version: ip.version, prefix, bits, ip: ip.value, network, last: network + size - B(1), mask, size };
}

function maskToPrefix(mask: bigint): number {
  const bin = mask.toString(2).padStart(32, "0");
  if (!/^1*0*$/.test(bin)) throw new Error("The netmask is not contiguous");
  return bin.indexOf("0") === -1 ? 32 : bin.indexOf("0");
}

export function ipv4Class(v: bigint): string {
  const first = Number(v >> B(24));
  if (first < 128) return "A";
  if (first < 192) return "B";
  if (first < 224) return "C";
  if (first < 240) return "D (multicast)";
  return "E (reserved)";
}

export function ipv4Kind(v: bigint): string {
  const inRange = (cidr: string) => {
    const c = parseCidr(cidr);
    return v >= c.network && v <= c.last;
  };
  if (inRange("10.0.0.0/8") || inRange("172.16.0.0/12") || inRange("192.168.0.0/16")) return "Private (RFC 1918)";
  if (inRange("127.0.0.0/8")) return "Loopback";
  if (inRange("169.254.0.0/16")) return "Link-local";
  if (inRange("100.64.0.0/10")) return "Carrier-grade NAT (RFC 6598)";
  if (inRange("224.0.0.0/4")) return "Multicast";
  if (inRange("0.0.0.0/8")) return "This network";
  if (inRange("240.0.0.0/4")) return "Reserved";
  return "Public";
}

/** Split a block into equal subnets with a longer prefix (first `limit` shown). */
export function splitSubnets(info: CidrInfo, newPrefix: number, limit = 256): { count: bigint; list: string[] } {
  if (newPrefix < info.prefix || newPrefix > info.bits) return { count: B(0), list: [] };
  const count = B(1) << B(newPrefix - info.prefix);
  const step = B(1) << B(info.bits - newPrefix);
  const list: string[] = [];
  for (let i = B(0); i < count && i < B(limit); i++) {
    list.push(`${formatIp(info.network + i * step, info.version)}/${newPrefix}`);
  }
  return { count, list };
}

export const formatCount = (n: bigint) => n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
