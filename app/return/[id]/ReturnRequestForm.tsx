"use client";

import {
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";

type OrderItem = {
  id: number;
  productName: string;
  variantName: string | null;
  sku: string | null;
  quantity: number;
  unitPrice: string;
  currency: string;
  isReturnable: boolean;
};

type ReturnRule = {
  requirePhotos: boolean;
  allowReturns: boolean;
  isActive: boolean;
  withinReturnPeriod: boolean;
};

type ItemDraft = {
  selected: boolean;
  quantity: number;
  reason: string;
  comment: string;
};

const REASONS = [
  "Talla incorrecta",
  "Producto defectuoso",
  "No era lo esperado",
  "Producto incorrecto",
  "Ya no lo necesito",
  "Otro",
];

export default function ReturnRequestForm({
  orderPublicId,
  items,
  rule,
}: {
  orderPublicId: string;
  items: OrderItem[];
  rule: ReturnRule | null;
}) {
  const router = useRouter();

  const [drafts, setDrafts] = useState<
    Record<number, ItemDraft>
  >(() =>
    Object.fromEntries(
      items.map((item) => [
        item.id,
        {
          selected: false,
          quantity: 1,
          reason: "",
          comment: "",
        },
      ])
    )
  );

  const [photos, setPhotos] =
    useState<File[]>([]);
  const [submitting, setSubmitting] =
    useState(false);
  const [message, setMessage] =
    useState("");

  const galleryInputRef =
    useRef<HTMLInputElement>(null);
  const cameraInputRef =
    useRef<HTMLInputElement>(null);

  const selectedItems = useMemo(
    () =>
      items.filter(
        (item) =>
          drafts[item.id]?.selected
      ),
    [items, drafts]
  );

  function updateDraft(
    itemId: number,
    patch: Partial<ItemDraft>
  ) {
    setDrafts((current) => ({
      ...current,
      [itemId]: {
        ...current[itemId],
        ...patch,
      },
    }));
  }

  function handlePhotos(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const selectedFiles =
      Array.from(
        event.target.files ?? []
      );

    event.target.value = "";

    if (selectedFiles.length === 0) {
      return;
    }

    const invalidFile =
      selectedFiles.find(
        (file) =>
          ![
            "image/jpeg",
            "image/png",
            "image/webp",
          ].includes(file.type)
      );

    if (invalidFile) {
      setMessage(
        "Solo puedes subir imágenes JPG, PNG o WEBP."
      );
      return;
    }

    const oversizedFile =
      selectedFiles.find(
        (file) =>
          file.size >
          5 * 1024 * 1024
      );

    if (oversizedFile) {
      setMessage(
        "Cada foto puede ocupar como máximo 5 MB."
      );
      return;
    }

    setPhotos((current) => {
      const combined = [
        ...current,
        ...selectedFiles,
      ];

      const unique = combined.filter(
        (file, index, all) =>
          all.findIndex(
            (candidate) =>
              candidate.name ===
                file.name &&
              candidate.size ===
                file.size &&
              candidate.lastModified ===
                file.lastModified
          ) === index
      );

      if (unique.length > 5) {
        setMessage(
          "Puedes adjuntar un máximo de 5 fotos en total."
        );
        return current;
      }

      setMessage("");
      return unique;
    });
  }

  function removePhoto(
    index: number
  ) {
    setPhotos((current) =>
      current.filter(
        (_, photoIndex) =>
          photoIndex !== index
      )
    );
    setMessage("");
  }

  async function uploadPhotos(
    casePublicId: string
  ) {
    if (photos.length === 0) {
      return true;
    }

    const formData =
      new FormData();

    formData.append(
      "casePublicId",
      casePublicId
    );

    photos.forEach((photo) =>
      formData.append(
        "files",
        photo
      )
    );

    const response = await fetch(
      "/api/return-photos",
      {
        method: "POST",
        body: formData,
      }
    );

    return response.ok;
  }

  async function submitReturn() {
    setMessage("");

    if (
      selectedItems.length === 0
    ) {
      setMessage(
        "Selecciona al menos un producto para devolver."
      );
      return;
    }

    const missingReason =
      selectedItems.find(
        (item) =>
          !drafts[item.id]
            ?.reason
      );

    if (missingReason) {
      setMessage(
        "Selecciona un motivo para cada producto marcado."
      );
      return;
    }

    if (
      rule?.requirePhotos &&
      photos.length === 0
    ) {
      setMessage(
        "Esta tienda exige al menos una foto para solicitar la devolución."
      );
      return;
    }

    setSubmitting(true);

    try {
      const response =
        await fetch(
          `/api/public/returns/orders/${encodeURIComponent(orderPublicId)}/cases`,
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              items:
                selectedItems.map(
                  (item) => ({
                    orderItemId:
                      item.id,
                    quantity:
                      drafts[item.id]
                        .quantity,
                    reason:
                      drafts[item.id]
                        .reason,
                    customerComment:
                      drafts[item.id]
                        .comment ||
                      undefined,
                  })
                ),
            }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        setMessage(
          data.message ??
            "No se pudo crear la devolución."
        );
        return;
      }

      const photosUploaded =
        await uploadPhotos(
          data.publicId
        );

      if (!photosUploaded) {
        setMessage(
          "La devolución se ha creado, pero ha ocurrido un error al guardar las fotos."
        );
        return;
      }

      router.push(
        `/return/${orderPublicId}/success/${data.publicId}`
      );
    } catch {
      setMessage(
        "No se pudo crear la devolución."
      );
    } finally {
      setSubmitting(false);
    }
  }

  const canSubmit =
    Boolean(
      rule?.isActive &&
      rule.allowReturns &&
      rule.withinReturnPeriod
    );

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="mb-5">
          <h2 className="text-lg font-semibold">
            Selecciona los productos
          </h2>
          <p className="mt-1 text-sm text-zinc-500">
            Puedes incluir varios productos en una sola solicitud.
          </p>
        </div>

        <div className="space-y-4">
          {items.map((item) => {
            const draft =
              drafts[item.id];

            const selectable =
              item.isReturnable &&
              canSubmit;

            return (
              <div
                key={item.id}
                className={`rounded-xl border p-4 ${
                  draft?.selected
                    ? "border-zinc-400 bg-zinc-50"
                    : "border-zinc-200"
                }`}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={
                      draft?.selected ??
                      false
                    }
                    disabled={
                      !selectable
                    }
                    onChange={(event) =>
                      updateDraft(
                        item.id,
                        {
                          selected:
                            event
                              .target
                              .checked,
                        }
                      )
                    }
                    className="mt-1 h-4 w-4"
                  />

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-medium">
                          {item.productName}
                        </p>
                        <p className="mt-1 text-sm text-zinc-500">
                          {item.variantName ??
                            "Sin variante"}
                        </p>
                        <p className="mt-1 text-xs text-zinc-400">
                          SKU:{" "}
                          {item.sku ??
                            "-"}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="text-sm">
                          {item.unitPrice}{" "}
                          {item.currency}
                        </p>
                        <p className="mt-1 text-xs text-zinc-500">
                          Comprados:{" "}
                          {item.quantity}
                        </p>
                      </div>
                    </div>

                    {!selectable && (
                      <p className="mt-3 text-sm text-red-500">
                        Este producto no está disponible para devolución.
                      </p>
                    )}

                    {draft?.selected &&
                      selectable && (
                        <div className="mt-4 grid gap-4 border-t border-zinc-200 pt-4 md:grid-cols-2">
                          <div>
                            <label className="text-sm font-medium">
                              Cantidad
                            </label>
                            <select
                              value={
                                draft.quantity
                              }
                              onChange={(
                                event
                              ) =>
                                updateDraft(
                                  item.id,
                                  {
                                    quantity:
                                      Number(
                                        event
                                          .target
                                          .value
                                      ),
                                  }
                                )
                              }
                              className="mt-2 w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm"
                            >
                              {Array.from(
                                {
                                  length:
                                    item.quantity,
                                },
                                (
                                  _,
                                  index
                                ) =>
                                  index +
                                  1
                              ).map(
                                (
                                  quantity
                                ) => (
                                  <option
                                    key={
                                      quantity
                                    }
                                    value={
                                      quantity
                                    }
                                  >
                                    {
                                      quantity
                                    }
                                  </option>
                                )
                              )}
                            </select>
                          </div>

                          <div>
                            <label className="text-sm font-medium">
                              Motivo
                            </label>
                            <select
                              value={
                                draft.reason
                              }
                              onChange={(
                                event
                              ) =>
                                updateDraft(
                                  item.id,
                                  {
                                    reason:
                                      event
                                        .target
                                        .value,
                                  }
                                )
                              }
                              className="mt-2 w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm"
                            >
                              <option value="">
                                Selecciona un motivo
                              </option>
                              {REASONS.map(
                                (
                                  reason
                                ) => (
                                  <option
                                    key={
                                      reason
                                    }
                                    value={
                                      reason
                                    }
                                  >
                                    {
                                      reason
                                    }
                                  </option>
                                )
                              )}
                            </select>
                          </div>

                          <div className="md:col-span-2">
                            <label className="text-sm font-medium">
                              Comentario
                            </label>
                            <textarea
                              value={
                                draft.comment
                              }
                              onChange={(
                                event
                              ) =>
                                updateDraft(
                                  item.id,
                                  {
                                    comment:
                                      event
                                        .target
                                        .value,
                                  }
                                )
                              }
                              rows={3}
                              placeholder="Añade información adicional si lo necesitas..."
                              className="mt-2 w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm"
                            />
                          </div>
                        </div>
                      )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {selectedItems.length >
        0 && (
        <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold">
              Fotos
            </h2>

            {rule?.requirePhotos && (
              <span className="rounded-full bg-red-50 px-2 py-1 text-xs text-red-600">
                Obligatorio
              </span>
            )}
          </div>

          <p className="mt-2 text-sm text-zinc-500">
            Puedes añadirlas poco a poco. Máximo 5 fotos en total, JPG, PNG o WEBP y 5 MB por imagen.
          </p>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() =>
                cameraInputRef.current?.click()
              }
              className="rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm font-medium transition hover:bg-zinc-50"
            >
              Hacer foto
            </button>

            <button
              type="button"
              onClick={() =>
                galleryInputRef.current?.click()
              }
              className="rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm font-medium transition hover:bg-zinc-50"
            >
              Elegir de la galería
            </button>
          </div>

          <input
            ref={cameraInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            capture="environment"
            onChange={handlePhotos}
            className="hidden"
          />

          <input
            ref={galleryInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            onChange={handlePhotos}
            className="hidden"
          />

          {photos.length > 0 && (
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">
                  Fotos adjuntas
                </p>
                <span className="text-xs text-zinc-500">
                  {photos.length}/5
                </span>
              </div>

              {photos.map(
                (photo, index) => (
                  <div
                    key={`${photo.name}-${photo.size}-${photo.lastModified}`}
                    className="flex items-center justify-between gap-3 rounded-lg bg-zinc-100 px-3 py-2"
                  >
                    <p className="min-w-0 truncate text-xs text-zinc-600">
                      {photo.name}
                    </p>

                    <button
                      type="button"
                      onClick={() =>
                        removePhoto(index)
                      }
                      className="shrink-0 text-xs font-medium text-red-600 hover:text-red-700"
                    >
                      Quitar
                    </button>
                  </div>
                )
              )}

              {photos.length < 5 && (
                <p className="text-xs text-zinc-500">
                  Puedes seguir añadiendo fotos una a una o varias de golpe.
                </p>
              )}
            </div>
          )}
        </section>
      )}

      {message && (
        <p className="text-sm text-red-500">
          {message}
        </p>
      )}

      <button
        type="button"
        onClick={() =>
          void submitReturn()
        }
        disabled={
          submitting ||
          !canSubmit
        }
        className="w-full rounded-xl bg-black px-5 py-3 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {submitting
          ? "Enviando solicitud..."
          : selectedItems.length > 0
            ? `Enviar devolución (${selectedItems.length} producto${selectedItems.length === 1 ? "" : "s"})`
            : "Selecciona productos para continuar"}
      </button>
    </div>
  );
}
