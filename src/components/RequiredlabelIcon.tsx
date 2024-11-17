import { cn } from "@/lib/utils";
import { Asterisk } from "lucide-react";
import { ComponentPropsWithoutRef } from "react";

export default function RequiredlabelIcon({
  className,
  ...props
}: ComponentPropsWithoutRef<typeof Asterisk>) {
  return (
    <Asterisk
      className={cn("text-destructive inline size-3 align-top", className)}
    />
  );
}
