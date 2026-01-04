import { forwardRef } from "react";
import {
  Button as UIButton,
  type ButtonProps as UIButtonProps
} from "@/components/ui/button";
import { Loader } from "@/components/ui/loader";
import { Tooltip } from "../tooltip/Tooltip";
import { cn } from "@/lib/utils";

/**
 * Extended ButtonProps that wraps the canonical UI Button with additional
 * agent-specific features: loading, tooltip, shape, toggled, href, external.
 */
export type ButtonProps = Omit<UIButtonProps, "variant" | "size"> & {
  children?: React.ReactNode;
  displayContent?: "items-first" | "items-last";
  external?: boolean;
  href?: string;
  loading?: boolean;
  shape?: "base" | "square" | "circular";
  size?: "sm" | "md" | "lg" | "base";
  title?: string | React.ReactNode;
  toggled?: boolean;
  tooltip?: string;
  variant?: "primary" | "secondary" | "ghost" | "destructive" | "tertiary";
};

/**
 * Map agent variant names to UI Button variant names.
 * - "primary" → "default" (UI Button's default is the primary style)
 * - "tertiary" → "ghost"
 * - Others pass through as-is.
 */
function mapVariant(
  variant: ButtonProps["variant"]
): UIButtonProps["variant"] {
  switch (variant) {
    case "primary":
      return "default";
    case "tertiary":
      return "ghost";
    default:
      return variant;
  }
}

/**
 * Map agent size names to UI Button size names.
 * - "base" and "md" → "default"
 * - "sm" and "lg" pass through as-is.
 */
function mapSize(size: ButtonProps["size"]): UIButtonProps["size"] {
  switch (size) {
    case "base":
    case "md":
      return "default";
    default:
      return size;
  }
}

const ButtonComponent = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      className,
      disabled,
      displayContent = "items-last",
      external,
      href,
      loading,
      shape = "base",
      size = "base",
      title,
      toggled,
      variant = "secondary",
      ...props
    },
    ref
  ) => {
    const mappedVariant = mapVariant(variant);
    const mappedSize = mapSize(size);

    // Compute extra classes for agent-specific features
    const extraClasses = cn(
      // Shape modifiers
      {
        "aspect-square p-0": shape === "square",
        "aspect-square p-0 rounded-full": shape === "circular"
      },
      // Display content order
      {
        "flex-row-reverse": displayContent === "items-first"
      },
      // Toggled state
      {
        "bg-accent text-accent-foreground": toggled
      },
      className
    );

    // Content to render inside the button
    const content = (
      <>
        {title}
        {loading ? (
          <span
            className={cn("inline-flex items-center justify-center", {
              "w-3": size === "sm",
              "w-3.5": size === "md",
              "w-4": size === "base" || size === "lg",
              "ease-bounce transition-[width] duration-300 starting:w-0":
                !children
            })}
          >
            <Loader size={size === "sm" ? 12 : size === "md" ? 14 : 16} />
          </span>
        ) : (
          children
        )}
      </>
    );

    // If href is provided, render as an anchor
    if (href) {
      return (
        <UIButton
          ref={ref}
          variant={mappedVariant}
          size={mappedSize}
          className={extraClasses}
          disabled={disabled}
          asChild
          {...props}
        >
          <a
            href={href}
            rel={external ? "noopener noreferrer" : undefined}
            target={external ? "_blank" : undefined}
          >
            {content}
          </a>
        </UIButton>
      );
    }

    return (
      <UIButton
        ref={ref}
        variant={mappedVariant}
        size={mappedSize}
        className={extraClasses}
        disabled={disabled}
        {...props}
      >
        {content}
      </UIButton>
    );
  }
);

ButtonComponent.displayName = "ButtonComponent";

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (props, ref) => {
    if (props.tooltip) {
      return (
        <Tooltip
          content={props.tooltip}
          className={props.className}
          id={props.id}
        >
          <ButtonComponent {...props} ref={ref} className={undefined} />
        </Tooltip>
      );
    }

    return <ButtonComponent {...props} ref={ref} />;
  }
);

Button.displayName = "Button";
