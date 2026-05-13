import Link from "next/link";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function InviteConfigMissing() {
  return (
    <div className="flex min-h-full flex-1 flex-col items-center justify-center px-4 py-16">
      <Card className="w-full max-w-lg border-zinc-200/80 bg-white/80 shadow-sm backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-950/80">
        <CardHeader className="space-y-1">
          <CardTitle className="text-xl">邀请码配置不一致</CardTitle>
          <CardDescription className="space-y-3 text-zinc-600 dark:text-zinc-400">
            <p className="leading-6">
              服务端没有读取到有效的 <code className="rounded-md bg-zinc-100 px-1.5 py-0.5 text-xs dark:bg-zinc-900">INVITE_CODE</code>
              ，但访问已被中间件拦截，通常发生在{" "}
              <strong className="font-medium text-zinc-800 dark:text-zinc-200">
                Docker 镜像构建阶段未传入邀请码、与运行时{" "}
                <code className="rounded-md bg-zinc-100 px-1.5 py-0.5 text-xs dark:bg-zinc-900">.env</code>{" "}
                不一致
              </strong>
              ，或构建时写入了邀请码而运行时未加载到 Node 环境。
            </p>
            <p className="leading-6">
              请让构建与运行使用<strong className="font-medium text-zinc-800 dark:text-zinc-200">完全相同</strong>的{" "}
              <code className="rounded-md bg-zinc-100 px-1.5 py-0.5 text-xs dark:bg-zinc-900">INVITE_CODE</code>
              ，并重新构建镜像。若使用仓库提供的{" "}
              <code className="rounded-md bg-zinc-100 px-1.5 py-0.5 text-xs dark:bg-zinc-900">deploy.sh</code>
              ，构建时会从{" "}
              <code className="rounded-md bg-zinc-100 px-1.5 py-0.5 text-xs dark:bg-zinc-900">.env</code> 传入{" "}
              <code className="rounded-md bg-zinc-100 px-1.5 py-0.5 text-xs dark:bg-zinc-900">--build-arg INVITE_CODE</code>
              。
            </p>
            <p className="leading-6">
              若反向代理未正确设置{" "}
              <code className="rounded-md bg-zinc-100 px-1.5 py-0.5 text-xs dark:bg-zinc-900">
                X-Forwarded-Proto: https
              </code>
              ，也可能导致 Secure Cookie 无法保存并表现为反复跳转，请在代理层补上该头。
            </p>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link
            href="/"
            className="text-sm font-medium text-zinc-900 underline underline-offset-4 hover:text-zinc-700 dark:text-zinc-100 dark:hover:text-zinc-300"
          >
            尝试返回首页
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
