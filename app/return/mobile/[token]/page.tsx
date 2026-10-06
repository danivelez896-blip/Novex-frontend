"use client";

import Link from "next/link";
import {
  use,
  useEffect,
  useRef,
  useState,
} from "react";

type DraftData = {
  token: string;
  orderPublicId: string;
  photoCount: number;
  expiresAt: string;
};

export default function ReturnMobilePage({
  params,
}: {
  params: Promise<{
    token: string;
  }>;
}) {
  const { token } = use(params);

  const [
    draft,
    setDraft,
  ] = useState<DraftData | null>(
    null
  );
  const [loading, setLoading] =
    useState(true);
  const [uploading, setUploading] =
    useState(false);
  const [message, setMessage] =
    useState("");

  const cameraInputRef =
    useRef<HTMLInputElement>(null);
  const galleryInputRef =
    useRef<HTMLInputElement>(null);

  async function refreshDraft() {
    const response = await fetch(
      `/api/public/returns/drafts/${encodeURIComponent(token)}`,
      {
        cache: "no-store",
      }
    );

    if (!response.ok) {
      const data =
        await response.json();

      throw new Error(
        data.message ??
          "Este enlace ya no está disponible."
      );
    }

    const data =
      (await response.json()) as DraftData;

    setDraft(data);
  }

  useEffect(() => {
    async function load() {
      try {
        await refreshDraft();
      } catch (caught) {
        setMessage(
          caught instanceof Error
            ? caught.message
            : "No se pudo abrir el enlace."
        );
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [token]);

  async function upload(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const files =
      Array.from(
        event.target.files ?? []
      );

    event.target.value = "";

    if (
      files.length === 0
    ) {
      return;
    }

    setUploading(true);
    setMessage("");

    try {
      const formData =
        new FormData();

      formData.append(
        "draftToken",
        token
      );

      files.forEach((file) =>
        formData.append(
          "files",
          file
        )
      );

      const response =
        await fetch(
          "/api/return-photos",
          {
            method: "POST",
            body: formData,
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ??
            "No se pudieron subir las fotos."
        );
      }

      await refreshDraft();

      setMessage(
        "Fotos guardadas. Puedes continuar en este móvil o volver al ordenador."
      );
    } catch (caught) {
      setMessage(
        caught instanceof Error
          ? caught.message
          : "No se pudieron subir las fotos."
      );
    } finally {
      setUploading(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-zinc-100 px-5 py-8 text-zinc-900">
        <div className="mx-auto max-w-md">
          <p className="text-sm text-zinc-500">
            Preparando la subida de fotos...
          </p>
        </div>
      </main>
    );
  }

  if (!draft) {
    return (
      <main className="min-h-screen bg-zinc-100 px-5 py-8 text-zinc-900">
        <div className="mx-auto max-w-md rounded-2xl border border-red-200 bg-white p-6 shadow-sm">
          <h1 className="text-xl font-semibold">
            Enlace no disponible
          </h1>
          <p className="mt-2 text-sm text-zinc-600">
            {message}
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-100 px-5 py-8 text-zinc-900">
      <div className="mx-auto max-w-md">
        <div className="mb-6 text-center">
          <p className="text-sm text-zinc-500">
            Novex
          </p>
          <h1 className="mt-2 text-2xl font-semibold">
            Añadir fotos
          </h1>
          <p className="mt-2 text-sm text-zinc-600">
            Las fotos se guardarán en la devolución que tienes abierta en el ordenador.
          </p>
        </div>

        <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="rounded-xl bg-zinc-100 p-4 text-center">
            <p className="text-sm text-zinc-500">
              Fotos recibidas
            </p>
            <p className="mt-1 text-3xl font-semibold">
              {draft.photoCount}/5
            </p>
          </div>

          <div className="mt-5 grid gap-3">
            <button
              type="button"
              disabled={
                uploading ||
                draft.photoCount >= 5
              }
              onClick={() =>
                cameraInputRef.current?.click()
              }
              className="rounded-xl bg-black px-4 py-3 text-sm font-medium text-white disabled:opacity-50"
            >
              Hacer foto
            </button>

            <button
              type="button"
              disabled={
                uploading ||
                draft.photoCount >= 5
              }
              onClick={() =>
                galleryInputRef.current?.click()
              }
              className="rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm font-medium disabled:opacity-50"
            >
              Elegir de la galería
            </button>
          </div>

          <input
            ref={cameraInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            capture="environment"
            onChange={upload}
            className="hidden"
          />

          <input
            ref={galleryInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            onChange={upload}
            className="hidden"
          />

          {uploading && (
            <p className="mt-4 text-center text-sm text-zinc-500">
              Subiendo fotos...
            </p>
          )}

          {message && (
            <p className="mt-4 rounded-xl bg-zinc-100 px-3 py-3 text-sm text-zinc-700">
              {message}
            </p>
          )}

          <div className="mt-6 border-t border-zinc-200 pt-5">
            <p className="text-sm font-medium">
              ¿Qué quieres hacer ahora?
            </p>

            <Link
              href={`/return/${draft.orderPublicId}?draft=${encodeURIComponent(token)}`}
              className="mt-3 block rounded-xl bg-zinc-900 px-4 py-3 text-center text-sm font-medium text-white"
            >
              Continuar la devolución en este móvil
            </Link>

            <p className="mt-3 text-center text-xs text-zinc-500">
              O vuelve al ordenador. Las fotos aparecerán allí automáticamente en unos segundos.
            </p>
          </div>
        </section>

        <p className="mt-6 text-center text-xs text-zinc-400">
          Enlace temporal y seguro de Novex
        </p>
      </div>
    </main>
  );
}
