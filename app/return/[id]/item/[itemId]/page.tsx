"use client";

import { useRouter } from "next/navigation";
import { use, useEffect, useState } from "react";

type OrderDetail = {
  id: number;
  storeId: number;
  customerId: number | null;
  orderNumber: string;

  items: {
    id: number;
    productName: string;
    variantName: string | null;
    sku: string | null;
    quantity: number;
    unitPrice: string;
    currency: string;
    isReturnable?: boolean;
  }[];
};

type ReturnRule = {
  id: number;
  storeId: number | null;
  requirePhotos: boolean;
  allowReturns: boolean;
  isActive: boolean;
};

export default function ReturnItemPage({
  params,
}: {
  params: Promise<{
    id: string;
    itemId: string;
  }>;
}) {
  const { id, itemId } = use(params);

  const router = useRouter();

  const [order, setOrder] =
    useState<OrderDetail | null>(null);

  const [rule, setRule] =
    useState<ReturnRule | null>(null);

  const [loadingOrder, setLoadingOrder] =
    useState(true);

  const [submitting, setSubmitting] =
    useState(false);

  const [reason, setReason] = useState("");
  const [comment, setComment] = useState("");

  const [photos, setPhotos] = useState<File[]>([]);

  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadData() {
      try {
        const [orderResponse, rulesResponse] =
          await Promise.all([
            fetch(`/api/orders/${id}`),
            fetch("/api/return-rules"),
          ]);

        if (!orderResponse.ok) {
          setMessage(
            "No se pudo cargar el pedido."
          );

          setLoadingOrder(false);
          return;
        }

        const orderData: OrderDetail =
          await orderResponse.json();

        const rulesData: ReturnRule[] =
          rulesResponse.ok
            ? await rulesResponse.json()
            : [];

        const activeRule =
          rulesData.find(
            (item) =>
              item.storeId ===
                orderData.storeId &&
              item.isActive
          ) ?? null;

        setOrder(orderData);
        setRule(activeRule);
        setLoadingOrder(false);
      } catch {
        setMessage(
          "No se pudieron cargar los datos."
        );

        setLoadingOrder(false);
      }
    }

    loadData();
  }, [id]);

  function handlePhotos(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const selectedFiles = Array.from(
      event.target.files ?? []
    );

    if (selectedFiles.length > 5) {
      setMessage(
        "Puedes subir un máximo de 5 fotos."
      );
      return;
    }

    const invalidFile = selectedFiles.find(
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

    const oversizedFile = selectedFiles.find(
      (file) =>
        file.size > 5 * 1024 * 1024
    );

    if (oversizedFile) {
      setMessage(
        "Cada foto puede ocupar como máximo 5 MB."
      );
      return;
    }

    setMessage("");
    setPhotos(selectedFiles);
  }

  async function uploadPhotos(caseId: number) {
    if (photos.length === 0) {
      return true;
    }

    const formData = new FormData();

    formData.append(
      "caseId",
      String(caseId)
    );

    photos.forEach((photo) => {
      formData.append("files", photo);
    });

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
    if (!order) {
      return;
    }

    if (!reason) {
      setMessage(
        "Selecciona un motivo de devolución."
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
    setMessage("");

    const response = await fetch(
      "/api/cases",
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/json",
        },
        body: JSON.stringify({
          storeId: order.storeId,
          orderId: order.id,
          customerId:
            order.customerId,
          type: "RETURN",

          items: [
            {
              orderItemId:
                Number(itemId),

              quantity: 1,

              reason,

              customerComment:
                comment || null,
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      setMessage(
        "No se pudo crear la devolución."
      );

      setSubmitting(false);
      return;
    }

    const newCase =
      await response.json();

    const photosUploaded =
      await uploadPhotos(newCase.id);

    if (!photosUploaded) {
      setMessage(
        "La devolución se ha creado, pero ha ocurrido un error al guardar las fotos."
      );

      setSubmitting(false);
      return;
    }

    router.push(
      `/return/${order.id}/success/${newCase.id}`
    );
  }

  if (loadingOrder) {
    return (
      <main className="min-h-screen bg-zinc-100 px-6 py-10 text-zinc-900">
        <div className="mx-auto max-w-2xl">
          <p className="text-sm text-zinc-500">
            Cargando pedido...
          </p>
        </div>
      </main>
    );
  }

  if (!order) {
    return (
      <main className="min-h-screen bg-zinc-100 px-6 py-10 text-zinc-900">
        <div className="mx-auto max-w-2xl">
          <p>
            No se pudo cargar el pedido.
          </p>
        </div>
      </main>
    );
  }

  const item = order.items.find(
    (orderItem) =>
      orderItem.id ===
      Number(itemId)
  );

  if (!item) {
    return (
      <main className="min-h-screen bg-zinc-100 px-6 py-10 text-zinc-900">
        <div className="mx-auto max-w-2xl">
          <p>
            Producto no encontrado.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-100 px-6 py-10 text-zinc-900">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8">
          <button
            type="button"
            onClick={() =>
              router.back()
            }
            className="text-sm text-zinc-500 transition hover:text-black"
          >
            ← Volver
          </button>
        </div>

        <div className="mb-8">
          <p className="text-sm text-zinc-500">
            Pedido{" "}
            {order.orderNumber}
          </p>

          <h1 className="mt-2 text-3xl font-semibold">
            Solicitar devolución
          </h1>

          <p className="mt-2 text-sm text-zinc-600">
            Cuéntanos por qué quieres
            devolver este producto.
          </p>
        </div>

        <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="border-b border-zinc-200 pb-5">
            <p className="font-medium">
              {item.productName}
            </p>

            <p className="mt-1 text-sm text-zinc-500">
              {item.variantName ??
                "Sin variante"}
            </p>

            <p className="mt-1 text-xs text-zinc-400">
              SKU:{" "}
              {item.sku ?? "-"}
            </p>
          </div>

          <div className="mt-6">
            <label className="text-sm font-medium">
              Motivo de la devolución
            </label>

            <select
              value={reason}
              onChange={(event) =>
                setReason(
                  event.target.value
                )
              }
              className="mt-2 w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm outline-none focus:border-zinc-500"
            >
              <option value="">
                Selecciona un motivo
              </option>

              <option value="Talla incorrecta">
                Talla incorrecta
              </option>

              <option value="Producto defectuoso">
                Producto defectuoso
              </option>

              <option value="No era lo esperado">
                No era lo esperado
              </option>

              <option value="Producto incorrecto">
                Producto incorrecto
              </option>

              <option value="Ya no lo necesito">
                Ya no lo necesito
              </option>

              <option value="Otro">
                Otro
              </option>
            </select>
          </div>

          <div className="mt-6">
            <label className="text-sm font-medium">
              Comentario
            </label>

            <textarea
              value={comment}
              onChange={(event) =>
                setComment(
                  event.target.value
                )
              }
              placeholder="Añade información adicional si lo necesitas..."
              rows={4}
              className="mt-2 w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm outline-none focus:border-zinc-500"
            />
          </div>

          <div className="mt-6">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">
                Fotos
              </label>

              {rule?.requirePhotos && (
                <span className="rounded-full bg-red-50 px-2 py-1 text-xs text-red-600">
                  Obligatorio
                </span>
              )}
            </div>

            <p className="mt-1 text-xs text-zinc-500">
              Máximo 5 fotos.
              JPG, PNG o WEBP.
              Máximo 5 MB por imagen.
            </p>

            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              onChange={handlePhotos}
              className="mt-3 block w-full rounded-xl border border-zinc-300 bg-white p-3 text-sm"
            />

            {photos.length > 0 && (
              <div className="mt-4 space-y-2">
                {photos.map(
                  (photo) => (
                    <div
                      key={`${photo.name}-${photo.size}`}
                      className="rounded-lg bg-zinc-100 px-3 py-2 text-xs text-zinc-600"
                    >
                      {photo.name}
                    </div>
                  )
                )}
              </div>
            )}
          </div>

          {message && (
            <p className="mt-5 text-sm text-red-500">
              {message}
            </p>
          )}

          <button
            type="button"
            onClick={submitReturn}
            disabled={submitting}
            className="mt-6 w-full rounded-xl bg-black px-5 py-3 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:opacity-50"
          >
            {submitting
              ? "Enviando solicitud..."
              : "Enviar solicitud de devolución"}
          </button>
        </section>

        <p className="mt-6 text-center text-xs text-zinc-400">
          Gestión de devoluciones
          mediante Novex
        </p>
      </div>
    </main>
  );
}