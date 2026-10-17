"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SendcloudReturnSettings({ storeId }: { storeId: number }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [houseNumber, setHouseNumber] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [city, setCity] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setStatus("");
    try {
      const response = await fetch(`/api/integrations/sendcloud/stores/${storeId}/return-settings`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          preferredContractId: 8957,
          preferredShippingOptionCode: "correos:paqretorno/return",
          returnAddress: { name, companyName, addressLine1, houseNumber, postalCode, city, countryCode: "ES" },
        }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(
        typeof data?.message === "string" ? data.message : "No se pudo guardar la configuración",
      );
      setStatus("Configuración guardada en Novex Staging. Todavía no se ha generado ninguna etiqueta.");
      router.refresh();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Error guardando la configuración");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={(event) => void save(event)}
      className="rounded-xl border border-zinc-700 bg-zinc-950 p-4">
      <h3 className="text-sm font-semibold">Dirección de devoluciones · Correos</h3>
      <p className="mt-2 text-xs text-zinc-400">Contrato 8957 · Método correos:paqretorno/return · País España.
        Introduce la dirección de devolución de tu tienda, no la dirección del comprador.
        La configuración se guarda solo en Staging.</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="text-sm">Nombre / destinatario
          <input value={name} onChange={e => setName(e.target.value)} autoComplete="name"
            className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 p-2" /></label>
        <label className="text-sm">Empresa (opcional)
          <input value={companyName} onChange={e => setCompanyName(e.target.value)}
            className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 p-2" /></label>
        <label className="text-sm">Calle
          <input required value={addressLine1} onChange={e => setAddressLine1(e.target.value)}
            className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 p-2" /></label>
        <label className="text-sm">Número
          <input value={houseNumber} onChange={e => setHouseNumber(e.target.value)}
            className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 p-2" /></label>
        <label className="text-sm">Código postal
          <input required value={postalCode} onChange={e => setPostalCode(e.target.value)}
            className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 p-2" /></label>
        <label className="text-sm">Ciudad
          <input required value={city} onChange={e => setCity(e.target.value)}
            className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 p-2" /></label>
      </div>
      <p className="mt-3 text-xs text-amber-300">
        Guardar no valida todavía disponibilidad, tarifa ni dirección con Correos.
        La creación de etiquetas continúa bloqueada en Staging.
      </p>
      <button type="submit" disabled={loading}
        className="mt-3 rounded-lg border border-zinc-600 px-4 py-2 text-sm disabled:opacity-50">
        {loading ? "Guardando…" : "Guardar configuración de devolución"}
      </button>
      {status && <p role="status" className="mt-3 text-sm">{status}</p>}
    </form>
  );
}
