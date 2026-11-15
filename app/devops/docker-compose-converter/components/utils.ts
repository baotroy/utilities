import yaml from "js-yaml";

/* ------------------------------------------------------------------ */
/* Shell helpers                                                       */
/* ------------------------------------------------------------------ */

/**
 * Split a shell command line into words, honouring single quotes, double
 * quotes and backslash escapes. `;`, `&&`, `||` and `|` are returned as their
 * own tokens so several commands on one line can be told apart.
 */
export function shellSplit(input: string): string[] {
  const tokens: string[] = [];
  let cur = "";
  let has = false;
  let i = 0;
  const push = () => {
    if (has) tokens.push(cur);
    cur = "";
    has = false;
  };
  while (i < input.length) {
    const c = input[i];
    if (c === "'") {
      const end = input.indexOf("'", i + 1);
      const stop = end === -1 ? input.length : end;
      cur += input.slice(i + 1, stop);
      has = true;
      i = stop + 1;
    } else if (c === '"') {
      i++;
      while (i < input.length && input[i] !== '"') {
        if (input[i] === "\\" && i + 1 < input.length && '"\\$`'.includes(input[i + 1])) {
          cur += input[i + 1];
          i += 2;
        } else {
          cur += input[i++];
        }
      }
      has = true;
      i++;
    } else if (c === "\\") {
      if (i + 1 < input.length) cur += input[i + 1];
      has = true;
      i += 2;
    } else if (/\s/.test(c)) {
      push();
      i++;
    } else if (c === ";" || c === "|" || c === "&") {
      push();
      const two = input.slice(i, i + 2);
      if (two === "&&" || two === "||") {
        tokens.push(two);
        i += 2;
      } else {
        tokens.push(c);
        i++;
      }
    } else {
      cur += c;
      has = true;
      i++;
    }
  }
  push();
  return tokens;
}

/** Quote a word for a POSIX shell only when it needs it. */
export function shellQuote(value: string): string {
  if (value === "") return "''";
  if (/^[A-Za-z0-9_\-./:=@,+%]+$/.test(value)) return value;
  return "'" + value.replace(/'/g, "'\\''") + "'";
}

/* ------------------------------------------------------------------ */
/* docker run -> compose                                               */
/* ------------------------------------------------------------------ */

type Dict = Record<string, any>;

// Flags that take a value. Short aliases are mapped to their long name.
const SHORT_ALIASES: Record<string, string> = {
  p: "publish",
  v: "volume",
  e: "env",
  w: "workdir",
  u: "user",
  h: "hostname",
  l: "label",
  m: "memory",
  c: "cpu-shares",
  a: "attach",
  d: "detach",
  i: "interactive",
  t: "tty",
  P: "publish-all",
};

const BOOLEAN_FLAGS = new Set([
  "detach",
  "interactive",
  "tty",
  "rm",
  "init",
  "privileged",
  "read-only",
  "publish-all",
  "no-healthcheck",
  "oom-kill-disable",
  "sig-proxy",
  "disable-content-trust",
  "quiet",
  "help",
]);

const VALUE_FLAGS = new Set([
  "name", "publish", "volume", "mount", "env", "env-file", "network", "net", "network-alias",
  "net-alias", "restart", "workdir", "user", "hostname", "entrypoint", "label", "label-file",
  "add-host", "dns", "dns-search", "dns-option", "dns-opt", "cap-add", "cap-drop", "device",
  "link", "log-driver", "log-opt", "memory", "memory-reservation", "memory-swap", "cpus",
  "cpu-shares", "cpuset-cpus", "gpus", "health-cmd", "health-interval", "health-timeout",
  "health-retries", "health-start-period", "platform", "pull", "shm-size", "stop-signal",
  "stop-timeout", "sysctl", "tmpfs", "ulimit", "ipc", "pid", "uts", "userns", "security-opt",
  "expose", "group-add", "volumes-from", "runtime", "mac-address", "ip", "ip6", "cgroup-parent",
  "oom-score-adj", "attach", "cidfile", "detach-keys", "domainname", "storage-opt",
  "pids-limit", "cpu-period", "cpu-quota", "blkio-weight", "isolation", "cgroupns",
]);

// Simple one-to-one mappings: flag -> compose key.
const SCALAR_MAP: Record<string, string> = {
  restart: "restart",
  workdir: "working_dir",
  user: "user",
  hostname: "hostname",
  domainname: "domainname",
  "memory": "mem_limit",
  "memory-reservation": "mem_reservation",
  "memory-swap": "memswap_limit",
  cpus: "cpus",
  "cpu-shares": "cpu_shares",
  "cpuset-cpus": "cpuset",
  "cpu-period": "cpu_period",
  "cpu-quota": "cpu_quota",
  platform: "platform",
  pull: "pull_policy",
  "shm-size": "shm_size",
  "stop-signal": "stop_signal",
  ipc: "ipc",
  pid: "pid",
  uts: "uts",
  userns: "userns_mode",
  runtime: "runtime",
  "mac-address": "mac_address",
  "cgroup-parent": "cgroup_parent",
  "oom-score-adj": "oom_score_adj",
  "pids-limit": "pids_limit",
  "blkio-weight": "blkio_config",
  isolation: "isolation",
  cgroupns: "cgroup",
};

const LIST_MAP: Record<string, string> = {
  publish: "ports",
  "env-file": "env_file",
  "add-host": "extra_hosts",
  dns: "dns",
  "dns-search": "dns_search",
  "dns-option": "dns_opt",
  "dns-opt": "dns_opt",
  "cap-add": "cap_add",
  "cap-drop": "cap_drop",
  device: "devices",
  link: "links",
  "security-opt": "security_opt",
  expose: "expose",
  "group-add": "group_add",
  "volumes-from": "volumes_from",
  tmpfs: "tmpfs",
  "label-file": "label_file",
};

const NUMERIC_KEYS = new Set(["cpu_shares", "cpu_period", "cpu_quota", "oom_score_adj", "pids_limit"]);
const BUILTIN_NETWORKS = new Set(["host", "bridge", "none", "default"]);

export interface ConvertResult {
  output: string;
  warnings: string[];
}

interface RunCommand {
  args: string[];
}

/** Find every `docker run` / `docker container run` / `podman run` in the text. */
function findRunCommands(text: string): RunCommand[] {
  // Join line continuations: bash "\", PowerShell "`" and cmd "^".
  const joined = text.replace(/[\\`^][ \t]*\r?\n/g, " ");
  const tokens = shellSplit(joined.replace(/\r?\n/g, " ; "));
  const commands: RunCommand[] = [];
  let current: string[] = [];
  const flush = () => {
    if (current.length) {
      const words = [...current];
      while (words.length && /^(sudo|-\S+)$/.test(words[0])) words.shift();
      const bin = words[0]?.split("/").pop();
      if (bin === "docker" || bin === "podman" || bin === "nerdctl") {
        let rest = words.slice(1);
        if (rest[0] === "container") rest = rest.slice(1);
        if (rest[0] === "run" || rest[0] === "create") commands.push({ args: rest.slice(1) });
      }
    }
    current = [];
  };
  for (const tok of tokens) {
    if ([";", "&&", "||", "|", "&"].includes(tok)) flush();
    else current.push(tok);
  }
  flush();
  return commands;
}

function serviceNameFromImage(image: string): string {
  const noDigest = image.split("@")[0];
  const last = noDigest.split("/").pop() || "app";
  const name = last.split(":")[0];
  return name.replace(/[^a-zA-Z0-9_-]/g, "-").toLowerCase() || "app";
}

function parseMount(spec: string, namedVolumes: Set<string>, warnings: string[]): any {
  const out: Dict = {};
  for (const part of spec.split(",")) {
    const [k, ...rest] = part.split("=");
    const v = rest.join("=");
    switch (k) {
      case "type":
        out.type = v;
        break;
      case "source":
      case "src":
        out.source = v;
        break;
      case "target":
      case "destination":
      case "dst":
        out.target = v;
        break;
      case "readonly":
      case "ro":
        out.read_only = v === "" || v === "true" || v === "1";
        break;
      case "bind-propagation":
        out.bind = { ...(out.bind || {}), propagation: v };
        break;
      case "volume-nocopy":
        out.volume = { ...(out.volume || {}), nocopy: v === "" || v === "true" };
        break;
      case "tmpfs-size":
        out.tmpfs = { ...(out.tmpfs || {}), size: v };
        break;
      default:
        warnings.push(`--mount option "${k}" was not converted.`);
    }
  }
  if (!out.type) out.type = "volume";
  if (out.type === "volume" && out.source) namedVolumes.add(out.source);
  return out;
}

function isNamedVolume(source: string): boolean {
  return !!source && !/^[./~$]/.test(source) && !/^[A-Za-z]:[\\/]/.test(source) && !source.includes("/");
}

/** Parse "CMD" into a healthcheck test array. */
function healthTest(cmd: string): string[] {
  return ["CMD-SHELL", cmd];
}

function convertOne(args: string[], warnings: string[], namedVolumes: Set<string>, networks: Set<string>): { name: string; service: Dict } {
  const svc: Dict = {};
  const env: Dict = {};
  const labels: Dict = {};
  const volumes: any[] = [];
  const netList: string[] = [];
  const netAliases: string[] = [];
  let ipv4: string | undefined;
  let ipv6: string | undefined;
  let name: string | undefined;
  const logOpts: Dict = {};
  const health: Dict = {};
  const sysctls: Dict = {};
  const ulimits: Dict = {};
  let i = 0;

  const listPush = (key: string, value: string) => {
    svc[key] = svc[key] || [];
    svc[key].push(value);
  };

  const apply = (flag: string, value: string | undefined) => {
    if (SCALAR_MAP[flag] && value !== undefined) {
      const key = SCALAR_MAP[flag];
      if (key === "blkio_config") svc.blkio_config = { weight: Number(value) };
      else svc[key] = NUMERIC_KEYS.has(key) && /^-?\d+$/.test(value) ? Number(value) : key === "cpus" && /^\d+(\.\d+)?$/.test(value) ? Number(value) : value;
      return;
    }
    if (LIST_MAP[flag] && value !== undefined) {
      listPush(LIST_MAP[flag], value);
      return;
    }
    switch (flag) {
      case "name":
        name = value;
        svc.container_name = value;
        break;
      case "detach":
      case "rm":
      case "attach":
      case "sig-proxy":
      case "cidfile":
      case "detach-keys":
      case "quiet":
      case "disable-content-trust":
        if (flag === "rm") warnings.push("--rm has no compose equivalent (use `docker compose run --rm`); it was skipped.");
        break;
      case "interactive":
        svc.stdin_open = true;
        break;
      case "tty":
        svc.tty = true;
        break;
      case "init":
        svc.init = true;
        break;
      case "privileged":
        svc.privileged = true;
        break;
      case "read-only":
        svc.read_only = true;
        break;
      case "oom-kill-disable":
        svc.oom_kill_disable = true;
        break;
      case "publish-all":
        warnings.push("-P/--publish-all has no compose equivalent; list the ports explicitly.");
        break;
      case "volume": {
        const v = value as string;
        const src = v.split(":")[0];
        if (v.includes(":") && isNamedVolume(src)) namedVolumes.add(src);
        volumes.push(v);
        break;
      }
      case "mount":
        volumes.push(parseMount(value as string, namedVolumes, warnings));
        break;
      case "env": {
        const v = value as string;
        const eq = v.indexOf("=");
        if (eq === -1) env[v] = null;
        else env[v.slice(0, eq)] = v.slice(eq + 1);
        break;
      }
      case "label": {
        const v = value as string;
        const eq = v.indexOf("=");
        labels[eq === -1 ? v : v.slice(0, eq)] = eq === -1 ? "" : v.slice(eq + 1);
        break;
      }
      case "network":
      case "net":
        if (value && (BUILTIN_NETWORKS.has(value) || value.startsWith("container:") || value.startsWith("service:"))) {
          svc.network_mode = value === "default" ? "bridge" : value;
        } else if (value) {
          netList.push(value);
          networks.add(value);
        }
        break;
      case "network-alias":
      case "net-alias":
        netAliases.push(value as string);
        break;
      case "ip":
        ipv4 = value;
        break;
      case "ip6":
        ipv6 = value;
        break;
      case "entrypoint":
        svc.entrypoint = value;
        break;
      case "log-driver":
        svc.logging = { ...(svc.logging || {}), driver: value };
        break;
      case "log-opt": {
        const [k, ...rest] = (value as string).split("=");
        logOpts[k] = rest.join("=");
        break;
      }
      case "gpus": {
        const device: Dict = { driver: "nvidia", capabilities: ["gpu"] };
        const v = (value as string).replace(/^"|"$/g, "");
        if (v === "all") device.count = "all";
        else if (/^\d+$/.test(v)) device.count = Number(v);
        else if (v.startsWith("device=")) device.device_ids = v.slice(7).split(",");
        else device.count = "all";
        svc.deploy = { resources: { reservations: { devices: [device] } } };
        break;
      }
      case "health-cmd":
        health.test = healthTest(value as string);
        break;
      case "health-interval":
        health.interval = value;
        break;
      case "health-timeout":
        health.timeout = value;
        break;
      case "health-retries":
        health.retries = Number(value);
        break;
      case "health-start-period":
        health.start_period = value;
        break;
      case "no-healthcheck":
        health.disable = true;
        break;
      case "stop-timeout":
        svc.stop_grace_period = /^\d+$/.test(value as string) ? `${value}s` : value;
        break;
      case "sysctl": {
        const [k, ...rest] = (value as string).split("=");
        sysctls[k] = rest.join("=");
        break;
      }
      case "ulimit": {
        const [k, rest = ""] = (value as string).split("=");
        const [soft, hard] = rest.split(":");
        ulimits[k] = hard !== undefined ? { soft: Number(soft), hard: Number(hard) } : Number(soft);
        break;
      }
      case "storage-opt": {
        const [k, ...rest] = (value as string).split("=");
        svc.storage_opt = { ...(svc.storage_opt || {}), [k]: rest.join("=") };
        break;
      }
      case "help":
        break;
      default:
        warnings.push(`Option --${flag}${value !== undefined ? ` ${value}` : ""} is not supported and was skipped.`);
    }
  };

  // Options until the image name
  while (i < args.length) {
    const tok = args[i];
    if (tok === "--") {
      i++;
      break;
    }
    if (!tok.startsWith("-") || tok === "-") break;
    if (tok.startsWith("--")) {
      const body = tok.slice(2);
      const eq = body.indexOf("=");
      const flag = eq === -1 ? body : body.slice(0, eq);
      if (eq !== -1) {
        const v = body.slice(eq + 1);
        if (BOOLEAN_FLAGS.has(flag)) {
          if (v !== "false") apply(flag, undefined);
        } else apply(flag, v);
        i++;
      } else if (BOOLEAN_FLAGS.has(flag)) {
        apply(flag, undefined);
        i++;
      } else if (VALUE_FLAGS.has(flag)) {
        apply(flag, args[i + 1]);
        i += 2;
      } else {
        warnings.push(`Unknown option --${flag} was skipped (treated as a flag without value).`);
        i++;
      }
    } else {
      // Short flags, possibly combined: -it, -p80:80, -e FOO=1
      const body = tok.slice(1);
      let j = 0;
      i++;
      while (j < body.length) {
        const ch = body[j];
        const flag = SHORT_ALIASES[ch];
        if (!flag) {
          warnings.push(`Unknown option -${ch} was skipped.`);
          j++;
          continue;
        }
        if (BOOLEAN_FLAGS.has(flag)) {
          apply(flag, undefined);
          j++;
        } else {
          const rest = body.slice(j + 1);
          if (rest) apply(flag, rest.replace(/^=/, ""));
          else {
            apply(flag, args[i]);
            i++;
          }
          break;
        }
      }
    }
  }

  const image = args[i];
  const command = args.slice(i + 1);
  if (!image) {
    warnings.push("No image found in the docker run command.");
  } else {
    svc.image = image;
  }
  if (command.length) svc.command = command.length === 1 ? command[0] : command;

  if (Object.keys(env).length) svc.environment = env;
  if (Object.keys(labels).length) svc.labels = labels;
  if (volumes.length) svc.volumes = volumes;
  if (Object.keys(logOpts).length) svc.logging = { ...(svc.logging || {}), options: logOpts };
  if (Object.keys(health).length) svc.healthcheck = health;
  if (Object.keys(sysctls).length) svc.sysctls = sysctls;
  if (Object.keys(ulimits).length) svc.ulimits = ulimits;
  if (netList.length) {
    if (netAliases.length || ipv4 || ipv6) {
      const nets: Dict = {};
      netList.forEach((n, idx) => {
        const conf: Dict = {};
        if (idx === 0) {
          if (netAliases.length) conf.aliases = netAliases;
          if (ipv4) conf.ipv4_address = ipv4;
          if (ipv6) conf.ipv6_address = ipv6;
        }
        nets[n] = Object.keys(conf).length ? conf : null;
      });
      svc.networks = nets;
    } else {
      svc.networks = netList;
    }
  } else if (netAliases.length || ipv4) {
    warnings.push("--network-alias / --ip need a user-defined --network; they were skipped.");
  }

  return { name: name || serviceNameFromImage(image || "app"), service: orderService(svc) };
}

// Keep the most useful keys on top, like a hand-written compose file.
const KEY_ORDER = [
  "image", "container_name", "restart", "platform", "pull_policy", "entrypoint", "command",
  "working_dir", "user", "hostname", "ports", "expose", "environment", "env_file", "volumes",
  "networks", "network_mode", "depends_on", "labels", "healthcheck", "logging",
];

function orderService(svc: Dict): Dict {
  const out: Dict = {};
  for (const k of KEY_ORDER) if (k in svc) out[k] = svc[k];
  for (const k of Object.keys(svc)) if (!(k in out)) out[k] = svc[k];
  return out;
}

export function dumpYaml(obj: unknown): string {
  return yaml
    .dump(obj, { lineWidth: -1, noRefs: true, quotingType: '"' })
    .replace(/^(\s*[^\s#][^:\n]*): null$/gm, "$1:");
}

export function dockerRunToCompose(text: string, version: string): ConvertResult {
  const warnings: string[] = [];
  const commands = findRunCommands(text);
  if (!commands.length) {
    return { output: "", warnings: ["No `docker run` command found. Paste one or more commands that start with `docker run`."] };
  }
  const namedVolumes = new Set<string>();
  const networks = new Set<string>();
  const services: Dict = {};
  for (const cmd of commands) {
    const { name, service } = convertOne(cmd.args, warnings, namedVolumes, networks);
    let key = name;
    let n = 2;
    while (services[key]) key = `${name}-${n++}`;
    services[key] = service;
  }
  const doc: Dict = {};
  if (version) doc.version = version;
  doc.services = services;
  if (networks.size) doc.networks = Object.fromEntries([...networks].map((n) => [n, { external: true }]));
  if (namedVolumes.size) doc.volumes = Object.fromEntries([...namedVolumes].map((v) => [v, {}]));
  if (networks.size) warnings.push("Networks are marked `external: true` because `docker run` expects them to exist. Remove that line to let compose create them.");
  return { output: dumpYaml(doc), warnings: [...new Set(warnings)] };
}

/* ------------------------------------------------------------------ */
/* compose -> docker run                                               */
/* ------------------------------------------------------------------ */

function toArray(v: any): any[] {
  if (v === undefined || v === null) return [];
  return Array.isArray(v) ? v : [v];
}

function mapOrList(v: any, sep = "="): string[] {
  if (!v) return [];
  if (Array.isArray(v)) return v.map(String);
  return Object.entries(v).map(([k, val]) => (val === null || val === undefined ? k : `${k}${sep}${val}`));
}

function durationToRun(v: any): string {
  return String(v);
}

function portToFlag(p: any): string {
  if (typeof p !== "object" || p === null) return String(p);
  const target = p.target;
  const published = p.published;
  const host = p.host_ip ? `${p.host_ip}:` : "";
  const proto = p.protocol && p.protocol !== "tcp" ? `/${p.protocol}` : "";
  return published !== undefined && published !== "" ? `${host}${published}:${target}${proto}` : `${target}${proto}`;
}

function volumeToFlag(v: any): { flag: string; value: string } {
  if (typeof v !== "object" || v === null) return { flag: "-v", value: String(v) };
  if (v.type === "bind" || v.type === "volume" || !v.type) {
    if (!v.source) return { flag: "-v", value: v.target };
    const opts: string[] = [];
    if (v.read_only) opts.push("ro");
    if (v.bind?.propagation) opts.push(v.bind.propagation);
    if (v.bind?.selinux) opts.push(v.bind.selinux);
    if (v.volume?.nocopy) opts.push("nocopy");
    return { flag: "-v", value: `${v.source}:${v.target}${opts.length ? ":" + opts.join(",") : ""}` };
  }
  const parts = [`type=${v.type}`];
  if (v.source) parts.push(`source=${v.source}`);
  parts.push(`target=${v.target}`);
  if (v.read_only) parts.push("readonly");
  if (v.tmpfs?.size) parts.push(`tmpfs-size=${v.tmpfs.size}`);
  return { flag: "--mount", value: parts.join(",") };
}

export interface ComposeToRunOptions {
  detach: boolean;
  multiline: boolean;
  createNetworks: boolean;
}

export function composeToDockerRun(text: string, opts: ComposeToRunOptions): ConvertResult {
  const warnings: string[] = [];
  let doc: any;
  try {
    doc = yaml.load(text);
  } catch (e: any) {
    return { output: "", warnings: [`YAML error: ${e.message}`] };
  }
  if (!doc || typeof doc !== "object") return { output: "", warnings: ["Paste a docker-compose.yml with a `services:` section."] };
  const services: Dict = doc.services || (doc.image ? { app: doc } : null);
  if (!services) return { output: "", warnings: ["No `services:` section found."] };

  const topNetworks: Dict = doc.networks || {};
  const lines: string[] = [];

  if (opts.createNetworks) {
    const used = new Set<string>();
    for (const svc of Object.values<any>(services)) {
      const nets = Array.isArray(svc?.networks) ? svc.networks : Object.keys(svc?.networks || {});
      nets.forEach((n: string) => used.add(n));
    }
    for (const n of used) {
      const conf = topNetworks[n] || {};
      if (conf.external) continue;
      const realName = conf.name || n;
      lines.push(`docker network create ${conf.driver ? `--driver ${shellQuote(conf.driver)} ` : ""}${shellQuote(realName)}`);
    }
    if (lines.length) lines.push("");
  }

  for (const [svcName, svc] of Object.entries<any>(services)) {
    if (!svc || typeof svc !== "object") continue;
    const args: string[] = [];
    const add = (flag: string, value?: any) => {
      args.push(value === undefined ? flag : `${flag} ${shellQuote(String(value))}`);
    };
    if (opts.detach) add("-d");
    add("--name", svc.container_name || svcName);
    if (svc.restart) add("--restart", svc.restart);
    if (svc.stdin_open && svc.tty) add("-it");
    else {
      if (svc.stdin_open) add("-i");
      if (svc.tty) add("-t");
    }
    if (svc.init) add("--init");
    if (svc.privileged) add("--privileged");
    if (svc.read_only) add("--read-only");
    if (svc.platform) add("--platform", svc.platform);
    if (svc.pull_policy) add("--pull", svc.pull_policy === "if_not_present" ? "missing" : svc.pull_policy);
    if (svc.hostname) add("-h", svc.hostname);
    if (svc.domainname) add("--domainname", svc.domainname);
    if (svc.user !== undefined) add("-u", svc.user);
    if (svc.working_dir) add("-w", svc.working_dir);
    toArray(svc.ports).forEach((p) => add("-p", portToFlag(p)));
    toArray(svc.expose).forEach((p) => add("--expose", p));
    mapOrList(svc.environment).forEach((e) => add("-e", e));
    toArray(svc.env_file).forEach((f) => add("--env-file", typeof f === "object" ? f.path : f));
    toArray(svc.volumes).forEach((v) => {
      const { flag, value } = volumeToFlag(v);
      add(flag, value);
    });
    toArray(svc.tmpfs).forEach((t) => add("--tmpfs", t));
    toArray(svc.volumes_from).forEach((v) => add("--volumes-from", v));

    if (svc.network_mode) add("--network", svc.network_mode);
    if (svc.networks) {
      const entries: [string, any][] = Array.isArray(svc.networks)
        ? svc.networks.map((n: string) => [n, null])
        : Object.entries(svc.networks);
      entries.forEach(([n, conf], idx) => {
        const realName = topNetworks[n]?.name || n;
        if (idx === 0) {
          add("--network", realName);
          toArray(conf?.aliases).forEach((a) => add("--network-alias", a));
          if (conf?.ipv4_address) add("--ip", conf.ipv4_address);
          if (conf?.ipv6_address) add("--ip6", conf.ipv6_address);
        } else {
          warnings.push(`Service "${svcName}": docker run joins one network at start; connect "${realName}" afterwards with \`docker network connect ${realName} ${svc.container_name || svcName}\`.`);
        }
      });
    }
    toArray(svc.links).forEach((l) => add("--link", l));
    toArray(svc.extra_hosts && !Array.isArray(svc.extra_hosts) ? mapOrList(svc.extra_hosts, ":") : svc.extra_hosts).forEach((h) => add("--add-host", h));
    toArray(svc.dns).forEach((d) => add("--dns", d));
    toArray(svc.dns_search).forEach((d) => add("--dns-search", d));
    toArray(svc.dns_opt).forEach((d) => add("--dns-option", d));
    toArray(svc.cap_add).forEach((c) => add("--cap-add", c));
    toArray(svc.cap_drop).forEach((c) => add("--cap-drop", c));
    toArray(svc.devices).forEach((d) => add("--device", typeof d === "object" ? `${d.source}:${d.target}${d.permissions ? ":" + d.permissions : ""}` : d));
    toArray(svc.security_opt).forEach((s) => add("--security-opt", s));
    toArray(svc.group_add).forEach((g) => add("--group-add", g));
    mapOrList(svc.labels).forEach((l) => add("-l", l));
    mapOrList(svc.sysctls).forEach((s) => add("--sysctl", s));
    if (svc.ulimits) {
      for (const [k, v] of Object.entries<any>(svc.ulimits)) {
        add("--ulimit", typeof v === "object" ? `${k}=${v.soft}:${v.hard}` : `${k}=${v}`);
      }
    }
    if (svc.ipc) add("--ipc", svc.ipc);
    if (svc.pid) add("--pid", svc.pid);
    if (svc.uts) add("--uts", svc.uts);
    if (svc.userns_mode) add("--userns", svc.userns_mode);
    if (svc.runtime) add("--runtime", svc.runtime);
    if (svc.mac_address) add("--mac-address", svc.mac_address);
    if (svc.cgroup_parent) add("--cgroup-parent", svc.cgroup_parent);
    if (svc.shm_size) add("--shm-size", svc.shm_size);
    if (svc.stop_signal) add("--stop-signal", svc.stop_signal);
    if (svc.stop_grace_period) {
      const m = String(svc.stop_grace_period).match(/^(\d+)s?$/);
      if (m) add("--stop-timeout", m[1]);
      else warnings.push(`Service "${svcName}": stop_grace_period "${svc.stop_grace_period}" needs whole seconds for --stop-timeout.`);
    }
    if (svc.mem_limit) add("-m", svc.mem_limit);
    if (svc.mem_reservation) add("--memory-reservation", svc.mem_reservation);
    if (svc.memswap_limit) add("--memory-swap", svc.memswap_limit);
    if (svc.cpus) add("--cpus", svc.cpus);
    if (svc.cpu_shares) add("--cpu-shares", svc.cpu_shares);
    if (svc.cpuset) add("--cpuset-cpus", svc.cpuset);
    if (svc.pids_limit) add("--pids-limit", svc.pids_limit);
    if (svc.oom_kill_disable) add("--oom-kill-disable");
    if (svc.oom_score_adj !== undefined) add("--oom-score-adj", svc.oom_score_adj);

    const limits = svc.deploy?.resources?.limits;
    if (limits?.memory && !svc.mem_limit) add("-m", limits.memory);
    if (limits?.cpus && !svc.cpus) add("--cpus", limits.cpus);
    if (svc.deploy?.resources?.reservations?.memory) add("--memory-reservation", svc.deploy.resources.reservations.memory);
    const gpuDevices = toArray(svc.deploy?.resources?.reservations?.devices).filter((d) => toArray(d.capabilities).includes("gpu"));
    if (gpuDevices.length) {
      const d = gpuDevices[0];
      if (d.device_ids) add("--gpus", `"device=${toArray(d.device_ids).join(",")}"`);
      else add("--gpus", d.count === undefined ? "all" : d.count);
    }
    if (svc.deploy?.replicas && svc.deploy.replicas > 1) warnings.push(`Service "${svcName}": deploy.replicas is not supported by docker run.`);

    if (svc.logging?.driver) add("--log-driver", svc.logging.driver);
    mapOrList(svc.logging?.options).forEach((o) => add("--log-opt", o));

    const hc = svc.healthcheck;
    if (hc) {
      if (hc.disable) add("--no-healthcheck");
      else {
        if (hc.test) {
          const t = toArray(hc.test);
          let cmd: string;
          if (t[0] === "NONE") {
            add("--no-healthcheck");
            cmd = "";
          } else if (t[0] === "CMD-SHELL") cmd = t.slice(1).join(" ");
          else if (t[0] === "CMD") cmd = t.slice(1).map((x: string) => shellQuote(String(x))).join(" ");
          else cmd = t.join(" ");
          if (cmd) add("--health-cmd", cmd);
        }
        if (hc.interval) add("--health-interval", durationToRun(hc.interval));
        if (hc.timeout) add("--health-timeout", durationToRun(hc.timeout));
        if (hc.retries !== undefined) add("--health-retries", hc.retries);
        if (hc.start_period) add("--health-start-period", durationToRun(hc.start_period));
      }
    }

    // entrypoint: docker run takes only the executable; the rest goes before the command.
    let extraCmd: string[] = [];
    if (svc.entrypoint !== undefined) {
      const ep = Array.isArray(svc.entrypoint) ? svc.entrypoint.map(String) : shellSplit(String(svc.entrypoint));
      if (ep.length) {
        add("--entrypoint", ep[0]);
        extraCmd = ep.slice(1);
      } else add("--entrypoint", "");
    }

    if (svc.build && !svc.image) {
      warnings.push(`Service "${svcName}" uses build:. Build the image first (docker build -t ${svcName} ${typeof svc.build === "string" ? svc.build : svc.build.context || "."}) and run it by that tag.`);
    }
    if (svc.depends_on) {
      const deps = Array.isArray(svc.depends_on) ? svc.depends_on : Object.keys(svc.depends_on);
      warnings.push(`Service "${svcName}" depends on ${deps.join(", ")}: start those containers first.`);
    }
    const handled = new Set([
      "image", "container_name", "restart", "stdin_open", "tty", "init", "privileged", "read_only", "platform",
      "pull_policy", "hostname", "domainname", "user", "working_dir", "ports", "expose", "environment", "env_file",
      "volumes", "tmpfs", "volumes_from", "network_mode", "networks", "links", "extra_hosts", "dns", "dns_search",
      "dns_opt", "cap_add", "cap_drop", "devices", "security_opt", "group_add", "labels", "sysctls", "ulimits", "ipc",
      "pid", "uts", "userns_mode", "runtime", "mac_address", "cgroup_parent", "shm_size", "stop_signal",
      "stop_grace_period", "mem_limit", "mem_reservation", "memswap_limit", "cpus", "cpu_shares", "cpuset",
      "pids_limit", "oom_kill_disable", "oom_score_adj", "deploy", "logging", "healthcheck", "entrypoint", "command",
      "build", "depends_on",
    ]);
    const skipped = Object.keys(svc).filter((k) => !handled.has(k));
    if (skipped.length) warnings.push(`Service "${svcName}": ${skipped.join(", ")} not converted.`);

    const image = svc.image || svcName;
    const cmdParts = [
      ...extraCmd,
      ...(svc.command === undefined || svc.command === null
        ? []
        : Array.isArray(svc.command)
          ? svc.command.map(String)
          : shellSplit(String(svc.command))),
    ];
    const tail = [shellQuote(String(image)), ...cmdParts.map(shellQuote)].join(" ");
    const sep = opts.multiline ? " \\\n  " : " ";
    lines.push(["docker run", ...args, tail].join(sep));
    lines.push("");
  }
  return { output: lines.join("\n").trim() + "\n", warnings: [...new Set(warnings)] };
}
