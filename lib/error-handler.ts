import { PostgrestError, SupabaseClient, User } from "@supabase/supabase-js";
import { createErrorResponse, ERROR_CODES } from "./types/api";
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
    if (process.env.NODE_ENV === "development") {
      console.warn("Dev Mode: Defaulting to test user ID");
      return "testuser"; // Mock Test User ID for development
    }
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

type AuthenticatedAction<T extends unknown[], R> = (
  context: { supabase: SupabaseClient; user: User },

  ...args: T
) => Promise<R>;

export function withAuth<T extends unknown[], R>(
  action: AuthenticatedAction<T, R>
) {
  return async (...args: T): Promise<R> => {
    return withErrorHandling(async () => {
      const supabase = await createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      let currentUser = user;
      if (!currentUser && process.env.NODE_ENV === "development") {
        console.warn("Dev Mode: Injecting mock test user");
        currentUser = {
          id: "testuser",
          email: "test@example.com",
          user_metadata: {
            username: "testuser",
            full_name: "Test User",
          },
          app_metadata: {},
          aud: "authenticated",
          created_at: new Date().toISOString(),
        } as User;
      }

      requireAuth(currentUser?.id);

      return action({ supabase, user: currentUser! }, ...args);
    });
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
