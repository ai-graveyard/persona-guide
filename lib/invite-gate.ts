const INVITE_HMAC_MESSAGE = "persona-guide-invite-v1";

export const INVITE_COOKIE_NAME = "persona_invite";

export function getInviteCodeFromEnv(): string {
  return (process.env.INVITE_CODE ?? "").trim();
}

export async function createInviteToken(inviteCode: string): Promise<string> {
  return hmacSha256Hex(inviteCode, INVITE_HMAC_MESSAGE);
}

export async function verifyInviteToken(
  inviteCode: string,
  cookieValue: string | undefined,
): Promise<boolean> {
  if (!cookieValue) return false;
  const expected = await createInviteToken(inviteCode);
  if (cookieValue.length !== expected.length) return false;
  return timingSafeEqualHex(cookieValue, expected);
}

async function hmacSha256Hex(secret: string, message: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(message),
  );
  const bytes = new Uint8Array(signature);
  return [...bytes]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function hexToBytes(hex: string): Uint8Array {
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}

function timingSafeEqualHex(a: string, b: string): boolean {
  try {
    const aa = hexToBytes(a);
    const bb = hexToBytes(b);
    if (aa.length !== bb.length) return false;
    let diff = 0;
    for (let i = 0; i < aa.length; i++) {
      diff |= aa[i]! ^ bb[i]!;
    }
    return diff === 0;
  } catch {
    return false;
  }
}
