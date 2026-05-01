import { apiFetch, toFormData, BASE_URL } from "./client";

// ─── Types ────────────────────────────────────────────────────────────────────
export interface AdminUser {
    id: number;
    username: string;
    status: "admin" | "operator";
    is_active: boolean;
    [key: string]: unknown;
}

export interface AuditLog {
    id: number;
    entity: string;
    action: string;
    created_at: string;
    [key: string]: unknown;
}

export interface BootstrapData {
    ok: boolean;
    banners: unknown[];
    categories: unknown[];
    collections: unknown[];
    colors: unknown[];
    sizes: unknown[];
    products: unknown[];
    product_items: unknown[];
    product_photos: unknown[];
    product_details: unknown[];
}

// ─── Panel API ────────────────────────────────────────────────────────────────
export const panelApi = {
    createOperator: (data: {
        username: string;
        operator_code: string;
        status?: "admin" | "operator";
        is_active?: boolean;
    }) => {
        const fd = toFormData(data as Record<string, unknown>);
        return apiFetch<{ ok: boolean; user_id: number; username: string; status: string }>("/panel/operators", {
            method: "POST",
            body: fd,
        });
    },

    getUsers: () =>
        apiFetch<AdminUser[]>("/panel/users"),

    getMe: () =>
        apiFetch<AdminUser>("/panel/me"),

    updateUser: (userId: number, data: { username?: string; operator_code?: string; is_active?: boolean }) => {
        const fd = toFormData(data as Record<string, unknown>);
        return apiFetch<{ ok: boolean }>(`/panel/users/${userId}`, { method: "PATCH", body: fd });
    },
};

// ─── History API ──────────────────────────────────────────────────────────────
export const historyApi = {
    getOrders: (params: { date_from?: string; date_to?: string; limit?: number }) =>
        apiFetch<{ ok: boolean; data: unknown[]; meta: { count: number } }>("/history/orders", { params }),

    getProducts: (params: { date_from?: string; date_to?: string; action?: string; limit?: number }) =>
        apiFetch<{ ok: boolean; data: AuditLog[]; meta: { count: number } }>("/history/products", { params }),

    getLogs: (params: { entity?: string; date_from?: string; date_to?: string; limit?: number }) =>
        apiFetch<{ ok: boolean; data: AuditLog[]; meta: { count: number } }>("/history/logs", { params }),

    getSalesStats: (params: { date_from?: string; date_to?: string }) =>
        apiFetch<{ ok: boolean; data: unknown }>("/history/stats/sales", { params }),

    getDashboardStats: (params?: { low_stock_threshold?: number; low_stock_limit?: number; top_limit?: number }) =>
        apiFetch<{ ok: boolean; data: unknown }>("/history/stats/dashboard", { params }),
};

// ─── Excel API ────────────────────────────────────────────────────────────────
export const excelApi = {
    downloadTemplate: async () => {
        // BUG FIX: localStorage dagi credentials o'rniga apiFetch ichidagi
        // getAuthHeader() dan foydalanish uchun to'g'ri credentials o'qiymiz
        const raw = localStorage.getItem("admin_credentials");
        let authHeader = "";
        if (raw) {
            try {
                const creds = JSON.parse(raw);
                authHeader = `Basic ${btoa(`${creds.username}:${creds.password}`)}`;
            } catch {
                // ignore
            }
        }

        const headers: Record<string, string> = {};
        if (authHeader) {
            headers.Authorization = authHeader;
        }

        const resp = await fetch(`${BASE_URL}/excel/products/template`, { headers });
        if (!resp.ok) throw new Error("Template yuklab bo'lmadi");
        const blob = await resp.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "products_import_template.xlsx";
        a.click();
        URL.revokeObjectURL(url);
    },

    importProducts: (file: File) => {
        const fd = new FormData();
        fd.append("excel_file", file);
        return apiFetch<{
            ok: boolean;
            data: { created: number; updated: number; errors: { row: number; error: string }[] };
            meta: { errors_count: number };
            error: null;
        }>("/excel/products/import", { method: "POST", body: fd });
    },
};

// ─── System API ───────────────────────────────────────────────────────────────
export const systemApi = {
    health: () =>
        apiFetch<{ ok: boolean; service: string }>("/system/health"),

    ready: () =>
        apiFetch<{ ok: boolean; database: string }>("/system/ready"),

    authMode: () =>
        apiFetch<{ auth: string; jwt_enabled: boolean }>("/system/auth-mode"),
};

// ─── Frontend Bootstrap API ───────────────────────────────────────────────────
export const frontendApi = {
    bootstrap: (includeInactive = false) =>
        apiFetch<BootstrapData>("/frontend/bootstrap", {
            params: { include_inactive: includeInactive },
        }),
};