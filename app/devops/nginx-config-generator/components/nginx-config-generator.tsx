"use client";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import Button from "@/components/Input/Button";
import { copyToClipboard, download } from "@/common/utils";
import { useMemo, useState } from "react";
import { MdContentCopy, MdDownload, MdRestartAlt } from "react-icons/md";
import { Check, Field, Segmented, inputClass, outputClass, selectClass, textareaClass } from "@/app/devops/components/ui";
import { DEFAULT_OPTIONS, NginxOptions, PRESETS, SiteType, WwwMode, configFileName, generateNginx } from "./utils";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded border border-stroke p-4 dark:border-strokedark">
      <div className="mb-3 text-sm font-semibold text-black dark:text-white">{title}</div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

export default function NginxConfigGeneratorComponent() {
  const [o, setO] = useState<NginxOptions>(DEFAULT_OPTIONS);
  const set = <K extends keyof NginxOptions>(k: K, v: NginxOptions[K]) => setO((prev) => ({ ...prev, [k]: v }));
  const output = useMemo(() => generateNginx(o), [o]);

  const text = (k: keyof NginxOptions, placeholder?: string) => (
    <input
      type="text"
      className={inputClass}
      value={o[k] as string}
      placeholder={placeholder}
      spellCheck={false}
      onChange={(e) => set(k, e.target.value as any)}
    />
  );

  return (
    <>
      <Breadcrumb />
      <div className="w-full">
        <p className="mb-6 text-sm text-body dark:text-bodydark2">
          Build an NGINX server block for a reverse proxy, a single-page app, a static site or PHP. Pick the options and copy
          the config into <code>/etc/nginx/sites-available/</code> or <code>conf.d/</code>.
        </p>

        <div className="mb-4 flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={() => setO((prev) => ({ ...prev, ...p.options }))}
              className="px-3 py-1.5 rounded border text-sm transition-colors bg-white dark:bg-boxdark border-stroke dark:border-strokedark hover:border-primary"
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
          <div className="space-y-4">
            <Section title="Site">
              <Field label="Domain names" hint="Separate with spaces. The first one is the main domain.">
                {text("domains", "example.com www.example.com")}
              </Field>
              <div>
                <span className="mb-1 block text-sm font-medium text-black dark:text-white">Type</span>
                <Segmented<SiteType>
                  value={o.siteType}
                  onChange={(v) => set("siteType", v)}
                  options={[
                    { value: "proxy", label: "Reverse proxy" },
                    { value: "spa", label: "SPA" },
                    { value: "static", label: "Static" },
                    { value: "php", label: "PHP-FPM" },
                  ]}
                />
              </div>
              {o.siteType === "proxy" ? (
                <>
                  <Field label="Upstream (proxy_pass)">{text("proxyPass", "http://127.0.0.1:3000")}</Field>
                  <Check checked={o.websocket} onChange={(v) => set("websocket", v)}>WebSocket support</Check>
                </>
              ) : (
                <>
                  <Field label="Document root">{text("root", "/var/www/html")}</Field>
                  <Field label="Index files">{text("index", "index.html")}</Field>
                  {o.siteType === "php" && <Field label="PHP-FPM (fastcgi_pass)">{text("phpSocket", "unix:/run/php/php8.3-fpm.sock")}</Field>}
                </>
              )}
              <Field label="www redirect">
                <select className={selectClass + " w-full"} value={o.www} onChange={(e) => set("www", e.target.value as WwwMode)}>
                  <option value="none">No redirect</option>
                  <option value="to-non-www">www → non-www</option>
                  <option value="to-www">non-www → www</option>
                </select>
              </Field>
            </Section>

            <Section title="HTTPS">
              <Check checked={o.https} onChange={(v) => set("https", v)}>Enable HTTPS (443)</Check>
              {o.https && (
                <>
                  <Field label="Certificate">{text("certPath")}</Field>
                  <Field label="Private key">{text("keyPath")}</Field>
                  <div className="flex flex-wrap gap-x-5 gap-y-2">
                    <Check checked={o.redirectHttp} onChange={(v) => set("redirectHttp", v)}>Redirect HTTP → HTTPS</Check>
                    <Check checked={o.http2} onChange={(v) => set("http2", v)}>HTTP/2</Check>
                    <Check checked={o.hsts} onChange={(v) => set("hsts", v)}>HSTS</Check>
                  </div>
                </>
              )}
            </Section>

            <Section title="Options">
              <div className="grid gap-2 sm:grid-cols-2">
                <Check checked={o.gzip} onChange={(v) => set("gzip", v)}>Gzip compression</Check>
                <Check checked={o.securityHeaders} onChange={(v) => set("securityHeaders", v)}>Security headers</Check>
                <Check checked={o.denyHidden} onChange={(v) => set("denyHidden", v)}>Block hidden files (.env, .git)</Check>
                <Check checked={o.acme} onChange={(v) => set("acme", v)}>Let&apos;s Encrypt challenge path</Check>
                {o.siteType !== "proxy" && <Check checked={o.cacheStatic} onChange={(v) => set("cacheStatic", v)}>Cache static assets (30d)</Check>}
                <Check checked={o.ipv6} onChange={(v) => set("ipv6", v)}>Listen on IPv6</Check>
                <Check checked={o.basicAuth} onChange={(v) => set("basicAuth", v)}>Basic auth</Check>
              </div>
              {o.basicAuth && <Field label="htpasswd file" hint="Create it with the NGINX Htpasswd Generator.">{text("htpasswdPath")}</Field>}
              <div className="grid gap-3 sm:grid-cols-3">
                <Field label="Max upload size">{text("maxBodySize", "20m")}</Field>
                <Field label="Access log">{text("accessLog", "default")}</Field>
                <Field label="Error log">{text("errorLog", "default")}</Field>
              </div>
              <Field label="Extra directives / locations" hint="Pasted as is at the end of the main server block.">
                <textarea
                  rows={4}
                  className={textareaClass}
                  spellCheck={false}
                  value={o.customLocations}
                  placeholder={"location /api/ {\n    proxy_pass http://127.0.0.1:8080/;\n}"}
                  onChange={(e) => set("customLocations", e.target.value)}
                />
              </Field>
            </Section>
          </div>

          <div className="xl:sticky xl:top-24 xl:self-start">
            <div className="mb-2 flex items-center justify-between">
              <span className="font-medium text-black dark:text-white">{configFileName(o)}</span>
            </div>
            <textarea value={output} readOnly rows={34} spellCheck={false} className={outputClass} />
            <div className="mt-3 flex flex-wrap gap-2">
              <Button handleOnClick={() => copyToClipboard(output)} label="Copy" type="outline" icon={{ icon: MdContentCopy, position: "left", size: 18 }} />
              <Button
                handleOnClick={() => download(output, configFileName(o), "text/plain")}
                label="Download"
                type="outline"
                icon={{ icon: MdDownload, position: "left", size: 18 }}
              />
              <Button handleOnClick={() => setO(DEFAULT_OPTIONS)} label="Reset" type="reset" icon={{ icon: MdRestartAlt, position: "left", size: 18 }} />
            </div>
            <div className="mt-4 p-4 bg-gray-50 dark:bg-boxdark rounded border border-stroke dark:border-strokedark">
              <div className="text-sm font-medium mb-2">After saving</div>
              <ul className="text-xs text-body dark:text-bodydark2 space-y-1">
                <li>• Test and reload: <code>sudo nginx -t &amp;&amp; sudo systemctl reload nginx</code></li>
                <li>• Get a certificate: <code>sudo certbot certonly --webroot -w /var/www/letsencrypt -d {o.domains.split(/[\s,]+/).filter(Boolean).join(" -d ")}</code></li>
                <li>• <code>http2 on;</code> needs NGINX 1.25.1+. On older versions use <code>listen 443 ssl http2;</code> instead.</li>
                <li>• The WebSocket <code>map</code> block belongs in the <code>http {"{}"}</code> context (e.g. <code>nginx.conf</code>), once per server.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
