"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  className?: string;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className={cn(
          "flex flex-col items-center justify-center py-8 px-4 text-center",
          this.props.className
        )}>
          <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
          <h2 className="text-lg font-semibold mb-2">문제가 발생했습니다</h2>
          <p className="text-muted-foreground mb-4 max-w-md">
            예상치 못한 오류가 발생했습니다. 페이지를 새로고침하거나 잠시 후 다시 시도해 주세요.
          </p>
          {this.state.error && (
            <details className="mb-4 text-sm text-left max-w-md w-full">
              <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                오류 상세 정보
              </summary>
              <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto">
                {this.state.error.toString()}
              </pre>
            </details>
          )}
          <Button onClick={this.handleRetry} variant="outline" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            다시 시도
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook-based error boundary for functional components
export function ErrorFallback({ 
  error, 
  resetErrorBoundary,
  className 
}: { 
  error: Error; 
  resetErrorBoundary: () => void;
  className?: string;
}) {
  return (
    <div className={cn(
      "flex flex-col items-center justify-center py-8 px-4 text-center",
      className
    )}>
      <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
      <h2 className="text-lg font-semibold mb-2">문제가 발생했습니다</h2>
      <p className="text-muted-foreground mb-4 max-w-md">
        예상치 못한 오류가 발생했습니다. 페이지를 새로고침하거나 잠시 후 다시 시도해 주세요.
      </p>
      <details className="mb-4 text-sm text-left max-w-md w-full">
        <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
          오류 상세 정보
        </summary>
        <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto">
          {error.toString()}
        </pre>
      </details>
      <Button onClick={resetErrorBoundary} variant="outline" className="gap-2">
        <RefreshCw className="h-4 w-4" />
        다시 시도
      </Button>
    </div>
  );
}

// Simple inline error display
interface InlineErrorProps {
  error: string | Error;
  className?: string;
  retry?: () => void;
}

export function InlineError({ error, className, retry }: InlineErrorProps) {
  const errorMessage = typeof error === 'string' ? error : error.message;

  return (
    <div className={cn(
      "flex items-center justify-center py-4 px-4 bg-red-50 dark:bg-red-950/10 border border-red-200 dark:border-red-800 rounded-lg",
      className
    )}>
      <div className="flex items-center gap-3">
        <AlertCircle className="h-5 w-5 text-red-500" />
        <div className="flex-1">
          <p className="text-sm text-red-800 dark:text-red-200">{errorMessage}</p>
        </div>
        {retry && (
          <Button onClick={retry} variant="ghost" size="sm" className="gap-1">
            <RefreshCw className="h-3 w-3" />
            다시 시도
          </Button>
        )}
      </div>
    </div>
  );
}