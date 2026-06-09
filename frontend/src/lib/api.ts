export type ApiEnvelope<T = unknown> = {
  success: boolean;
  message: string;
  data: T | null;
  errors?: unknown;
};

export type ApiMode = "user" | "admin" | "public";

export const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? "";

export const userTokenKey = "wsiw_token";
export const adminTokenKey = "wsiw_admin_token";

export function getStoredToken(mode: ApiMode = "user") {
  if (typeof window === "undefined" || mode === "public") {
    return "";
  }

  return window.localStorage.getItem(mode === "admin" ? adminTokenKey : userTokenKey) ?? "";
}

export function setStoredToken(mode: Exclude<ApiMode, "public">, token: string) {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(mode === "admin" ? adminTokenKey : userTokenKey, token);
  }
}

export function clearStoredToken(mode: Exclude<ApiMode, "public">) {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(mode === "admin" ? adminTokenKey : userTokenKey);
  }
}

export class ApiError extends Error {
  status: number;
  errors?: unknown;

  constructor(message: string, status: number, errors?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.errors = errors;
  }
}

type ApiRequestOptions = Omit<RequestInit, "mode"> & {
  mode?: ApiMode;
  token?: string;
};

export async function apiRequest<T = unknown>(
  path: string,
  options: ApiRequestOptions = {},
) {
  const baseUrl = apiBaseUrl.replace(/\/$/, "");

  if (!baseUrl) {
    throw new ApiError("NEXT_PUBLIC_API_URL is not configured", 0);
  }

  const { mode = "user", token, headers, body, ...requestOptions } = options;
  const requestHeaders = new Headers(headers);
  const authToken = token ?? getStoredToken(mode);

  if (authToken) {
    requestHeaders.set("Authorization", `Bearer ${authToken}`);
  }

  if (body && !(body instanceof FormData) && !requestHeaders.has("Content-Type")) {
    requestHeaders.set("Content-Type", "application/json");
  }

  const response = await fetch(`${baseUrl}${path}`, {
    ...requestOptions,
    body,
    headers: requestHeaders,
  });

  const contentType = response.headers.get("content-type") ?? "";
  const payload = contentType.includes("application/json")
    ? ((await response.json()) as ApiEnvelope<T>)
    : ({ success: response.ok, message: await response.text(), data: null } as ApiEnvelope<T>);

  if (!response.ok || !payload.success) {
    throw new ApiError(payload.message || "Request failed", response.status, payload.errors);
  }

  return payload;
}

export function toJsonBody(values: Record<string, unknown>) {
  return JSON.stringify(
    Object.fromEntries(
      Object.entries(values).filter(([, value]) => value !== "" && value !== null && value !== undefined),
    ),
  );
}
