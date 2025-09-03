/**
 * Standard API response types for server actions
 */

// Base response type
export type ActionResponse<T = void> = {
  success: true;
  data: T;
} | {
  success: false;
  error: {
    message: string;
    code?: string;
    details?: unknown;
  };
};

// Specific response types for common actions
export type CreateResponse = ActionResponse<{ id: string }>;
export type UpdateResponse = ActionResponse<void>;
export type DeleteResponse = ActionResponse<void>;

// Error codes for consistent error handling
export const ERROR_CODES = {
  // Authentication errors
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  
  // Validation errors
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  REQUIRED_FIELD_MISSING: 'REQUIRED_FIELD_MISSING',
  
  // Resource errors
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
  RESOURCE_ALREADY_EXISTS: 'RESOURCE_ALREADY_EXISTS',
  
  // Permission errors
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',
  NOT_MEMBER: 'NOT_MEMBER',
  
  // Database errors
  DATABASE_ERROR: 'DATABASE_ERROR',
  
  // File upload errors
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  INVALID_FILE_TYPE: 'INVALID_FILE_TYPE',
  UPLOAD_FAILED: 'UPLOAD_FAILED',
  
  // Generic errors
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
} as const;

// Error messages in Korean
export const ERROR_MESSAGES = {
  [ERROR_CODES.UNAUTHORIZED]: '로그인이 필요합니다.',
  [ERROR_CODES.FORBIDDEN]: '접근이 금지되었습니다.',
  [ERROR_CODES.VALIDATION_ERROR]: '입력 값이 올바르지 않습니다.',
  [ERROR_CODES.REQUIRED_FIELD_MISSING]: '필수 항목이 누락되었습니다.',
  [ERROR_CODES.RESOURCE_NOT_FOUND]: '요청한 리소스를 찾을 수 없습니다.',
  [ERROR_CODES.RESOURCE_ALREADY_EXISTS]: '이미 존재하는 리소스입니다.',
  [ERROR_CODES.INSUFFICIENT_PERMISSIONS]: '권한이 부족합니다.',
  [ERROR_CODES.NOT_MEMBER]: '멤버가 아닙니다.',
  [ERROR_CODES.DATABASE_ERROR]: '데이터베이스 오류가 발생했습니다.',
  [ERROR_CODES.FILE_TOO_LARGE]: '파일 크기가 너무 큽니다.',
  [ERROR_CODES.INVALID_FILE_TYPE]: '허용되지 않는 파일 형식입니다.',
  [ERROR_CODES.UPLOAD_FAILED]: '파일 업로드에 실패했습니다.',
  [ERROR_CODES.INTERNAL_ERROR]: '내부 서버 오류가 발생했습니다.',
  [ERROR_CODES.UNKNOWN_ERROR]: '알 수 없는 오류가 발생했습니다.',
} as const;

// Helper functions for creating standardized responses
export function createSuccessResponse<T>(data: T): ActionResponse<T> {
  return {
    success: true,
    data,
  };
}

export function createErrorResponse(
  code: keyof typeof ERROR_CODES,
  customMessage?: string,
  details?: unknown
): ActionResponse<never> {
  return {
    success: false,
    error: {
      message: customMessage || ERROR_MESSAGES[code],
      code,
      details,
    },
  };
}

// Legacy support for existing return types
export type LegacyActionResponse<T = void> = (T extends void 
  ? { error?: string } 
  : { error?: string } & T
);

// Helper to convert legacy responses to new format
export function fromLegacyResponse<T>(
  response: LegacyActionResponse<T>
): ActionResponse<T> {
  if (response.error) {
    return createErrorResponse('UNKNOWN_ERROR', response.error);
  }
  
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { error, ...data } = response;
  return createSuccessResponse(data as T);
}