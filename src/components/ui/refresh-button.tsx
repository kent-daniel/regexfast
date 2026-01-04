"use client";

import { Button, type ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ArrowsClockwiseIcon } from "@phosphor-icons/react";

type RefreshButtonProps = ButtonProps & {
  spinning?: boolean;
};

export const RefreshButton = ({ spinning, ...props }: RefreshButtonProps) => (
  <Button size="icon" {...props}>
    <ArrowsClockwiseIcon
      className={cn({
        "animate-refresh": spinning,
        "size-4.5": props.size === "default" || !props.size,
        "size-4": props.size === "sm",
        "size-5": props.size === "lg"
      })}
    />
  </Button>
);
