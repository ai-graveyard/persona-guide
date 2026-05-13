/** Detect HTTPS as seen by the client (TLS termination at reverse proxy). */
export function requestIsLikelyHttps(request: Request): boolean {
  const forwarded = request.headers.get("x-forwarded-proto");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim().toLowerCase();
    if (first === "https") return true;
    if (first === "http") return false;
  }
  if (request.headers.get("x-forwarded-ssl") === "on") {
    return true;
  }
  try {
    return new URL(request.url).protocol === "https:";
  } catch {
    return false;
  }
}
