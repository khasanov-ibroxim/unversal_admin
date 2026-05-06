import { apiFetch } from "./client";

// ─── Types ────────────────────────────────────────────────────────────────────
export interface DashboardStats {
    total_orders: number;
    total_revenue: number;
    pending_orders: number;
    low_stock_items: number;
    today_orders: number;
    today_revenue: number;
}

export interface RevenueData {
    date: string;
    revenue: number;
    orders: number;
}

export interface RevenueResponse {
    period: string;
    data: RevenueData[];
}

export interface TopProduct {
    product_id: number;
    product_name: string;
    total_sold: number;
    total_revenue: number;
}

// ─── Dashboard API ────────────────────────────────────────────────────────────
export const dashboardApi = {
    getStats: () =>
        apiFetch<DashboardStats>("/dashboard/stats"),

    getRevenue: (params?: { period?: "week" | "month" | "year" }) =>
        apiFetch<RevenueResponse>("/dashboard/revenue", { params: params as Record<string, unknown> }),

    getTopProducts: (params?: { limit?: number }) =>
        apiFetch<TopProduct[]>("/dashboard/top-products", { params: params as Record<string, unknown> }),
};
