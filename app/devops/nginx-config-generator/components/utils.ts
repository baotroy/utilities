export type SiteType = "static" | "spa" | "proxy" | "php";
export type WwwMode = "none" | "to-non-www" | "to-www";

export interface NginxOptions {
  domains: string; // space or comma separated
  siteType: SiteType;
  root: string;
  index: string;
  proxyPass: string;
  websocket: boolean;
  phpSocket: string;
  https: boolean;
  certPath: string;
  keyPath: string;
  redirectHttp: boolean;
  http2: boolean;
  hsts: boolean;
  www: WwwMode;
  ipv6: boolean;
  gzip: boolean;
  cacheStatic: boolean;
  securityHeaders: boolean;
  denyHidden: boolean;
  acme: boolean;
  maxBodySize: string;
  basicAuth: boolean;
  htpasswdPath: string;
  accessLog: string;
  errorLog: string;
  customLocations: string;
}

export const DEFAULT_OPTIONS: NginxOptions = {
  domains: "example.com www.example.com",
  siteType: "proxy",
  root: "/var/www/example.com/public",
  index: "index.html index.htm",
  proxyPass: "http://127.0.0.1:3000",
  websocket: true,
  phpSocket: "unix:/run/php/php8.3-fpm.sock",
  https: true,
  certPath: "/etc/letsencrypt/live/example.com/fullchain.pem",
  keyPath: "/etc/letsencrypt/live/example.com/privkey.pem",
  redirectHttp: true,
  http2: true,
  hsts: true,
  www: "to-non-www",
  ipv6: true,
  gzip: true,
  cacheStatic: true,
  securityHeaders: true,
  denyHidden: true,
  acme: true,
  maxBodySize: "20m",
  basicAuth: false,
  htpasswdPath: "/etc/nginx/.htpasswd",
  accessLog: "",
  errorLog: "",
  customLocations: "",
};

export const PRESETS: { label: string; options: Partial<NginxOptions> }[] = [
  { label: "Node.js / reverse proxy", options: { siteType: "proxy", proxyPass: "http://127.0.0.1:3000", websocket: true } },
  { label: "React / Vue SPA", options: { siteType: "spa", root: "/var/www/example.com/dist", index: "index.html" } },
  { label: "Static site", options: { siteType: "static", root: "/var/www/example.com/public", index: "index.html index.htm" } },
  { label: "PHP (Laravel / WordPress)", options: { siteType: "php", root: "/var/www/example.com/public", index: "index.php index.html" } },
];

function splitDomains(s: string): string[] {
  return s.split(/[\s,]+/).map((d) => d.trim()).filter(Boolean);
}

/** The main host after the www redirect is applied. */
function canonicalHost(domains: string[], www: WwwMode): string {
  const first = domains[0] || "_";
  const bare = first.replace(/^www\./, "");
  if (www === "to-www") return `www.${bare}`;
  if (www === "to-non-www") return bare;
  return first;
}

function indent(lines: string[], n = 1): string[] {
  const pad = "    ".repeat(n);
  return lines.map((l) => (l ? pad + l : l));
}

function listenLines(port: number, ssl: boolean, o: NginxOptions): string[] {
  const suffix = ssl ? " ssl" : "";
  const lines = [`listen ${port}${suffix};`];
  if (o.ipv6) lines.push(`listen [::]:${port}${suffix};`);
  if (ssl && o.http2) lines.push("http2 on;");
  return lines;
}

function sslLines(o: NginxOptions): string[] {
  const lines = [
    "",
    "# SSL",
    `ssl_certificate ${o.certPath};`,
    `ssl_certificate_key ${o.keyPath};`,
    "ssl_protocols TLSv1.2 TLSv1.3;",
    "ssl_prefer_server_ciphers off;",
    "ssl_session_cache shared:SSL:10m;",
    "ssl_session_timeout 1d;",
  ];
  if (o.hsts) lines.push('add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;');
  return lines;
}

function acmeBlock(o: NginxOptions): string[] {
  if (!o.acme) return [];
  return ["", "# Let's Encrypt HTTP-01 challenge", "location ^~ /.well-known/acme-challenge/ {", "    root /var/www/letsencrypt;", "}"];
}

function mainBody(o: NginxOptions): string[] {
  const lines: string[] = [];
  if (o.maxBodySize) lines.push(`client_max_body_size ${o.maxBodySize};`);
  if (o.accessLog) lines.push(`access_log ${o.accessLog};`);
  if (o.errorLog) lines.push(`error_log ${o.errorLog};`);

  if (o.securityHeaders) {
    lines.push(
      "",
      "# Security headers",
      'add_header X-Frame-Options "SAMEORIGIN" always;',
      'add_header X-Content-Type-Options "nosniff" always;',
      'add_header Referrer-Policy "strict-origin-when-cross-origin" always;'
    );
  }

  if (o.gzip) {
    lines.push(
      "",
      "# Compression",
      "gzip on;",
      "gzip_vary on;",
      "gzip_proxied any;",
      "gzip_comp_level 5;",
      "gzip_min_length 256;",
      "gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript image/svg+xml;"
    );
  }

  if (o.siteType !== "proxy") {
    lines.push("", `root ${o.root};`, `index ${o.index};`);
  }

  if (o.basicAuth) {
    lines.push("", 'auth_basic "Restricted";', `auth_basic_user_file ${o.htpasswdPath};`);
  }

  lines.push(...acmeBlock(o));

  if (o.denyHidden) {
    lines.push("", "# Block access to hidden files such as .env and .git", "location ~ /\\.(?!well-known) {", "    deny all;", "}");
  }

  switch (o.siteType) {
    case "static":
      lines.push("", "location / {", "    try_files $uri $uri/ =404;", "}");
      break;
    case "spa":
      lines.push("", "# Send every unknown route to the SPA", "location / {", "    try_files $uri $uri/ /index.html;", "}");
      break;
    case "php":
      lines.push(
        "",
        "location / {",
        "    try_files $uri $uri/ /index.php?$query_string;",
        "}",
        "",
        "location ~ \\.php$ {",
        "    include snippets/fastcgi-php.conf;",
        `    fastcgi_pass ${o.phpSocket};`,
        "    fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;",
        "    include fastcgi_params;",
        "}"
      );
      break;
    case "proxy": {
      const loc = [
        `proxy_pass ${o.proxyPass};`,
        "proxy_http_version 1.1;",
        "proxy_set_header Host $host;",
        "proxy_set_header X-Real-IP $remote_addr;",
        "proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;",
        "proxy_set_header X-Forwarded-Proto $scheme;",
      ];
      if (o.websocket) {
        loc.push("proxy_set_header Upgrade $http_upgrade;", "proxy_set_header Connection $connection_upgrade;");
      }
      loc.push("proxy_read_timeout 60s;", "proxy_buffering on;");
      lines.push("", "location / {", ...indent(loc), "}");
      break;
    }
  }

  if (o.cacheStatic && o.siteType !== "proxy") {
    lines.push(
      "",
      "# Cache static assets",
      "location ~* \\.(?:css|js|mjs|jpg|jpeg|gif|png|webp|avif|ico|svg|woff2?|ttf|eot|mp4|webm)$ {",
      "    expires 30d;",
      '    add_header Cache-Control "public, immutable";',
      "    access_log off;",
      "    try_files $uri =404;",
      "}"
    );
  }

  if (o.customLocations.trim()) {
    lines.push("", "# Custom", ...o.customLocations.replace(/\r/g, "").split("\n"));
  }
  return lines;
}

function serverBlock(body: string[]): string[] {
  return ["server {", ...indent(body), "}"];
}

export function generateNginx(o: NginxOptions): string {
  const domains = splitDomains(o.domains);
  const host = canonicalHost(domains, o.www);
  const out: string[] = [];

  if (o.siteType === "proxy" && o.websocket) {
    out.push(
      "# WebSocket support (put this in the http {} block once)",
      "map $http_upgrade $connection_upgrade {",
      "    default upgrade;",
      "    ''      close;",
      "}",
      ""
    );
  }

  // Names that should redirect to the canonical host
  const bare = (domains[0] || "").replace(/^www\./, "");
  let otherNames: string[] = [];
  if (o.www !== "none" && bare) {
    const alt = o.www === "to-non-www" ? `www.${bare}` : bare;
    otherNames = [alt];
  }
  const mainNames = o.www === "none" ? domains : [host, ...domains.filter((d) => d !== host && !otherNames.includes(d) && d.replace(/^www\./, "") !== bare)];
  const allNames = [...new Set([...mainNames, ...otherNames])];
  const serverName = (names: string[]) => `server_name ${names.length ? names.join(" ") : "_"};`;

  if (o.https) {
    // HTTP: redirect everything to https
    if (o.redirectHttp) {
      const body = [...listenLines(80, false, o), serverName(allNames), ...acmeBlock(o), "", "location / {", `    return 301 https://${o.www === "none" ? "$host" : host}$request_uri;`, "}"];
      out.push("# Redirect HTTP to HTTPS", ...serverBlock(body), "");
    }
    // HTTPS: alternate name -> canonical
    if (otherNames.length) {
      const body = [...listenLines(443, true, o), serverName(otherNames), ...sslLines(o), "", `return 301 https://${host}$request_uri;`];
      out.push(`# Redirect ${otherNames.join(", ")} to ${host}`, ...serverBlock(body), "");
    }
    const body = [...listenLines(443, true, o), serverName(mainNames), ...sslLines(o), "", ...mainBody(o)];
    if (!o.redirectHttp) body.unshift(...listenLines(80, false, o));
    out.push(...serverBlock(body));
  } else {
    if (otherNames.length) {
      const body = [...listenLines(80, false, o), serverName(otherNames), "", `return 301 http://${host}$request_uri;`];
      out.push(`# Redirect ${otherNames.join(", ")} to ${host}`, ...serverBlock(body), "");
    }
    const body = [...listenLines(80, false, o), serverName(mainNames), "", ...mainBody(o)];
    out.push(...serverBlock(body));
  }

  // Collapse runs of blank lines
  return out.join("\n").replace(/\n{3,}/g, "\n\n").replace(/{\n\s*\n/g, "{\n") + "\n";
}

export function configFileName(o: NginxOptions): string {
  const d = splitDomains(o.domains)[0]?.replace(/^www\./, "") || "default";
  return `${d}.conf`;
}
