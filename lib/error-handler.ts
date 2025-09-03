import { PostgrestError } from "@supabase/supabase-js";
import { createErrorResponse, ERROR_CODES } from "./types/api";

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
    this.name = 'ActionError';
  }
}

/**
 * Handle Supabase Postgres errors and convert to standardized format
 */
export function handleDatabaseError(error: PostgrestError) {
  console.error('Database error:', error);

  // Map common Postgres error codes
  switch (error.code) {
    case '23505': // unique_violation
      return createErrorResponse('RESOURCE_ALREADY_EXISTS', '이미 존재하는 데이터입니다.');
    
    case '23503': // foreign_key_violation
      return createErrorResponse('VALIDATION_ERROR', '연관된 데이터가 존재하지 않습니다.');
    
    case '23502': // not_null_violation
      return createErrorResponse('REQUIRED_FIELD_MISSING', '필수 필드가 누락되었습니다.');
    
    case '42501': // insufficient_privilege
      return createErrorResponse('INSUFFICIENT_PERMISSIONS');
    
    case 'PGRST116': // Row not found
      return createErrorResponse('RESOURCE_NOT_FOUND');
    
    default:
      return createErrorResponse('DATABASE_ERROR', error.message, { 
        code: error.code,
        details: error.details 
      });
  }
}

/**
 * Handle authentication errors
 */
export function handleAuthError(message?: string) {
  return createErrorResponse('UNAUTHORIZED', message);
}

/**
 * Handle permission errors
 */
export function handlePermissionError(message?: string) {
  return createErrorResponse('INSUFFICIENT_PERMISSIONS', message);
}

/**
 * Handle file upload errors
 */
export function handleUploadError(error: Error) {
  console.error('Upload error:', error);
  
  if (error.message.includes('size')) {
    return createErrorResponse('FILE_TOO_LARGE');
  }
  
  if (error.message.includes('type')) {
    return createErrorResponse('INVALID_FILE_TYPE');
  }
  
  return createErrorResponse('UPLOAD_FAILED', error.message);
}

/**
 * Generic error handler - converts any error to standardized format
 */
export function handleGenericError(error: unknown) {
  console.error('Generic error:', error);
  
  if (error instanceof ActionError) {
    return createErrorResponse(error.code, error.message, error.details);
  }
  
  if (error instanceof Error) {
    return createErrorResponse('INTERNAL_ERROR', error.message, { 
      stack: error.stack 
    });
  }
  
  return createErrorResponse('UNKNOWN_ERROR', String(error));
}

/**
 * Validation helper
 */
export function validateRequired<T>(
  value: T | null | undefined, 
  fieldName: string
): T {
  if (value === null || value === undefined || value === '') {
    throw new ActionError(
      'REQUIRED_FIELD_MISSING', 
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
    throw new ActionError('UNAUTHORIZED');
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
    if (error instanceof ActionError) {
      throw error;
    }
    
    // Convert unknown errors to ActionError
    const handledError = handleGenericError(error);
    throw new ActionError(
      handledError.error.code as keyof typeof ERROR_CODES,
      handledError.error.message,
      handledError.error.details
    );
  }
}