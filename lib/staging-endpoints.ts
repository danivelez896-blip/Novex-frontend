// Resolve external endpoints explicitly: no hidden production fallback in staging.
export function configuredEndpoint(value: string | undefined): string | null {
  if (!value || !value.trim()) return null;
  try {
    const parsed = new URL(value);
    if (parsed.protocol !== "https:" && !(parsed.protocol === "http:" && ["localhost", "127.0.0.1"].includes(parsed.hostname))) return null;
    if (parsed.username || parsed.password || parsed.search || parsed.hash) return null;
    return value.replace(/\/$/, "");
  } catch {
    return null;
  }
}
