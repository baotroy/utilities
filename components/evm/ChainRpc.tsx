"use client";
import { FC } from "react";
import { EVM_CHAINS } from "@/common/evmTools";

/** Chain picker that fills a public RPC URL, which the user can replace. */
const ChainRpc: FC<{ rpc: string; onChange: (rpc: string) => void }> = ({ rpc, onChange }) => {
  const chain = EVM_CHAINS.find((c) => c.rpc === rpc);
  return (
    <div className="mb-4 grid gap-3 sm:grid-cols-[14rem_1fr]">
      <div>
        <label className="mb-1.5 block text-sm font-semibold">Chain</label>
        <select
          className="custom-input w-full"
          value={chain ? String(chain.id) : "custom"}
          onChange={(e) => {
            const c = EVM_CHAINS.find((x) => String(x.id) === e.target.value);
            if (c) onChange(c.rpc);
          }}
        >
          {EVM_CHAINS.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} ({c.id})
            </option>
          ))}
          <option value="custom">Custom RPC</option>
        </select>
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-semibold">RPC URL</label>
        <input
          className="custom-input w-full font-mono text-sm"
          value={rpc}
          spellCheck={false}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://…"
        />
      </div>
    </div>
  );
};

export default ChainRpc;
