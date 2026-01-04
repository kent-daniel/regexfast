import * as React from "react";
import { Card as UICard } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type CardProps = {
  as?: React.ElementType;
  children?: React.ReactNode;
  className?: string;
  ref?: React.Ref<HTMLDivElement>;
  tabIndex?: number;
  variant?: "primary" | "secondary" | "ghost" | "destructive";
};

/**
 * Agent Card wrapper - provides a simple single-component API
 * while using the shared UI Card internally.
 */
export const Card = ({
  as,
  children,
  className,
  ref,
  tabIndex,
  variant = "secondary"
}: CardProps) => {
  const Component = as ?? UICard;

  // If using a custom element type, render that directly
  if (as) {
    return (
      <Component
        className={cn(
          "w-full rounded-lg p-4",
          {
            "btn-primary": variant === "primary",
            "btn-secondary": variant === "secondary"
          },
          className
        )}
        ref={ref}
        tabIndex={tabIndex}
      >
        {children}
      </Component>
    );
  }

  // Use the UI Card with agent-specific styling
  return (
    <UICard
      className={cn(
        "w-full p-4",
        {
          "btn-primary": variant === "primary",
          "btn-secondary": variant === "secondary"
        },
        className
      )}
      ref={ref}
      tabIndex={tabIndex}
    >
      {children}
    </UICard>
  );
};
