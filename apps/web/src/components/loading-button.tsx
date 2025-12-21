"use client";

import type { ButtonHTMLAttributes } from "react";

type LoadingButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  loading?: boolean;
  loadingText?: string;
};

export default function LoadingButton({
  loading = false,
  loadingText = "加载中...",
  className,
  disabled,
  children,
  ...props
}: LoadingButtonProps) {
  const mergedClassName = [
    "loading-button",
    className,
    loading ? "is-loading" : ""
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      {...props}
      className={mergedClassName}
      disabled={disabled || loading}
    >
      {loading ? (
        <>
          <span className="loading-spinner" />
          <span>{loadingText}</span>
        </>
      ) : (
        children
      )}
    </button>
  );
}
