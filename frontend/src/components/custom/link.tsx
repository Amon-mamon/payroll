import React from "react";
import { Link as RouterLink, type LinkProps } from "react-router-dom";
import { cn } from "@/lib/utils";

interface AppLinkProps extends Omit<LinkProps, "to"> {
  href: string;
  external?: boolean;
  className?: string;
  children: React.ReactNode;
}

export function AppLink({
  href,
  external,
  className,
  children,
  ...props
}: AppLinkProps) {
  const isExternal =
    external ?? (href.startsWith("http") || href.startsWith("mailto:"));

  const baseStyles =
    "text-primary font-medium underline-offset-4 hover:underline transition-colors";

  if (isExternal) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(baseStyles, className)}
        {...(props as React.AnchorHTMLAttributes<HTMLAnchorElement>)}
      >
        {children}
      </a>
    );
  }

  return (
    <RouterLink to={href} className={cn(baseStyles, className)} {...props}>
      {children}
    </RouterLink>
  );
}
