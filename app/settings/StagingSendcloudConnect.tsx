"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function StagingSendcloudConnect({ storeId }: { storeId: number }) {
  const router = useRouter();
  const [publicKey, setPublicKey] = useState("");
  const [secretKey, setSecretKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [connected, setConnected] = useState(false);

  async function connect(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/integrations/sendcloud/staging-connect", {
        method: "POST", cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storeId, publicKey, secretKey }),
      });
      if (!response.ok) throw new Error("No se pudo validar la conexión. Comprueba las claves y Railway Staging.");
      setSecretKey("");
      setPublicKey("");
      setConnected(true);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error de conexión");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={(e) => void connect(e)} className="rounded-xl border border-zinc-700 bg-zinc-950 p-4">
      <h3 className="text-sm font-semibold">Conectar Sendcloud Staging</h3>
      <p className="mt-2 text-xs text-amber-300">
        Introduce aquí las claves de la integración independiente Novex Staging.
        El backend las valida y guarda cifradas. No se crean etiquetas ni envíos.
      </p>
      <label className="mt-4 block text-sm">
        Clave pública
        <input required value={publicKey} onChange={(e) => setPublicKey(e.target.value)}
          autoComplete="off" className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 p-2" />
      </label>
      <label className="mt-3 block text-sm">
        Clave secreta
        <input required type="password" value={secretKey} onChange={(e) => setSecretKey(e.target.value)}
          autoComplete="new-password" className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 p-2" />
      </label>
      <button disabled={loading || !publicKey.trim() || !secretKey.trim()} type="submit"
        className="mt-4 rounded-lg bg-white px-4 py-2 text-sm text-black disabled:opacity-50">
        {loading ? "Comprobando…" : "Conectar Sendcloud Staging"}
      </button>
      {connected && <p className="mt-3 text-sm text-emerald-400">Conexión validada y guardada.</p>}
      {error && <p role="alert" className="mt-3 text-sm text-red-400">{error}</p>}
    </form>
  );
}
