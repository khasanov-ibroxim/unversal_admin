import { apiFetch } from "./client";

export type ApiOrderStatus =
    | "new"
    | "paid"
    | "is_process"
    | "ready"
    | "in_progress"
    | "delivered"
    | "cancelled"
    | "vozvrat";

export interface ApiOrderItem {
    id?: number;
    product_id: number;
    product_item_id: number;
    count: number;
    price?: number;
}

export interface ApiOrder {
    id: number;
    first_name: string;
    last_name: string;
    phone_number: string;
    address: string;
    status: ApiOrderStatus;
    payment: string;
    total_price?: number;
    created_at?: string;
    items?: ApiOrderItem[];
    [key: string]: unknown;
}

export interface CreateOrderData {
    first_name: string;
    last_name: string;
    phone_number: string;
    address: string;
    payment: string;
    items: ApiOrderItem[];
}

export interface OrderSearchParams {
    status?: string;
    payment?: string;
    search?: string;
    sort_by?: string;
    sort_dir?: string;
    limit?: number;
}

async function withRetry<T>(
    fn: () => Promise<T>,
    retries = 3,
    delayMs = 800
): Promise<T> {
    let lastError: unknown;
    for (let attempt = 0; attempt < retries; attempt++) {
        try {
            return await fn();
        } catch (err) {
            lastError = err;
            const status = (err as { status?: number })?.status;
            if (status && status >= 400 && status < 500) throw err;
            if (attempt < retries - 1) {
                await new Promise(res => setTimeout(res, delayMs * (attempt + 1)));
            }
        }
    }
    throw lastError;
}

export const ordersApi = {
    getAll: (params?: OrderSearchParams) =>
        withRetry(() =>
            apiFetch<ApiOrder[]>("/order", { params: params as Record<string, unknown> })
        ),

    getById: (id: number) =>
        withRetry(() =>
            apiFetch<ApiOrder>(`/order/${id}`)
        ),

    create: (data: CreateOrderData) =>
        apiFetch<{ ok: boolean; data: { id: number; status: string; total_price: number } }>(
            "/order",
            {
                method: "POST",
                body: JSON.stringify(data),
                headers: { "Content-Type": "application/json" },
            }
        ),

    updateStatus: (orderId: number, status: ApiOrderStatus) => {
        const fd = new FormData();
        fd.append("status", status);
        return withRetry(() =>
            apiFetch<{ ok: boolean }>(
                `/order/${orderId}/status`,
                { method: "PATCH", body: fd }
            )
        );
    },

    delete: (orderId: number) =>
        withRetry(() =>
            apiFetch<{ ok: boolean }>(`/order/${orderId}`, { method: "DELETE" })
        ),

    exportCSV: (params?: { status?: string; payment?: string }) =>
        withRetry(() =>
            apiFetch<Blob>("/order/export/csv", {
                params: params as Record<string, unknown>,
            })
        ),
};