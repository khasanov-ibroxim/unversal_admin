// ─── API Base Client ──────────────────────────────────────────────────────────
// Base URL - o'zgartiring agar backend boshqa portda ishlaса
export const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

// ─── Auth credentials storage ─────────────────────────────────────────────────
let _credentials: { username: string; password: string } | null = null;

export function setCredentials(username: string, password: string) {
    _credentials = { username, password };
}

export function clearCredentials() {
    _credentials = null;
}

function getAuthHeader(): Record<string, string> {
    if (!_credentials) return {};
    const encoded = btoa(`SunnatDevPy:1111`);
    return { Authorization: `Basic ${encoded}` };
}

// ─── Generic request helper ───────────────────────────────────────────────────
export async function apiFetch<T = unknown>(
    path: string,
    options: RequestInit & { params?: Record<string, string | number | boolean | undefined | null> } = {}
): Promise<T> {
    const { params, ...fetchOptions } = options;

    // Build URL with query params
    let url = `${BASE_URL}${path}`;
    if (params) {
        const query = Object.entries(params)
            .filter(([, v]) => v !== undefined && v !== null && v !== "")
            .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
            .join("&");
        if (query) url += `?${query}`;
    }

    const headers: Record<string, string> = {
        ...getAuthHeader(),
        ...(fetchOptions.headers as Record<string, string> || {}),
    };

    // Don't set Content-Type for FormData (browser sets it with boundary)
    if (!(fetchOptions.body instanceof FormData)) {
        if (!headers["Content-Type"] && fetchOptions.body) {
            headers["Content-Type"] = "application/json";
        }
    }

    const response = await fetch(url, { ...fetchOptions, headers });

    if (!response.ok) {
        let errorMessage = `HTTP ${response.status}`;
        try {
            const errData = await response.json();
            errorMessage = errData?.detail || errData?.error || errorMessage;
        } catch {
            // ignore parse error
        }
        throw new ApiError(response.status, errorMessage);
    }

    // Some endpoints return empty body (204)
    const text = await response.text();
    if (!text) return {} as T;

    return JSON.parse(text) as T;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
export function toFormData(obj: Record<string, unknown>): FormData {
    const fd = new FormData();
    for (const [k, v] of Object.entries(obj)) {
        if (v === undefined || v === null) continue;
        if (v instanceof File) {
            fd.append(k, v);
        } else if (typeof v === "boolean") {
            fd.append(k, v ? "true" : "false");
        } else {
            fd.append(k, String(v));
        }
    }
    return fd;
}

// ─── Error class ──────────────────────────────────────────────────────────────
export class ApiError extends Error {
    constructor(
        public status: number,
        message: string
    ) {
        super(message);
        this.name = "ApiError";
    }
}
