import { apiFetch, toFormData } from "./client";

// ─── Types ────────────────────────────────────────────────────────────────────
export interface ApiCategory {
    id: number;
    name_uz: string;
    name_ru: string;
    name_eng: string;
    is_active: boolean;
    [key: string]: unknown;
}

export interface ApiCollection {
    id: number;
    name_uz: string;
    name_ru: string;
    name_eng: string;
    is_active: boolean;
    [key: string]: unknown;
}

export interface ApiColor {
    id: number;
    name_uz: string;
    name_ru: string;
    name_eng: string;
    [key: string]: unknown;
}

export interface ApiSize {
    id: number;
    name: string;
    [key: string]: unknown;
}

export interface ApiBanner {
    id: number;
    photo_url: string;
    [key: string]: unknown;
}

// ─── Categories ───────────────────────────────────────────────────────────────
export const categoriesApi = {
    getAll: () =>
        apiFetch<ApiCategory[]>("/categories"),

    getById: (id: number) =>
        apiFetch<ApiCategory>(`/categories/${id}`),

    create: (data: { name_uz: string; name_ru: string; name_eng: string; is_active?: boolean }) => {
        const fd = toFormData(data as Record<string, unknown>);
        return apiFetch<{ ok: boolean; data: ApiCategory }>("/categories", { method: "POST", body: fd });
    },

    update: (id: number, data: Partial<{ name_uz: string; name_ru: string; name_eng: string; is_active: boolean }>) => {
        const fd = toFormData(data as Record<string, unknown>);
        return apiFetch<{ ok: boolean; data: ApiCategory }>(`/categories/${id}`, { method: "PATCH", body: fd });
    },

    delete: (id: number) =>
        apiFetch<{ ok: boolean }>(`/categories/${id}`, { method: "DELETE" }),
};

// ─── Collections ──────────────────────────────────────────────────────────────
export const collectionsApi = {
    getAll: () =>
        apiFetch<ApiCollection[]>("/collections"),

    getById: (id: number) =>
        apiFetch<ApiCollection>(`/collections/${id}`),

    create: (data: { name_uz: string; name_ru: string; name_eng: string; is_active?: boolean }) => {
        const fd = toFormData(data as Record<string, unknown>);
        return apiFetch<{ ok: boolean; data: ApiCollection }>("/collections", { method: "POST", body: fd });
    },

    update: (id: number, data: Partial<{ name_uz: string; name_ru: string; name_eng: string; is_active: boolean }>) => {
        const fd = toFormData(data as Record<string, unknown>);
        return apiFetch<{ ok: boolean; data: ApiCollection }>(`/collections/${id}`, { method: "PATCH", body: fd });
    },

    delete: (id: number) =>
        apiFetch<{ ok: boolean }>(`/collections/${id}`, { method: "DELETE" }),
};

// ─── Colors ───────────────────────────────────────────────────────────────────
export const colorsApi = {
    getAll: () =>
        apiFetch<ApiColor[]>("/color/"),

    getById: (id: number) =>
        apiFetch<ApiColor>(`/color/${id}`),

    create: (data: { name_uz: string; name_ru: string; name_eng: string }) => {
        const fd = toFormData(data as Record<string, unknown>);
        return apiFetch<{ ok: boolean; data: ApiColor }>("/color/", { method: "POST", body: fd });
    },

    update: (id: number, data: Partial<{ name_uz: string; name_ru: string; name_eng: string }>) => {
        const fd = toFormData(data as Record<string, unknown>);
        return apiFetch<{ ok: boolean; data: ApiColor }>(`/color/${id}`, { method: "PATCH", body: fd });
    },

    delete: (id: number) =>
        apiFetch<{ ok: boolean }>(`/color/${id}`, { method: "DELETE" }),
};

// ─── Sizes ────────────────────────────────────────────────────────────────────
export const sizesApi = {
    getAll: () =>
        apiFetch<ApiSize[]>("/size/"),

    getById: (id: number) =>
        apiFetch<ApiSize>(`/size/${id}`),

    create: (data: { name: string }) => {
        const fd = toFormData(data as Record<string, unknown>);
        return apiFetch<{ ok: boolean; data: ApiSize }>("/size/", { method: "POST", body: fd });
    },

    update: (id: number, data: { name: string }) => {
        const fd = toFormData(data as Record<string, unknown>);
        return apiFetch<{ ok: boolean; data: ApiSize }>(`/size/${id}`, { method: "PATCH", body: fd });
    },

    delete: (id: number) =>
        apiFetch<{ ok: boolean }>(`/size/${id}`, { method: "DELETE" }),
};

// ─── Banners ──────────────────────────────────────────────────────────────────
export const bannersApi = {
    getAll: () =>
        apiFetch<{ photos: ApiBanner[] }>("/banners/"),

    create: (photo: File) => {
        const fd = new FormData();
        fd.append("photo", photo);
        return apiFetch<{ ok: boolean }>("/banners/", { method: "POST", body: fd });
    },

    delete: (id: number) =>
        apiFetch<{ ok: boolean }>(`/banners/${id}`, { method: "DELETE" }),
};
