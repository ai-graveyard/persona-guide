"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

type InviteFormProps = {
  redirectTo: string;
};

export function InviteForm({ redirectTo }: InviteFormProps) {
  const [code, setCode] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [pending, setPending] = React.useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);
    try {
      const res = await fetch("/api/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data: { error?: string } = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "校验失败，请稍后重试");
        return;
      }
      window.location.assign(redirectTo);
    } catch {
      setError("网络异常，请稍后重试");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex min-h-full flex-1 flex-col items-center justify-center px-4 py-16">
      <Card className="w-full max-w-md border-zinc-200/80 bg-white/80 shadow-sm backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-950/80">
        <CardHeader className="space-y-1">
          <CardTitle className="text-xl">请输入邀请码</CardTitle>
          <CardDescription>
            本站点仅限受邀用户访问，请输入管理员提供的邀请码后继续。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={onSubmit}>
            {error ? <Alert className="text-sm">{error}</Alert> : null}
            <div className="space-y-2">
              <label
                htmlFor="invite-code"
                className="text-sm font-medium text-zinc-800 dark:text-zinc-200"
              >
                邀请码
              </label>
              <input
                id="invite-code"
                name="code"
                type="password"
                autoComplete="off"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                disabled={pending}
                className={cn(
                  "flex h-10 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-base shadow-xs outline-none transition-colors",
                  "placeholder:text-zinc-400",
                  "focus-visible:border-zinc-400 focus-visible:ring-2 focus-visible:ring-zinc-400/30",
                  "disabled:cursor-not-allowed disabled:opacity-60",
                  "dark:border-zinc-800 dark:bg-zinc-950 dark:focus-visible:border-zinc-600 dark:focus-visible:ring-zinc-600/30",
                )}
                placeholder="粘贴或输入邀请码"
              />
            </div>
            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                  正在校验…
                </>
              ) : (
                "继续"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
