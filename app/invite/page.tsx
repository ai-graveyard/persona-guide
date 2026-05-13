import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import {
  getInviteCodeFromEnv,
  INVITE_COOKIE_NAME,
  verifyInviteToken,
} from "@/lib/invite-gate";

import { InviteForm } from "./invite-form";

function safeInternalRedirect(raw: string | undefined): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) {
    return "/";
  }
  return raw;
}

type InvitePageProps = {
  searchParams?: Promise<{ from?: string }>;
};

export default async function InvitePage({ searchParams }: InvitePageProps) {
  const inviteCode = getInviteCodeFromEnv();
  if (!inviteCode) {
    redirect("/");
  }

  const jar = await cookies();
  const token = jar.get(INVITE_COOKIE_NAME)?.value;
  if (await verifyInviteToken(inviteCode, token)) {
    redirect("/");
  }

  const sp = searchParams ? await searchParams : {};
  return <InviteForm redirectTo={safeInternalRedirect(sp.from)} />;
}
