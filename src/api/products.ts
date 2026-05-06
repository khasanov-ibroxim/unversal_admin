import { apiFetch, toFormData } from "./client";

// ─── Types ────────────────────────────────────────────────────────────────────
export type ClothingType = "erkak" | "ayol" | "unisex";

export interface ApiProduct {
    id: number;
    category_id: number;
    collection_id: number;
    name_uz: string;
    name_ru: string;
    name_eng: string;
    description_uz: string;
    description_ru: string;
    description_eng: string;
    price: number;
    is_active: boolean;
    clothing_type: ClothingType;
    created_at?: string;
    category?: {
        id: number;
        name_uz: string;
        name_ru: string;
        name_eng: string;
    };
    photos?: {
        id: number;
        photo_url: string;
    }[];
    items?: {
        id: number;
        color_id: number;
        size_id: number;
        total_count: number;
        min_stock_level?: number;
    }[];
    [key: string]: unknown;
}

export interface ApiProductPhoto {
    id: number;
    product_id: number;
    photo_url: string;
    [key: string]: unknown;
}

export interface ApiProductItem {
    id: number;
    product_id: number;
    color_id: number;
    size_id: number;
    total_count: number;
    min_stock_level?: number;
    color?: {
        id: number;
        name_uz: string;
        name_ru: string;
        name_eng: string;
        color_code: string;
    };
    size?: {
        id: number;
        name: string;
    };
    [key: string]: unknown;
}

export interface ApiProductDetail {
    id: number;
    product_id: number;
    name_uz: string;
    name_ru: string;
    name_eng: string;
    [key: string]: unknown;
}

export interface CreateProductData {
    category_id: number;
    collection_id?: number;
    name_uz: string;
    name_ru: string;
    name_eng: string;
    description_uz?: string;
    description_ru?: string;
    description_eng?: string;
    price: number;
    is_active?: boolean;
    clothing_type: ClothingType;
}

export interface UpdateProductData extends Partial<CreateProductData> {}

// ─── Products ─────────────────────────────────────────────────────────────────
export const productsApi = {
    getAll: (params?: { include_inactive?: boolean; limit?: number }) =>
        apiFetch<ApiProduct[]>("/products", { params: params as Record<string, unknown> }),

    search: (params: { search?: string; category_id?: number; include_inactive?: boolean; limit?: number }) =>
        apiFetch<{ ok: boolean; data: ApiProduct[]; meta: { count: number } }>("/products/search", { params: params as Record<string, unknown> }),

    searchAdvanced: (params: {
        search?: string;
        category_id?: number;
        collection_id?: number;
        is_active?: boolean;
        min_price?: number;
        max_price?: number;
        clothing_type?: ClothingType;
        color_id?: number;
        size_id?: number;
        in_stock?: boolean;
        sort_by?: string;
        sort_dir?: string;
        limit?: number;
    }) =>
        apiFetch<ApiProduct[]>("/products/search/advanced", { params: params as Record<string, unknown> }),

    getById: (id: number) =>
        apiFetch<ApiProduct>(`/products/${id}`),

    create: (data: CreateProductData) => {
        const fd = toFormData(data as Record<string, unknown>);
        return apiFetch<{ ok: boolean; data: ApiProduct }>("/products", { method: "POST", body: fd });
    },

    update: (id: number, data: UpdateProductData) => {
        const fd = toFormData(data as Record<string, unknown>);
        return apiFetch<{ ok: boolean }>(`/products/${id}`, { method: "PATCH", body: fd });
    },

    delete: (id: number) =>
        apiFetch<{ ok: boolean }>(`/products/${id}`, { method: "DELETE" }),

    exportCSV: (params?: { include_inactive?: boolean }) =>
        apiFetch<Blob>("/products/export/csv", { params: params as Record<string, unknown> }),
};

// ─── Product Photos ───────────────────────────────────────────────────────────
export const productPhotosApi = {
    create: (productId: number, photo: File) => {
        const fd = new FormData();
        fd.append("photo", photo);
        return apiFetch<{ ok: boolean; data: { id: number; product_id: number; photo_url: string } }>(`/products/${productId}/photos`, { method: "POST", body: fd });
    },

    delete: (productId: number, photoId: number) =>
        apiFetch<{ ok: boolean }>(`/products/${productId}/photos/${photoId}`, { method: "DELETE" }),
};

// ─── Product Items ────────────────────────────────────────────────────────────
export const productItemsApi = {
    getAll: (productId: number) =>
        apiFetch<ApiProductItem[]>(`/products/${productId}/items`),

    create: (productId: number, data: { color_id: number; size_id: number; total_count: number; min_stock_level?: number }) => {
        const fd = toFormData(data as Record<string, unknown>);
        return apiFetch<{ ok: boolean; data: ApiProductItem }>(`/products/${productId}/items`, { method: "POST", body: fd });
    },

    update: (productId: number, itemId: number, data: Partial<{ color_id: number; size_id: number; total_count: number; min_stock_level: number }>) => {
        const fd = toFormData(data as Record<string, unknown>);
        return apiFetch<{ ok: boolean }>(`/products/${productId}/items/${itemId}`, { method: "PATCH", body: fd });
    },

    delete: (productId: number, itemId: number) =>
        apiFetch<{ ok: boolean }>(`/products/${productId}/items/${itemId}`, { method: "DELETE" }),
};

// ─── Product Details ──────────────────────────────────────────────────────────
// Note: Product Details endpoints are not documented in the new API
// Keeping for backward compatibility but may need removal
export const productDetailsApi = {
    getAll: (productId?: number) =>
        apiFetch<ApiProductDetail[]>("/product-details", { params: productId ? { product_id: productId } : {} }),

    getById: (id: number) =>
        apiFetch<ApiProductDetail>(`/product-details/${id}`),

    create: (data: { product_id: number; name_uz: string; name_ru: string; name_eng: string }) => {
        const fd = toFormData(data as Record<string, unknown>);
        return apiFetch<{ ok: boolean; id: number }>("/product-details", { method: "POST", body: fd });
    },

    update: (id: number, data: Partial<{ product_id: number; name_uz: string; name_ru: string; name_eng: string }>) => {
        const fd = toFormData(data as Record<string, unknown>);
        return apiFetch<{ ok: boolean }>(`/product-details/${id}`, { method: "PATCH", body: fd });
    },

    delete: (id: number) =>
        apiFetch<{ ok: boolean }>(`/product-details/${id}`, { method: "DELETE" }),
};