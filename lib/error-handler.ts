import { PostgrestError, SupabaseClient, User } from "@supabase/supabase-js";
import { ActionResponse, createErrorResponse, ERROR_CODES } from "./types/api";
import { createClient } from "@/lib/supabase/server";

/**
 * Enhanced error handling utility for server actions
 */

export class ActionError extends Error {
  constructor(
    public code: keyof typeof ERROR_CODES,
    message?: string,
    public details?: unknown
  ) {
    super(message);
    this.name = "ActionError";
  }
}

/**
 * Handle Supabase Postgres errors and convert to standardized format
 */
export function handleDatabaseError(error: PostgrestError) {
  console.error("Database error:", error);

  // Map common Postgres error codes
  switch (error.code) {
    case "23505": // unique_violation
      return createErrorResponse(
        "RESOURCE_ALREADY_EXISTS",
        "이미 존재하는 데이터입니다."
      );

    case "23503": // foreign_key_violation
      return createErrorResponse(
        "VALIDATION_ERROR",
        "연관된 데이터가 존재하지 않습니다."
      );

    case "23502": // not_null_violation
      return createErrorResponse(
        "REQUIRED_FIELD_MISSING",
        "필수 필드가 누락되었습니다."
      );

    case "42501": // insufficient_privilege
      return createErrorResponse("INSUFFICIENT_PERMISSIONS");

    case "PGRST116": // Row not found
      return createErrorResponse("RESOURCE_NOT_FOUND");

    default:
      return createErrorResponse("DATABASE_ERROR", error.message, {
        code: error.code,
        details: error.details,
      });
  }
}

/**
 * Handle authentication errors
 */
export function handleAuthError(message?: string) {
  return createErrorResponse("UNAUTHORIZED", message);
}

/**
 * Handle permission errors
 */
export function handlePermissionError(message?: string) {
  return createErrorResponse("INSUFFICIENT_PERMISSIONS", message);
}

/**
 * Handle file upload errors
 */
export function handleUploadError(error: Error) {
  console.error("Upload error:", error);

  if (error.message.includes("size")) {
    return createErrorResponse("FILE_TOO_LARGE");
  }

  if (error.message.includes("type")) {
    return createErrorResponse("INVALID_FILE_TYPE");
  }

  return createErrorResponse("UPLOAD_FAILED", error.message);
}

/**
 * Generic error handler - converts any error to standardized format
 */
export function handleGenericError(error: unknown) {
  console.error("Generic error:", error);

  if (error instanceof ActionError) {
    return createErrorResponse(error.code, error.message, error.details);
  }

  if (error instanceof Error) {
    return createErrorResponse("INTERNAL_ERROR", error.message, {
      stack: error.stack,
    });
  }

  return createErrorResponse("UNKNOWN_ERROR", String(error));
}

/**
 * Validation helper
 */
export function validateRequired<T>(
  value: T | null | undefined,
  fieldName: string
): T {
  if (value === null || value === undefined || value === "") {
    throw new ActionError(
      "REQUIRED_FIELD_MISSING",
      `${fieldName}이(가) 필요합니다.`
    );
  }
  return value;
}

/**
 * Permission check helper
 */
export function requireAuth(userId: string | null | undefined): string {
  if (!userId) {
    throw new ActionError("UNAUTHORIZED", "로그인이 필요합니다.");
  }
  return userId;
}

/**
 * Try-catch wrapper for server actions
 */
export async function withErrorHandling<T>(
  action: () => Promise<T>
): Promise<T> {
  try {
    return await action();
  } catch (error) {
    // Check for Next.js redirect error
    if (
      error instanceof Error &&
      "digest" in error &&
      typeof error.digest === "string" &&
      error.digest.startsWith("NEXT_REDIRECT")
    ) {
      throw error; // Re-throw the original redirect error
    }

    if (error instanceof ActionError) {
      throw error;
    }

    // Convert unknown errors to ActionError
    const handledError = handleGenericError(error);
    if (!handledError.success) {
      throw new ActionError(
        handledError.error.code as keyof typeof ERROR_CODES,
        handledError.error.message,
        handledError.error.details
      );
    }

    // This should never be reached

    throw new ActionError("UNKNOWN_ERROR", "Unexpected error state");
  }
}

/**
 * Detect Next.js redirect (NEXT_REDIRECT) — must be re-thrown, not swallowed
 */
function isNextRedirect(e: unknown): boolean {
  return (
    e instanceof Error &&
    "digest" in e &&
    typeof (e as any).digest === "string" &&
    (e as any).digest.startsWith("NEXT_REDIRECT")
  );
}

/**
 * Detect Supabase/PostgREST errors by duck-typing their shape
 */
export function isPostgrestError(e: unknown): e is PostgrestError {
  return (
    typeof e === "object" &&
    e !== null &&
    "code" in e &&
    "message" in e &&
    "details" in e &&
    "hint" in e
  );
}

type AuthenticatedAction<T extends unknown[], R> = (
  context: { supabase: SupabaseClient; user: User },
  ...args: T
) => Promise<ActionResponse<R>>;

/**
 * HOC for Server Actions that require authentication.
 * - Returns ActionResponse<R> on both success and failure (never throws, except redirect).
 * - PostgrestError → handleDatabaseError (Korean-mapped, no raw DB message leak).
 * - Unknown Error → generic message ("내부 서버 오류") masks raw stack/message.
 */
export function withAuth<T extends unknown[], R>(
  action: AuthenticatedAction<T, R>
) {
  return async (...args: T): Promise<ActionResponse<R>> => {
    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return createErrorResponse("UNAUTHORIZED", "로그인이 필요합니다.");

      return await action({ supabase, user }, ...args);
    } catch (e) {
      if (isNextRedirect(e)) throw e;
      if (e instanceof ActionError)
        return createErrorResponse(e.code, e.message, e.details);
      if (isPostgrestError(e))
        return handleDatabaseError(e);
      if (e instanceof Error)
        return createErrorResponse("INTERNAL_ERROR", "내부 서버 오류가 발생했습니다.");
      return createErrorResponse("UNKNOWN_ERROR");
    }
  };
}

// A specific HOC for Server Actions used with `useActionState`

export function withAuthForm<T extends unknown[]>(
  action: (
    context: { supabase: SupabaseClient; user: User },

    ...args: T
  ) => Promise<{ id?: string; error?: string }>
) {
  return async (
    prevState: { id?: string; error?: string },

    ...args: T
  ): Promise<{ id?: string; error?: string }> => {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    try {
      requireAuth(user?.id);

      return await action({ supabase, user: user! }, ...args);
    } catch (e) {
      const error = e as Error;

      if (
        "digest" in error &&
        typeof error.digest === "string" &&
        error.digest.startsWith("NEXT_REDIRECT")
      ) {
        throw error;
      }

      return { error: error.message };
    }
  };
}
