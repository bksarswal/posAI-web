import type { paths } from './api.d';

export type { paths };

/**
 * Standard backend error response shape.
 */
export interface ApiErrorResponse {
  success: false;
  message: string;
  code: string;
  errors?: unknown;
}

/**
 * Standard backend success response envelope.
 */
export interface ApiSuccessResponse<T = unknown> {
  success: true;
  message: string;
  data: T;
}

/**
 * Extracts the 200/201 JSON response for a given OpenAPI path and HTTP method.
 */
export type ApiResponse<
  Path extends keyof paths,
  Method extends keyof paths[Path],
> = paths[Path][Method] extends {
  responses: {
    200: { content: { 'application/json': infer Res } };
  };
}
  ? Res
  : paths[Path][Method] extends {
        responses: {
          201: { content: { 'application/json': infer Res } };
        };
      }
    ? Res
    : never;

/**
 * Extracts the inner 'data' payload from a path and method response.
 * Backends wrap successes as { success: true, message: string, data: T }.
 */
export type ApiData<Path extends keyof paths, Method extends keyof paths[Path]> =
  ApiResponse<Path, Method> extends { data: infer Data } ? Data : ApiResponse<Path, Method>;
