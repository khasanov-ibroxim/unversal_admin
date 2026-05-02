import { apiFetch } from "./client";

export type ApiOrderStatus =
    | "yangi"
    | "to'landi"
    | "jarayonda"
    | "tayyor"
    | "yetkazilmoqda"
    | "yetkazildi"
    | "bekor qilindi";

export interface ApiOrderItem {
    product_id: number;
    product_item_id: number;
    count: number;
}

export interface ApiOrder {
    id: number;
    first_name: string;
    last_name: string;
    country: string;
    address: string;
    town_city: string;
    contact: string;
    postcode_zip: number;
    payment: string;
    status: ApiOrderStatus;
    email_address?: string;
    state_county?: string;
    created_at?: string;
    order_items?: ApiOrderItem[];
    [key: string]: unknown;
}

export interface CreateOrderData {
    first_name: string;
    last_name: string;
    country: string;
    address: string;
    town_city: string;
    contact: string;
    postcode_zip: number;
    payment: string;
    items: ApiOrderItem[];
    email_address?: string;
    state_county?: string;
}

export interface OrderSearchParams {
    order_id?: number;
    status_q?: string;
    payment?: string;
    contact?: string;
    first_name?: string;
    date_from?: string;
    date_to?: string;
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
    getAll: () =>
        withRetry(() =>
            apiFetch<{ ok: boolean; data: ApiOrder[]; meta: unknown; error: null }>("/order")
        ),

    search: (params: OrderSearchParams) =>
        withRetry(() =>
            apiFetch<{ ok: boolean; data: ApiOrder[]; meta: { count: number }; error: null }>(
                "/order/search",
                { params: params as Record<string, unknown> }
            )
        ),

    getById: (id: number) =>
        withRetry(() =>
            apiFetch<{ ok: boolean; data: ApiOrder; meta: unknown; error: null }>(`/order/${id}`)
        ),

    create: (data: CreateOrderData) =>
        apiFetch<{ ok: boolean; data: { order_id: number; status: string; order_items: ApiOrderItem[] }; meta: unknown; error: null }>(
            "/order",
            {
                method: "POST",
                body: JSON.stringify(data),
                headers: { "Content-Type": "application/json" },
            }
        ),

    confirmPayment: (orderId: number, nextStatus?: ApiOrderStatus) =>
        withRetry(() =>
            apiFetch<{ ok: boolean; already_paid?: boolean; order_id: number; status: string }>(
                `/order/${orderId}/confirm-payment`,
                {
                    method: "POST",
                    body: JSON.stringify(nextStatus ? { next_status: nextStatus } : {}),
                    headers: { "Content-Type": "application/json" },
                }
            )
        ),

    updateStatus: (orderId: number, newStatus: ApiOrderStatus) => {
        const fd = new FormData();
        fd.append("new_status", newStatus);
        return withRetry(() =>
            apiFetch<{ ok: boolean; data: { order_id: number; status: string } }>(
                `/order/${orderId}/status`,
                { method: "PATCH", body: fd }
            )
        );
    },
};