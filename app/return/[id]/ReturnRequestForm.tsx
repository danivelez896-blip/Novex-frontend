"use client";

import QRCode from "qrcode";
import { useRouter } from "next/navigation";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

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

type DraftResponse = {
  token: string;
  orderPublicId: string;
  payload?: Record<string, ItemDraft> | null;
  photoCount: number;
  expiresAt: string;
};

const REASONS = [
  "Talla incorrecta",
  "Producto defectuoso",
  "No era lo esperado",
  "Producto incorrecto",
  "Ya no lo necesito",
  "Otro",
];

function createInitialDrafts(
  items: OrderItem[]
) {
  return Object.fromEntries(
    items.map((item) => [
      item.id,
      {
        selected: false,
        quantity: 1,
        reason: "",
        comment: "",
      },
    ])
  ) as Record<number, ItemDraft>;
}

export default function ReturnRequestForm({
  orderPublicId,
  items,
  rule,
  initialDraftToken,
}: {
  orderPublicId: string;
  items: OrderItem[];
  rule: ReturnRule | null;
  initialDraftToken?: string;
}) {
  const router = useRouter();

  const [drafts, setDrafts] =
    useState<Record<number, ItemDraft>>(
      () => createInitialDrafts(items)
    );
  const [selectedIds, setSelectedIds] =
    useState<number[]>([]);
  const [photos, setPhotos] =
    useState<File[]>([]);
  const [draftToken, setDraftToken] =
    useState<string | null>(
      initialDraftToken ?? null
    );
  const [
    remotePhotoCount,
    setRemotePhotoCount,
  ] = useState(0);
  const [mobileUrl, setMobileUrl] =
    useState("");
  const [qrDataUrl, setQrDataUrl] =
    useState("");
  const [
    creatingMobileLink,
    setCreatingMobileLink,
  ] = useState(false);
  const [submitting, setSubmitting] =
    useState(false);
  const [message, setMessage] =
    useState("");
  const [cameraOpen, setCameraOpen] =
    useState(false);

  const galleryInputRef =
    useRef<HTMLInputElement>(null);
  const cameraInputRef =
    useRef<HTMLInputElement>(null);
  const videoRef =
    useRef<HTMLVideoElement>(null);
  const cameraStreamRef =
    useRef<MediaStream | null>(null);

  const selectedItems = useMemo(
    () =>
      items.filter((item) =>
        selectedIds.includes(item.id)
      ),
    [items, selectedIds]
  );

  const totalPhotoCount =
    photos.length + remotePhotoCount;

  useEffect(() => {
    if (!initialDraftToken) {
      return;
    }

    const token =
      initialDraftToken;
    let cancelled = false;

    async function restoreDraft() {
      const response = await fetch(
        `/api/public/returns/drafts/${encodeURIComponent(token)}`,
        {
          cache: "no-store",
        }
      );

      if (!response.ok) {
        if (!cancelled) {
          setMessage(
            "El enlace compartido ha caducado o ya no está disponible."
          );
        }
        return;
      }

      const data =
        (await response.json()) as DraftResponse;

      if (
        !cancelled &&
        data.orderPublicId ===
          orderPublicId
      ) {
        if (data.payload) {
          setDrafts((current) => ({
            ...current,
            ...data.payload,
          }));

          setSelectedIds(
            Object.entries(
              data.payload
            )
              .filter(
                ([, value]) =>
                  value?.selected
              )
              .map(([key]) =>
                Number(key)
              )
              .filter(Number.isFinite)
          );
        }
        setRemotePhotoCount(
          data.photoCount ?? 0
        );
      }
    }

    void restoreDraft();

    return () => {
      cancelled = true;
    };
  }, [
    initialDraftToken,
    orderPublicId,
  ]);

  useEffect(() => {
    if (!draftToken) {
      return;
    }

    const token =
      draftToken;

    const timeout =
      window.setTimeout(() => {
        void fetch(
          `/api/public/returns/drafts/${encodeURIComponent(token)}`,
          {
            method: "PATCH",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              payload: drafts,
            }),
          }
        );
      }, 500);

    return () =>
      window.clearTimeout(
        timeout
      );
  }, [draftToken, drafts]);

  useEffect(() => {
    if (!draftToken) {
      return;
    }

    const token =
      draftToken;
    let cancelled = false;

    async function refreshDraft() {
      const response = await fetch(
        `/api/public/returns/drafts/${encodeURIComponent(token)}`,
        {
          cache: "no-store",
        }
      );

      if (!response.ok) {
        return;
      }

      const data =
        (await response.json()) as DraftResponse;

      if (!cancelled) {
        setRemotePhotoCount(
          data.photoCount ?? 0
        );
      }
    }

    void refreshDraft();

    const interval =
      window.setInterval(
        () =>
          void refreshDraft(),
        2500
      );

    return () => {
      cancelled = true;
      window.clearInterval(
        interval
      );
    };
  }, [draftToken]);

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

  function setItemSelected(
    itemId: number,
    selected: boolean
  ) {
    setSelectedIds((current) =>
      selected
        ? current.includes(itemId)
          ? current
          : [...current, itemId]
        : current.filter(
            (id) => id !== itemId
          )
    );

    updateDraft(itemId, {
      selected,
    });
  }

  function handlePhotos(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const selectedFiles =
      Array.from(
        event.target.files ?? []
      );

    event.target.value = "";

    if (
      selectedFiles.length === 0
    ) {
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

      const unique =
        combined.filter(
          (
            file,
            index,
            all
          ) =>
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

      if (
        unique.length +
          remotePhotoCount >
        5
      ) {
        setMessage(
          "Puedes adjuntar un máximo de 5 fotos en total."
        );
        return current;
      }

      setMessage("");
      return unique;
    });
  }

  async function openCamera() {
    if (
      window.matchMedia(
        "(pointer: coarse)"
      ).matches
    ) {
      cameraInputRef.current?.click();
      return;
    }

    if (
      !navigator.mediaDevices
        ?.getUserMedia
    ) {
      cameraInputRef.current?.click();
      return;
    }

    try {
      const stream =
        await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });

      cameraStreamRef.current =
        stream;
      setCameraOpen(true);

      window.setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject =
            stream;
          void videoRef.current.play();
        }
      }, 0);
    } catch {
      setMessage(
        "No se pudo abrir la cámara. Revisa el permiso de cámara del navegador o elige una foto de tus archivos."
      );
    }
  }

  function closeCamera() {
    cameraStreamRef.current
      ?.getTracks()
      .forEach((track) =>
        track.stop()
      );
    cameraStreamRef.current =
      null;
    setCameraOpen(false);
  }

  function captureDesktopPhoto() {
    const video =
      videoRef.current;

    if (
      !video ||
      video.videoWidth === 0 ||
      video.videoHeight === 0
    ) {
      setMessage(
        "La cámara todavía no está lista."
      );
      return;
    }

    if (
      totalPhotoCount >= 5
    ) {
      setMessage(
        "Puedes adjuntar un máximo de 5 fotos en total."
      );
      return;
    }

    const canvas =
      document.createElement(
        "canvas"
      );

    canvas.width =
      video.videoWidth;
    canvas.height =
      video.videoHeight;

    const context =
      canvas.getContext("2d");

    if (!context) {
      setMessage(
        "No se pudo capturar la foto."
      );
      return;
    }

    context.drawImage(
      video,
      0,
      0,
      canvas.width,
      canvas.height
    );

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          setMessage(
            "No se pudo capturar la foto."
          );
          return;
        }

        const file =
          new File(
            [blob],
            `camera-${Date.now()}.jpg`,
            {
              type: "image/jpeg",
            }
          );

        setPhotos((current) => [
          ...current,
          file,
        ]);
        setMessage("");
        closeCamera();
      },
      "image/jpeg",
      0.9
    );
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

  async function ensureDraft() {
    if (draftToken) {
      return draftToken;
    }

    const response = await fetch(
      `/api/public/returns/orders/${encodeURIComponent(orderPublicId)}/drafts`,
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/json",
        },
        body: JSON.stringify({
          payload: drafts,
        }),
      }
    );

    const data =
      await response.json();

    if (!response.ok) {
      throw new Error(
        data.message ??
          "No se pudo crear el enlace para el móvil."
      );
    }

    setDraftToken(data.token);

    return data.token as string;
  }

  async function openMobileHandoff() {
    setCreatingMobileLink(true);
    setMessage("");

    try {
      const token =
        await ensureDraft();

      const url =
        `${window.location.origin}/return/mobile/${encodeURIComponent(token)}`;

      setMobileUrl(url);

      const qr =
        await QRCode.toDataURL(
          url,
          {
            width: 220,
            margin: 1,
          }
        );

      setQrDataUrl(qr);
    } catch (caught) {
      setMessage(
        caught instanceof Error
          ? caught.message
          : "No se pudo preparar el acceso desde el móvil."
      );
    } finally {
      setCreatingMobileLink(
        false
      );
    }
  }

  async function uploadFilesToDraft(
    token: string
  ) {
    if (
      photos.length === 0
    ) {
      return true;
    }

    const formData =
      new FormData();

    formData.append(
      "draftToken",
      token
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

    if (!response.ok) {
      const data =
        await response.json();

      setMessage(
        data.message ??
          "No se pudieron guardar las fotos."
      );

      return false;
    }

    const data =
      await response.json();

    setRemotePhotoCount(
      data.photoCount ??
        remotePhotoCount +
          photos.length
    );
    setPhotos([]);

    return true;
  }

  async function uploadFilesToCase(
    casePublicId: string
  ) {
    if (
      photos.length === 0
    ) {
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
      totalPhotoCount === 0
    ) {
      setMessage(
        "Esta tienda exige al menos una foto para solicitar la devolución."
      );
      return;
    }

    setSubmitting(true);

    try {
      let token =
        draftToken;

      if (
        token &&
        photos.length > 0
      ) {
        const uploaded =
          await uploadFilesToDraft(
            token
          );

        if (!uploaded) {
          return;
        }
      }

      const response =
        await fetch(
          `/api/public/returns/orders/${encodeURIComponent(orderPublicId)}/cases`,
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body:
              JSON.stringify({
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
                draftToken:
                  token ??
                  undefined,
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

      if (
        !token &&
        photos.length > 0
      ) {
        const uploaded =
          await uploadFilesToCase(
            data.publicId
          );

        if (!uploaded) {
          setMessage(
            "La devolución se ha creado, pero ha ocurrido un error al guardar las fotos."
          );
          return;
        }
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
                  selectedIds.includes(item.id)
                    ? "border-zinc-400 bg-zinc-50"
                    : "border-zinc-200"
                }`}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={
                      selectedIds.has(
                        item.id
                      )
                    }
                    disabled={
                      !selectable
                    }
                    onChange={(event) =>
                      setItemSelected(
                        item.id,
                        event.target.checked
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

                    {selectedIds.has(
                      item.id
                    ) &&
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
                              onChange={(event) =>
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
                                (_, index) =>
                                  index + 1
                              ).map(
                                (quantity) => (
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
                              onChange={(event) =>
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
                                (reason) => (
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
                              onChange={(event) =>
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

      {selectedItems.length > 0 && (
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
            Máximo 5 fotos en total. Puedes añadirlas desde este dispositivo o usar el móvil.
          </p>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() =>
                void openCamera()
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

          {cameraOpen && (
            <div className="mt-4 rounded-xl border border-zinc-200 bg-zinc-950 p-3">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="aspect-video w-full rounded-lg bg-black object-cover"
              />

              <div className="mt-3 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={
                    closeCamera
                  }
                  className="rounded-xl bg-white px-4 py-3 text-sm font-medium text-zinc-900"
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  onClick={
                    captureDesktopPhoto
                  }
                  className="rounded-xl bg-white px-4 py-3 text-sm font-medium text-zinc-900"
                >
                  Hacer foto
                </button>
              </div>
            </div>
          )}

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

          <div className="mt-4 hidden rounded-xl border border-dashed border-zinc-300 p-4 md:block">
            <p className="text-sm font-medium">
              ¿Las fotos están en tu móvil?
            </p>
            <p className="mt-1 text-sm text-zinc-500">
              Escanea un QR y súbelas desde el teléfono. Esta página detectará las fotos automáticamente.
            </p>

            <button
              type="button"
              onClick={() =>
                void openMobileHandoff()
              }
              disabled={
                creatingMobileLink
              }
              className="mt-3 rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50"
            >
              {creatingMobileLink
                ? "Preparando..."
                : qrDataUrl
                  ? "Mostrar QR de nuevo"
                  : "Subir fotos desde el móvil"}
            </button>

            {qrDataUrl && (
              <div className="mt-4 flex flex-wrap items-center gap-5">
                <img
                  src={qrDataUrl}
                  alt="QR para continuar la devolución en el móvil"
                  className="h-[220px] w-[220px] rounded-lg border border-zinc-200 bg-white p-2"
                />

                <div className="max-w-sm">
                  <p className="text-sm font-medium">
                    Escanea este código con el móvil
                  </p>
                  <p className="mt-1 text-xs text-zinc-500">
                    El enlace es temporal. Puedes subir las fotos y volver a este ordenador, o continuar toda la devolución desde el teléfono.
                  </p>
                  <button
                    type="button"
                    onClick={() =>
                      void navigator.clipboard.writeText(
                        mobileUrl
                      )
                    }
                    className="mt-3 text-sm font-medium underline"
                  >
                    Copiar enlace
                  </button>
                </div>
              </div>
            )}
          </div>

          {(photos.length > 0 ||
            remotePhotoCount > 0) && (
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">
                  Fotos adjuntas
                </p>
                <span className="text-xs text-zinc-500">
                  {totalPhotoCount}/5
                </span>
              </div>

              {remotePhotoCount > 0 && (
                <div className="rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
                  {remotePhotoCount} foto{remotePhotoCount === 1 ? "" : "s"} recibida{remotePhotoCount === 1 ? "" : "s"} desde el móvil. Ya puedes continuar aquí.
                </div>
              )}

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
