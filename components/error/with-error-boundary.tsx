"use client";

import React from "react";
import { ErrorBoundary } from "./error-boundary";

interface WithErrorBoundaryOptions {
  fallback?: React.ReactNode;
  className?: string;
}

export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  options: WithErrorBoundaryOptions = {}
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary fallback={options.fallback} className={options.className}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}