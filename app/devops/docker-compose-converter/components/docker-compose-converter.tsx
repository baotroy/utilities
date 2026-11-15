"use client";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import Button from "@/components/Input/Button";
import { copyToClipboard, download } from "@/common/utils";
import { useMemo, useState } from "react";
import { MdContentCopy, MdDownload, MdOutlineClear, MdSwapHoriz } from "react-icons/md";
import { Check, LinkButton, Segmented, Warnings, outputClass, selectClass, textareaClass } from "@/app/devops/components/ui";
import { composeToDockerRun, dockerRunToCompose } from "./utils";

type Mode = "run2compose" | "compose2run";

const SAMPLE_RUN = `docker run -d --name web \\
  --restart unless-stopped \\
  -p 8080:80 -p 443:443 \\
  -e NODE_ENV=production -e API_URL="https://api.example.com" \\
  -v ./html:/usr/share/nginx/html:ro \\
  -v nginx_logs:/var/log/nginx \\
  --network app-net \\
  --health-cmd "curl -f http://localhost/ || exit 1" --health-interval 30s \\
  -m 512m --cpus 1.5 \\
  nginx:1.27-alpine

docker run -d --name db -e POSTGRES_PASSWORD=secret -v pgdata:/var/lib/postgresql/data --network app-net postgres:16`;

const SAMPLE_COMPOSE = `services:
  api:
    image: node:22-alpine
    container_name: api
    restart: always
    working_dir: /app
    command: npm run start
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: production
      DATABASE_URL: postgres://user:pass@db:5432/app
    env_file: .env
    volumes:
      - ./:/app
      - node_modules:/app/node_modules
    networks:
      - backend
    depends_on:
      - db
  db:
    image: postgres:16
    environment:
      - POSTGRES_PASSWORD=secret
    volumes:
      - pgdata:/var/lib/postgresql/data
    networks:
      - backend
networks:
  backend: {}
volumes:
  pgdata: {}
  node_modules: {}
`;

export default function DockerComposeConverterComponent() {
  const [mode, setMode] = useState<Mode>("run2compose");
  const [input, setInput] = useState("");
  const [version, setVersion] = useState("");
  const [detach, setDetach] = useState(true);
  const [multiline, setMultiline] = useState(true);
  const [createNetworks, setCreateNetworks] = useState(true);

  const result = useMemo(() => {
    if (!input.trim()) return { output: "", warnings: [] as string[] };
    return mode === "run2compose"
      ? dockerRunToCompose(input, version)
      : composeToDockerRun(input, { detach, multiline, createNetworks });
  }, [input, mode, version, detach, multiline, createNetworks]);

  const handleSwap = () => {
    const next: Mode = mode === "run2compose" ? "compose2run" : "run2compose";
    setInput(result.output);
    setMode(next);
  };

  const isRun = mode === "run2compose";

  return (
    <>
      <Breadcrumb />
      <div className="w-full">
        <p className="mb-6 text-sm text-body dark:text-bodydark2">
          Convert <code>docker run</code> commands into a <code>docker-compose.yml</code>, or turn a compose file back into
          <code> docker run</code> commands. Paste several commands to get several services. Everything runs in your browser.
        </p>

        <div className="mb-4 flex flex-wrap items-center gap-4">
          <Segmented<Mode>
            value={mode}
            onChange={setMode}
            options={[
              { value: "run2compose", label: "docker run → compose" },
              { value: "compose2run", label: "compose → docker run" },
            ]}
          />
          {isRun ? (
            <label className="flex items-center gap-2 text-sm text-body dark:text-bodydark2">
              version:
              <select className={selectClass} value={version} onChange={(e) => setVersion(e.target.value)}>
                <option value="">(none, Compose v2)</option>
                <option value="3.8">3.8</option>
                <option value="3">3</option>
                <option value="2.4">2.4</option>
              </select>
            </label>
          ) : (
            <>
              <Check checked={detach} onChange={setDetach}>Detached (-d)</Check>
              <Check checked={multiline} onChange={setMultiline}>One option per line</Check>
              <Check checked={createNetworks} onChange={setCreateNetworks}>Add docker network create</Check>
            </>
          )}
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="font-medium text-black dark:text-white">{isRun ? "docker run command(s)" : "docker-compose.yml"}</span>
              <LinkButton onClick={() => setInput(isRun ? SAMPLE_RUN : SAMPLE_COMPOSE)}>Load sample</LinkButton>
            </div>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              rows={22}
              spellCheck={false}
              placeholder={isRun ? "docker run -d -p 8080:80 --name web nginx" : "services:\n  web:\n    image: nginx\n    ports:\n      - \"8080:80\""}
              className={textareaClass}
            />
          </div>
          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="font-medium text-black dark:text-white">{isRun ? "docker-compose.yml" : "docker run command(s)"}</span>
            </div>
            <textarea
              value={result.output}
              readOnly
              rows={22}
              spellCheck={false}
              placeholder="Result appears here as you type..."
              className={outputClass}
            />
          </div>
        </div>

        <div className="my-4 flex flex-wrap gap-2">
          <Button
            handleOnClick={() => copyToClipboard(result.output)}
            label="Copy"
            type="outline"
            icon={{ icon: MdContentCopy, position: "left", size: 18 }}
            disabled={!result.output}
          />
          <Button
            handleOnClick={() =>
              isRun ? download(result.output, "docker-compose.yml", "text/yaml") : download(result.output, "docker-run.sh", "text/x-shellscript")
            }
            label="Download"
            type="outline"
            icon={{ icon: MdDownload, position: "left", size: 18 }}
            disabled={!result.output}
          />
          <Button
            handleOnClick={handleSwap}
            label="Use output as input"
            type="outline"
            icon={{ icon: MdSwapHoriz, position: "left", size: 18 }}
            disabled={!result.output}
          />
          <Button
            handleOnClick={() => setInput("")}
            label="Clear"
            type="reset"
            icon={{ icon: MdOutlineClear, position: "left", size: 18 }}
          />
        </div>

        <Warnings items={result.warnings} tone={result.output ? "warning" : "error"} />

        <div className="p-4 bg-gray-50 dark:bg-boxdark rounded border border-stroke dark:border-strokedark">
          <div className="text-sm font-medium mb-2">Notes</div>
          <ul className="text-xs text-body dark:text-bodydark2 space-y-1">
            <li>• Supports ports, volumes and --mount, env and --env-file, networks with aliases and IPs, restart, healthcheck, logging, resources (memory, CPUs, GPUs), capabilities, devices, ulimits, sysctls and more.</li>
            <li>• Line continuations with <code>\</code> (bash), <code>`</code> (PowerShell) and <code>^</code> (cmd) are understood.</li>
            <li>• Named volumes become top-level <code>volumes:</code>; bind mounts (paths) stay as they are.</li>
            <li>• Compose → run: <code>build:</code>, <code>depends_on</code> and extra networks have no single-command equivalent, so they are listed as notes.</li>
          </ul>
        </div>
      </div>
    </>
  );
}

