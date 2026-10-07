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
  customerConditions: string[];
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
  customerConditions: [],
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
            customerConditions:
              rule.customerConditions ?? [],
            isActive:
              rule.isActive,
          }
        : DEFAULT_DRAFT
    );
  const [
    returnDaysInput,
    setReturnDaysInput,
  ] = useState(
    String(
      rule?.returnDays ??
        DEFAULT_DRAFT.returnDays
    )
  );
  const [saving, setSaving] =
    useState(false);
  const [message, setMessage] =
    useState<string | null>(null);
  const [error, setError] =
    useState<string | null>(null);
  const [
    conditionInput,
    setConditionInput,
  ] = useState("");

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

    const parsedReturnDays =
      Number(returnDaysInput);

    if (
      !Number.isInteger(
        parsedReturnDays
      ) ||
      parsedReturnDays < 1 ||
      parsedReturnDays > 365
    ) {
      setError(
        "El plazo debe ser un número entero entre 1 y 365 días."
      );
      setSaving(false);
      return;
    }

    const normalizedDraft = {
      ...draft,
      returnDays:
        parsedReturnDays,
    };

    const url = rule
      ? `/api/return-rules/${rule.id}`
      : "/api/return-rules";

    const body = rule
      ? normalizedDraft
      : {
          ...normalizedDraft,
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

  const conditionSuggestions = [
    "El producto debe estar sin usar.",
    "El producto debe conservar su embalaje original.",
    "Las etiquetas deben permanecer intactas.",
    "El producto no debe haberse abierto.",
  ];

  function addCondition(
    value: string
  ) {
    const condition =
      value.trim();

    if (!condition) {
      return;
    }

    setDraft((current) => {
      if (
        current.customerConditions.some(
          (item) =>
            item.toLowerCase() ===
            condition.toLowerCase()
        )
      ) {
        return current;
      }

      return {
        ...current,
        customerConditions: [
          ...current.customerConditions,
          condition,
        ],
      };
    });

    setConditionInput("");
  }

  function removeCondition(
    index: number
  ) {
    setDraft((current) => ({
      ...current,
      customerConditions:
        current.customerConditions.filter(
          (_, itemIndex) =>
            itemIndex !== index
        ),
    }));
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
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              disabled={!canEdit}
              value={returnDaysInput}
              onChange={(event) => {
                const value =
                  event.target.value;

                if (
                  value === "" ||
                  /^\d{0,3}$/.test(
                    value
                  )
                ) {
                  setReturnDaysInput(
                    value
                  );
                }
              }}
              onBlur={() => {
                if (
                  returnDaysInput ===
                  ""
                ) {
                  setReturnDaysInput(
                    String(
                      draft.returnDays
                    )
                  );
                }
              }}
              className="w-28 rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm outline-none disabled:opacity-60"
            />
            <span className="text-sm text-zinc-400">
              días
            </span>
          </div>
        </div>

        <div className="mt-6 rounded-xl border border-zinc-800 bg-zinc-950 p-5">
          <p className="text-sm font-medium">
            Modo de aprobación
          </p>
          <p className="mt-1 text-xs leading-5 text-zinc-500">
            Decide qué ocurre cuando una solicitud cumple las reglas configuradas.
          </p>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              disabled={!canEdit}
              onClick={() =>
                setBoolean(
                  "autoApprove",
                  true
                )
              }
              className={`rounded-xl border px-4 py-4 text-left transition disabled:opacity-60 ${
                draft.autoApprove
                  ? "border-emerald-500 bg-emerald-500/10"
                  : "border-zinc-800 bg-zinc-900"
              }`}
            >
              <p className="text-sm font-medium">
                Aprobación automática
              </p>
              <p className="mt-1 text-xs leading-5 text-zinc-500">
                Si cumple las reglas, la devolución se aprueba automáticamente.
              </p>
            </button>

            <button
              type="button"
              disabled={!canEdit}
              onClick={() =>
                setBoolean(
                  "autoApprove",
                  false
                )
              }
              className={`rounded-xl border px-4 py-4 text-left transition disabled:opacity-60 ${
                !draft.autoApprove
                  ? "border-amber-500 bg-amber-500/10"
                  : "border-zinc-800 bg-zinc-900"
              }`}
            >
              <p className="text-sm font-medium">
                Revisión manual
              </p>
              <p className="mt-1 text-xs leading-5 text-zinc-500">
                La solicitud queda pendiente hasta que la tienda la apruebe o rechace.
              </p>
            </button>
          </div>

          <p className="mt-3 text-xs text-zinc-500">
            {approvalText}
          </p>
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

        <div className="mt-6 rounded-xl border border-zinc-800 bg-zinc-950 p-5">
          <div>
            <p className="text-sm font-medium">
              Condiciones visibles para el comprador
            </p>
            <p className="mt-1 text-xs leading-5 text-zinc-500">
              Añade las condiciones que quieras comunicar al cliente. Novex las mostrará en el portal de devolución.
            </p>
          </div>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <input
              type="text"
              disabled={!canEdit}
              value={conditionInput}
              onChange={(event) =>
                setConditionInput(
                  event.target.value
                )
              }
              onKeyDown={(event) => {
                if (
                  event.key === "Enter"
                ) {
                  event.preventDefault();
                  addCondition(
                    conditionInput
                  );
                }
              }}
              placeholder="Ej.: El producto debe estar sin abrir"
              className="min-w-0 flex-1 rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm outline-none placeholder:text-zinc-600 disabled:opacity-60"
            />

            <button
              type="button"
              disabled={
                !canEdit ||
                !conditionInput.trim()
              }
              onClick={() =>
                addCondition(
                  conditionInput
                )
              }
              className="rounded-xl border border-zinc-700 px-4 py-3 text-sm font-medium disabled:opacity-50"
            >
              Añadir condición
            </button>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {conditionSuggestions.map(
              (suggestion) => (
                <button
                  type="button"
                  key={suggestion}
                  disabled={!canEdit}
                  onClick={() =>
                    addCondition(
                      suggestion
                    )
                  }
                  className="rounded-full border border-zinc-700 px-3 py-1.5 text-xs text-zinc-400 transition hover:border-zinc-600 hover:text-zinc-200 disabled:opacity-50"
                >
                  + {suggestion}
                </button>
              )
            )}
          </div>

          {draft.customerConditions.length > 0 ? (
            <div className="mt-5 space-y-2">
              {draft.customerConditions.map(
                (
                  condition,
                  index
                ) => (
                  <div
                    key={`${condition}-${index}`}
                    className="flex items-start justify-between gap-4 rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3"
                  >
                    <p className="text-sm text-zinc-300">
                      {condition}
                    </p>

                    {canEdit && (
                      <button
                        type="button"
                        onClick={() =>
                          removeCondition(
                            index
                          )
                        }
                        className="shrink-0 text-xs text-zinc-500 hover:text-red-400"
                      >
                        Quitar
                      </button>
                    )}
                  </div>
                )
              )}
            </div>
          ) : (
            <p className="mt-4 text-xs text-zinc-600">
              Aún no has añadido condiciones personalizadas.
            </p>
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
