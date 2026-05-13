import { timingSafeEqual } from "node:crypto";

import { NextResponse } from "next/server";

import {
  createInviteToken,
  getInviteCodeFromEnv,
  INVITE_COOKIE_NAME,
} from "@/lib/invite-gate";
import { requestIsLikelyHttps } from "@/lib/request-https";

function timingSafeEqualString(a: string, b: string): boolean {
  const ba = Buffer.from(a, "utf8");
  const bb = Buffer.from(b, "utf8");
  if (ba.length !== bb.length) {
    return false;
  }
  return timingSafeEqual(ba, bb);
}

export async function POST(request: Request) {
  const expected = getInviteCodeFromEnv();
  if (!expected) {
    return NextResponse.json(
      { error: "未配置邀请码，访问门禁未启用" },
      { status: 400 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "请求格式无效" }, { status: 400 });
  }

  const submitted =
    typeof body === "object" &&
    body !== null &&
    "code" in body &&
    typeof (body as { code: unknown }).code === "string"
      ? (body as { code: string }).code.trim()
      : "";

  if (!timingSafeEqualString(submitted, expected)) {
    return NextResponse.json({ error: "邀请码不正确" }, { status: 401 });
  }

  const token = await createInviteToken(expected);
  const response = NextResponse.json({ ok: true });
  response.cookies.set(INVITE_COOKIE_NAME, token, {
    httpOnly: true,
    secure: requestIsLikelyHttps(request),
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 400,
  });
  return response;
}
