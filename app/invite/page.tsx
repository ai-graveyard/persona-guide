import { cookies } from "next/headers";

import {
  getInviteCodeFromEnv,
  INVITE_COOKIE_NAME,
  verifyInviteToken,
} from "@/lib/invite-gate";

import { InviteAlreadyVerified } from "./invite-already-verified";
import { InviteConfigMissing } from "./invite-config-missing";
import { InviteForm } from "./invite-form";

export const dynamic = "force-dynamic";

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
    return <InviteConfigMissing />;
  }

  const jar = await cookies();
  const token = jar.get(INVITE_COOKIE_NAME)?.value;
  if (await verifyInviteToken(inviteCode, token)) {
    return <InviteAlreadyVerified />;
  }

  const sp = searchParams ? await searchParams : {};
  return <InviteForm redirectTo={safeInternalRedirect(sp.from)} />;
}
