import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function InviteAlreadyVerified() {
  return (
    <div className="flex min-h-full flex-1 flex-col items-center justify-center px-4 py-16">
      <Card className="w-full max-w-md border-zinc-200/80 bg-white/80 shadow-sm backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-950/80">
        <CardHeader className="space-y-1">
          <CardTitle className="text-xl">已通过验证</CardTitle>
          <CardDescription className="leading-6 text-zinc-600 dark:text-zinc-400">
            Cookie 已与当前运行环境匹配。请点击下方进入首页。若再次被带回本页，多半是镜像构建时的{" "}
            <code className="rounded-md bg-zinc-100 px-1.5 py-0.5 text-xs dark:bg-zinc-900">
              INVITE_CODE
            </code>{" "}
            与宿主机{" "}
            <code className="rounded-md bg-zinc-100 px-1.5 py-0.5 text-xs dark:bg-zinc-900">
              .env
            </code>{" "}
            不一致，请重新执行带{" "}
            <code className="rounded-md bg-zinc-100 px-1.5 py-0.5 text-xs dark:bg-zinc-900">
              --build-arg
            </code>{" "}
            的构建。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild className="w-full">
            <Link href="/">进入首页</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
