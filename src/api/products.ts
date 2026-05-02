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
    product_photos: { photo: string; id: number };
    [key: string]: unknown;
}

export interface ApiProductPhoto {
    id: number;
    product_id: number;
    photo: string;
    [key: string]: unknown;
}

export interface ApiProductItem {
    id: number;
    product_id: number;
    color_id: number;
    size_id: number;
    total_count: number;
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
    collection_id: number;
    name_uz: string;
    name_ru: string;
    name_eng: string;
    description_uz: string;
    description_ru: string;
    description_eng: string;
    price: number;
    is_active?: boolean;
    clothing_type?: ClothingType;
    photo?: File;
}

export interface UpdateProductData extends Partial<CreateProductData> {}

// ─── Products ─────────────────────────────────────────────────────────────────
export const productsApi = {
    getAll: () =>
        apiFetch<ApiProduct[]>("/products"),

    search: (params: { search?: string; category_id?: number }) =>
        apiFetch<{ ok: boolean; data: ApiProduct[]; meta: { count: number } }>("/products/search", { params }),

    searchAdvanced: (params: {
        search?: string;
        category_id?: number;
        collection_id?: number;
        is_active?: boolean;
        min_price?: number;
        max_price?: number;
        limit?: number;
    }) =>
        apiFetch<{ ok: boolean; data: ApiProduct[]; meta: { count: number } }>("/products/search/advanced", { params }),

    getById: (id: number) =>
        apiFetch<{ product: ApiProduct }>(`/products/${id}`),

    getByCategory: (categoryId: number) =>
        apiFetch<ApiProduct[]>(`/products/category/${categoryId}`),

    create: (data: CreateProductData) => {
        const fd = new FormData();
        fd.append("category_id", String(data.category_id));
        fd.append("collection_id", String(data.collection_id));
        fd.append("name_uz", data.name_uz);
        fd.append("name_ru", data.name_ru);
        fd.append("name_eng", data.name_eng);
        fd.append("description_uz", data.description_uz);
        fd.append("description_ru", data.description_ru);
        fd.append("description_eng", data.description_eng);
        fd.append("price", String(data.price));
        if (data.is_active !== undefined) fd.append("is_active", data.is_active ? "true" : "false");
        if (data.clothing_type) fd.append("clothing_type", data.clothing_type);
        if (data.photo) fd.append("photo", data.photo);
        return apiFetch<{ ok: boolean; id: number }>("/products", { method: "POST", body: fd });
    },

    update: (id: number, data: UpdateProductData) => {
        const fd = toFormData(data as Record<string, unknown>);
        return apiFetch<{ ok: boolean }>(`/products/${id}`, { method: "PATCH", body: fd });
    },

    delete: (id: number) =>
        apiFetch<{ ok: boolean }>(`/products/${id}`, { method: "DELETE" }),
};

// ─── Product Photos ───────────────────────────────────────────────────────────
export const productPhotosApi = {
    getAll: (productId?: number) =>
        apiFetch<ApiProductPhoto[]>("/product-photos", { params: productId ? { product_id: productId } : {} }),

    getById: (id: number) =>
        apiFetch<ApiProductPhoto>(`/product-photos/${id}`),

    create: (productId: number, photo: File) => {
        const fd = new FormData();
        fd.append("product_id", String(productId));
        fd.append("photo", photo);
        return apiFetch<{ ok: boolean; id: number }>("/product-photos", { method: "POST", body: fd });
    },

    update: (id: number, data: { product_id?: number; photo?: File }) => {
        const fd = toFormData(data as Record<string, unknown>);
        return apiFetch<{ ok: boolean }>(`/product-photos/${id}`, { method: "PATCH", body: fd });
    },

    delete: (id: number) =>
        apiFetch<{ ok: boolean }>(`/product-photos/${id}`, { method: "DELETE" }),
};

// ─── Product Items ────────────────────────────────────────────────────────────
export const productItemsApi = {
    getAll: (productId?: number) =>
        apiFetch<ApiProductItem[]>("/product-items", { params: productId ? { product_id: productId } : {} }),

    getById: (id: number) =>
        apiFetch<ApiProductItem>(`/product-items/${id}`),

    create: (data: { product_id: number; color_id: number; size_id: number; total_count: number }) => {
        const fd = toFormData(data as Record<string, unknown>);
        return apiFetch<{ ok: boolean; id: number }>("/product-items", { method: "POST", body: fd });
    },

    update: (id: number, data: Partial<{ product_id: number; color_id: number; size_id: number; total_count: number }>) => {
        const fd = toFormData(data as Record<string, unknown>);
        return apiFetch<{ ok: boolean }>(`/product-items/${id}`, { method: "PATCH", body: fd });
    },

    delete: (id: number) =>
        apiFetch<{ ok: boolean }>(`/product-items/${id}`, { method: "DELETE" }),
};

// ─── Product Details ──────────────────────────────────────────────────────────
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