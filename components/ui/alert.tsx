import * as React from "react";

import { cn } from "@/lib/utils";

function Alert({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert"
      role="alert"
      className={cn(
        "rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-900 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-100",
        className,
      )}
      {...props}
    />
  );
}

export { Alert };
