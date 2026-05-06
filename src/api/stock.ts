import { apiFetch, toFormData } from "./client";

// ─── Types ────────────────────────────────────────────────────────────────────
export type MovementType = "in" | "out" | "adjustment";

export interface StockMovement {
    id: number;
    product_item_id: number;
    movement_type: MovementType;
    quantity: number;
    reason: string;
    created_at: string;
}

export interface CreateStockMovementData {
    product_item_id: number;
    movement_type: MovementType;
    quantity: number;
    reason: string;
}

export interface Alert {
    id: number;
    type: string;
    message: string;
    is_read: boolean;
    created_at: string;
}

// ─── Stock Movements API ──────────────────────────────────────────────────────
export const stockMovementsApi = {
    getAll: (params?: { product_item_id?: number; movement_type?: MovementType; limit?: number }) =>
        apiFetch<StockMovement[]>("/stock-movements", { params: params as Record<string, unknown> }),

    create: (data: CreateStockMovementData) =>
        apiFetch<{ ok: boolean }>(
            "/stock-movements",
            {
                method: "POST",
                body: JSON.stringify(data),
                headers: { "Content-Type": "application/json" },
            }
        ),
};

// ─── Alerts API ───────────────────────────────────────────────────────────────
export const alertsApi = {
    getAll: () =>
        apiFetch<Alert[]>("/alerts"),

    markAsRead: (alertId: number) =>
        apiFetch<{ ok: boolean }>(`/alerts/${alertId}/read`, { method: "PATCH" }),
};
