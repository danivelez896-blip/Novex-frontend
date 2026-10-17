import { randomUUID } from "node:crypto";
import { portalAuthorization, portalBackendFetch, portalJson, portalResponseHeaders } from "./portal-route.ts";
import { configuredEndpoint } from "./staging-endpoints.ts";

const maxSize = 5 * 1024 * 1024;
const extensions: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

async function multipart(request: Request) {
  const type = request.headers.get("content-type") ?? "";
  if (!type.startsWith("multipart/form-data;") || !request.body) throw new Error("form");
  const reader = request.body.getReader();
  const chunks: ArrayBuffer[] = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.length;
      if (total > 26 * 1024 * 1024) { await reader.cancel(); throw new Error("size"); }
      chunks.push(value.slice().buffer);
    }
  } finally { reader.releaseLock(); }
  return new Response(new Blob(chunks), { headers: { "Content-Type": type } }).formData();
}

async function isImage(file: File) {
  const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  if (file.type === "image/jpeg") return bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
  if (file.type === "image/png") return [137,80,78,71,13,10,26,10].every((v, i) => bytes[i] === v);
  if (file.type === "image/webp") return String.fromCharCode(...bytes.slice(0,4)) === "RIFF" && String.fromCharCode(...bytes.slice(8,12)) === "WEBP";
  return false;
}

export async function uploadPortalPhotos(request: Request) {
  if (!portalAuthorization(request)) return portalJson({ message: "Acceso al portal requerido." }, 401);
  try {
    const form = await multipart(request);
    const token = form.get("draftToken");
    const entries = form.getAll("files");
    if (form.has("casePublicId") || typeof token !== "string" || !/^[A-Za-z0-9_-]{1,100}$/.test(token)) {
      return portalJson({ message: "Las fotos requieren un borrador autorizado." }, 400);
    }
    if (!entries.length || entries.length > 5 || entries.some(entry => !(entry instanceof File))) {
      return portalJson({ message: "Adjunta entre una y cinco imágenes." }, 400);
    }
    const files = entries as File[];
    for (const file of files) {
      if (!extensions[file.type] || file.size < 1 || file.size > maxSize || !file.name.trim() || file.name.length > 255 || /[\u0000-\u001f\u007f]/.test(file.name) || !await isImage(file)) {
        return portalJson({ message: "Solo se permiten imágenes JPG, PNG o WEBP de hasta 5 MB." }, 400);
      }
    }
    const resource = `drafts/${encodeURIComponent(token)}`;
    const checked = await portalBackendFetch(request, resource);
    if (!checked.ok) return portalJson({ message: "El borrador no está disponible." }, checked.status);
    const draft = await checked.json();
    if (draft.status !== "ACTIVE" || draft.consumedAt || Date.parse(draft.expiresAt) <= Date.now() || !Number.isFinite(Date.parse(draft.expiresAt)) || !Number.isSafeInteger(draft.photoCount) || draft.photoCount < 0 || draft.photoCount + files.length > 5) {
      return portalJson({ message: "El borrador ya no admite estas fotos." }, 409);
    }
    const storage = configuredEndpoint(process.env.SUPABASE_URL);
    const key = process.env.SUPABASE_SECRET_KEY;
    if (!storage || !key) return portalJson({ message: "No se pudieron guardar las imágenes." }, 503);
    const uploadedFiles = [];
    for (const file of files) {
      const path = `drafts/${token}/${randomUUID()}.${extensions[file.type]}`;
      const uploaded = await fetch(`${storage}/storage/v1/object/return-photos/${path}`, {
        method: "POST", headers: { apikey: key, "Content-Type": file.type, "x-upsert": "false" },
        body: file, redirect: "error", signal: AbortSignal.timeout(15_000),
      });
      if (!uploaded.ok) return portalJson({ message: "No se pudo guardar una imagen. Comprueba el borrador antes de reintentar." }, 503);
      const registered = await portalBackendFetch(request, `${resource}/photos`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileUrl: path, fileName: file.name, fileSizeBytes: file.size, mimeType: file.type }),
      });
      if (!registered.ok) return portalJson({ message: "No se pudo confirmar la foto. Comprueba el borrador antes de reintentar." }, registered.status);
      uploadedFiles.push({ path, name: file.name });
    }
    const refreshed = await portalBackendFetch(request, resource);
    if (!refreshed.ok) return portalJson({ message: "Las fotos se han enviado. No se pudo confirmar el estado del borrador." }, refreshed.status);
    const data = await refreshed.json();
    return portalJson({ success: true, files: uploadedFiles, photoCount: data.photoCount });
  } catch {
    return portalJson({ message: "No se pudo confirmar la subida. Comprueba el borrador antes de reintentar." }, 503);
  }
}

export async function viewReturnPhoto(request: Request, fetchCase: (id: string) => Promise<Response>) {
  const query = new URL(request.url).searchParams;
  const id = query.get("caseId"), path = query.get("path");
  if (!id || !/^[1-9]\d*$/.test(id) || !path || !/^(?:drafts\/[A-Za-z0-9_-]+|cases\/[1-9]\d*)\/[a-f0-9-]{36}\.(?:jpe?g|png|webp)$/.test(path)) {
    return portalJson({ message: "Imagen no disponible." }, 400);
  }
  try {
    const permitted = await fetchCase(id); // Authenticated backend enforces the company membership.
    if (!permitted.ok) return portalJson({ message: "Imagen no disponible." }, permitted.status);
    const data = await permitted.json();
    if (!Array.isArray(data.attachments) || !data.attachments.some((a: { fileUrl?: string; fileType?: string }) => a.fileUrl === path && a.fileType === "IMAGE")) {
      return portalJson({ message: "Imagen no disponible." }, 404);
    }
    const storage = configuredEndpoint(process.env.SUPABASE_URL), key = process.env.SUPABASE_SECRET_KEY;
    if (!storage || !key) return portalJson({ message: "Imagen no disponible." }, 503);
    const response = await fetch(`${storage}/storage/v1/object/authenticated/return-photos/${path}`, {
      headers: { apikey: key }, cache: "no-store", redirect: "error", signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) return portalJson({ message: "Imagen no disponible." }, response.status);
    const type = response.headers.get("content-type")?.split(";")[0] ?? "";
    if (!extensions[type]) return portalJson({ message: "Imagen no disponible." }, 502);
    return new Response(await response.arrayBuffer(), { headers: { ...portalResponseHeaders, "Content-Type": type, "X-Content-Type-Options": "nosniff" } });
  } catch { return portalJson({ message: "Imagen no disponible." }, 503); }
}
