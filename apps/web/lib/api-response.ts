import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { ForbiddenError } from "./rbac";

export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export function successResponse<T>(data: T, status = 200): NextResponse {
  return NextResponse.json(data, { status });
}

export function errorResponse(code: string, message: string, status: number, details?: unknown): NextResponse<ApiError> {
  return NextResponse.json(
    { error: { code, message, details } },
    { status },
  );
}

export function handleApiError(error: unknown): NextResponse<ApiError> {
  if (error instanceof ZodError) {
    return errorResponse("VALIDATION_ERROR", "Invalid request data", 400, error.errors);
  }

  if (error instanceof ForbiddenError) {
    return errorResponse("FORBIDDEN", error.message, 403);
  }

  console.error("Unhandled API error:", error);
  return errorResponse("INTERNAL_ERROR", "An unexpected error occurred", 500);
}
