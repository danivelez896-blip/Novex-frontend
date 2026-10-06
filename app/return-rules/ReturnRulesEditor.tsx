"use client";

import {
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";

type ReturnRule = {
  id: number;
  companyId: number;
  storeId: number | null;
  productId: number | null;
  returnDays: number;
  allowReturns: boolean;
  allowRefund: boolean;
  allowSizeExchange: boolean;
  allowColorExchange: boolean;
  allowProductExchange: boolean;
  requirePhotos: boolean;
  autoApprove: boolean;
  rejectionMessage: string | null;
  isActive: boolean;
};

type Draft = Omit<
  ReturnRule,
  "id" | "companyId" | "storeId" | "productId"
>;

const DEFAULT_DRAFT: Draft = {
  returnDays: 30,
  allowReturns: true,
  allowRefund: true,
  allowSizeExchange: false,
  allowColorExchange: false,
  allowProductExchange: false,
  requirePhotos: false,
  autoApprove: true,
  rejectionMessage: null,
  isActive: true,
};

export default function ReturnRulesEditor({
  rule,
  companyId,
  storeId,
  canEdit,
}: {
  rule: ReturnRule | null;
  companyId: number;
  storeId: number;
  canEdit: boolean;
}) {
  const router = useRouter();
  const [draft, setDraft] =
    useState<Draft>(
      rule
        ? {
            returnDays:
              rule.returnDays,
            allowReturns:
              rule.allowReturns,
            allowRefund:
              rule.allowRefund,
            allowSizeExchange:
              rule.allowSizeExchange,
            allowColorExchange:
              rule.allowColorExchange,
            allowProductExchange:
              rule.allowProductExchange,
            requirePhotos:
              rule.requirePhotos,
            autoApprove:
              rule.autoApprove,
            rejectionMessage:
              rule.rejectionMessage,
            isActive:
              rule.isActive,
          }
        : DEFAULT_DRAFT
    );
  const [saving, setSaving] =
    useState(false);
  const [message, setMessage] =
    useState<string | null>(null);
  const [error, setError] =
    useState<string | null>(null);

  const approvalText = useMemo(
    () =>
      draft.autoApprove
        ? "Las solicitudes que cumplan las reglas se aprobarán automáticamente."
        : "Las solicitudes quedarán pendientes de revisión manual.",
    [draft.autoApprove]
  );

  function setBoolean(
    key: keyof Draft,
    value: boolean
  ) {
    setDraft((current) => ({
      ...current,
      [key]: value,
    }));
  }

  async function save() {
    if (!canEdit || saving) {
      return;
    }

    setSaving(true);
    setMessage(null);
    setError(null);

    const url = rule
      ? `/api/return-rules/${rule.id}`
      : "/api/return-rules";

    const body = rule
      ? draft
      : {
          ...draft,
          companyId,
          storeId,
        };

    try {
      const response = await fetch(
        url,
        {
          method: rule
            ? "PATCH"
            : "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify(body),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ??
            "No se pudo guardar la regla."
        );
      }

      setMessage(
        rule
          ? "Regla actualizada."
          : "Regla creada."
      );
      router.refresh();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "No se pudo guardar la regla."
      );
    } finally {
      setSaving(false);
    }
  }

  const toggles: {
    key: keyof Draft;
    label: string;
    description: string;
  }[] = [
    {
      key: "allowReturns",
      label: "Permitir devoluciones",
      description:
        "Activa o bloquea las devoluciones para esta tienda.",
    },
    {
      key: "allowRefund",
      label: "Permitir reembolso",
      description:
        "Permite devolver el importe al cliente.",
    },
    {
      key: "allowSizeExchange",
      label: "Cambio de talla",
      description:
        "Permite solicitar otra talla.",
    },
    {
      key: "allowColorExchange",
      label: "Cambio de color",
      description:
        "Permite solicitar otro color.",
    },
    {
      key: "allowProductExchange",
      label: "Cambio de producto",
      description:
        "Permite cambiar por otro producto.",
    },
    {
      key: "requirePhotos",
      label: "Fotos obligatorias",
      description:
        "Exige imágenes durante la solicitud.",
    },
    {
      key: "autoApprove",
      label: "Aprobación automática",
      description:
        approvalText,
    },
    {
      key: "isActive",
      label: "Regla activa",
      description:
        "Solo las reglas activas se aplican.",
    },
  ];

  return (
    <div className="space-y-6">
      {!canEdit && (
        <div className="rounded-xl border border-amber-800/50 bg-amber-500/10 p-4 text-sm text-amber-300">
          Tu rol permite consultar las reglas, pero solo Propietario y Administrador pueden modificarlas.
        </div>
      )}

      <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
        <div>
          <p className="text-sm text-zinc-500">
            Plazo de devolución
          </p>
          <div className="mt-3 flex max-w-xs items-center gap-3">
            <input
              type="number"
              min={1}
              max={365}
              disabled={!canEdit}
              value={
                draft.returnDays
              }
              onChange={(event) =>
                setDraft(
                  (current) => ({
                    ...current,
                    returnDays:
                      Number(
                        event.target
                          .value
                      ),
                  })
                )
              }
              className="w-28 rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm outline-none disabled:opacity-60"
            />
            <span className="text-sm text-zinc-400">
              días
            </span>
          </div>
        </div>

        <div className="mt-6 grid gap-3 lg:grid-cols-2">
          {toggles.map(
            ({
              key,
              label,
              description,
            }) => (
              <label
                key={key}
                className="flex cursor-pointer items-start justify-between gap-4 rounded-xl border border-zinc-800 bg-zinc-950 p-4"
              >
                <div>
                  <p className="text-sm font-medium">
                    {label}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-zinc-500">
                    {description}
                  </p>
                </div>

                <input
                  type="checkbox"
                  disabled={!canEdit}
                  checked={Boolean(
                    draft[key]
                  )}
                  onChange={(event) =>
                    setBoolean(
                      key,
                      event.target.checked
                    )
                  }
                  className="mt-1 h-4 w-4"
                />
              </label>
            )
          )}
        </div>

        <div className="mt-6">
          <label className="text-sm text-zinc-500">
            Mensaje de rechazo
          </label>
          <textarea
            disabled={!canEdit}
            value={
              draft.rejectionMessage ??
              ""
            }
            onChange={(event) =>
              setDraft(
                (current) => ({
                  ...current,
                  rejectionMessage:
                    event.target.value ||
                    null,
                })
              )
            }
            placeholder="Mensaje que verá el cliente cuando una devolución sea rechazada."
            rows={4}
            className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm outline-none placeholder:text-zinc-600 disabled:opacity-60"
          />
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button
            type="button"
            disabled={
              !canEdit || saving
            }
            onClick={() =>
              void save()
            }
            className="rounded-xl bg-white px-5 py-3 text-sm font-medium text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving
              ? "Guardando..."
              : rule
                ? "Guardar cambios"
                : "Crear regla"}
          </button>

          {message && (
            <p className="text-sm text-emerald-400">
              {message}
            </p>
          )}

          {error && (
            <p className="text-sm text-red-400">
              {error}
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
