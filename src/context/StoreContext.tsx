import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import {
    productsApi, productPhotosApi, productDetailsApi,
    categoriesApi, collectionsApi, colorsApi, sizesApi,
    ordersApi,
    type ApiProduct, type ApiCategory, type ApiCollection,
    type ApiColor, type ApiSize, type ApiOrder, type ApiOrderStatus,
} from "@/api";

// ─── Re-export for backward compat ────────────────────────────────────────────
export type { ApiProduct as StoreProduct, ApiCategory as StoreCategory, ApiOrder as StoreOrder, ApiOrderStatus as OrderStatus };

// ─── Context type ─────────────────────────────────────────────────────────────
interface StoreContextType {
    // Data
    products: ApiProduct[];
    categories: ApiCategory[];
    collections: ApiCollection[];
    colors: ApiColor[];
    sizes: ApiSize[];
    orders: ApiOrder[];

    // Loading states
    productsLoading: boolean;
    categoriesLoading: boolean;
    collectionsLoading: boolean;
    ordersLoading: boolean;

    // Error states
    productsError: string | null;
    categoriesError: string | null;
    collectionsError: string | null;
    ordersError: string | null;

    // Products CRUD
    refreshProducts: () => Promise<void>;
    deleteProduct: (id: number) => Promise<void>;

    // Categories CRUD
    refreshCategories: () => Promise<void>;
    addCategory: (data: { name_uz: string; name_ru: string; name_eng: string; is_active?: boolean }) => Promise<void>;
    updateCategory: (id: number, data: Partial<{ name_uz: string; name_ru: string; name_eng: string; is_active: boolean }>) => Promise<void>;
    deleteCategory: (id: number) => Promise<void>;

    // Collections CRUD
    refreshCollections: () => Promise<void>;
    addCollection: (data: { name_uz: string; name_ru: string; name_eng: string; is_active?: boolean }) => Promise<void>;
    updateCollection: (id: number, data: Partial<{ name_uz: string; name_ru: string; name_eng: string; is_active: boolean }>) => Promise<void>;
    deleteCollection: (id: number) => Promise<void>;

    // Orders
    refreshOrders: () => Promise<void>;
    updateOrderStatus: (orderId: number, status: ApiOrderStatus) => Promise<void>;
    confirmOrderPayment: (orderId: number) => Promise<void>;

    // Catalog helpers
    refreshColors: () => Promise<void>;
    refreshSizes: () => Promise<void>;
    addColor: (data: { color_code: string }) => Promise<void>;
    deleteColor: (id: number) => Promise<void>;
    addSize: (data: { name: string }) => Promise<void>;
    deleteSize: (id: number) => Promise<void>;
}

const StoreContext = createContext<StoreContextType | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────
export function StoreProvider({ children }: { children: ReactNode }) {
    const [products, setProducts] = useState<ApiProduct[]>([]);
    const [categories, setCategories] = useState<ApiCategory[]>([]);
    const [collections, setCollections] = useState<ApiCollection[]>([]);
    const [colors, setColors] = useState<ApiColor[]>([]);
    const [sizes, setSizes] = useState<ApiSize[]>([]);
    const [orders, setOrders] = useState<ApiOrder[]>([]);

    const [productsLoading, setProductsLoading] = useState(false);
    const [categoriesLoading, setCategoriesLoading] = useState(false);
    const [collectionsLoading, setCollectionsLoading] = useState(false);
    const [ordersLoading, setOrdersLoading] = useState(false);

    const [productsError, setProductsError] = useState<string | null>(null);
    const [categoriesError, setCategoriesError] = useState<string | null>(null);
    const [collectionsError, setCollectionsError] = useState<string | null>(null);
    const [ordersError, setOrdersError] = useState<string | null>(null);

    // ── Fetch functions ──────────────────────────────────────────────────────
    const refreshProducts = useCallback(async () => {
        setProductsLoading(true);
        setProductsError(null);
        try {
            const data = await productsApi.getAll();
            setProducts(Array.isArray(data) ? data : []);
        } catch (e: unknown) {
            setProductsError(e instanceof Error ? e.message : "Products yuklanmadi");
        } finally {
            setProductsLoading(false);
        }
    }, []);

    const refreshCategories = useCallback(async () => {
        setCategoriesLoading(true);
        setCategoriesError(null);
        try {
            const data = await categoriesApi.getAll();
            setCategories(Array.isArray(data) ? data : []);
        } catch (e: unknown) {
            setCategoriesError(e instanceof Error ? e.message : "Kategoriyalar yuklanmadi");
        } finally {
            setCategoriesLoading(false);
        }
    }, []);

    const refreshCollections = useCallback(async () => {
        setCollectionsLoading(true);
        setCollectionsError(null);
        try {
            const data = await collectionsApi.getAll();
            setCollections(Array.isArray(data) ? data : []);
        } catch (e: unknown) {
            setCollectionsError(e instanceof Error ? e.message : "Kolleksiyalar yuklanmadi");
        } finally {
            setCollectionsLoading(false);
        }
    }, []);

    const refreshColors = useCallback(async () => {
        try {
            const data = await colorsApi.getAll();
            setColors(Array.isArray(data) ? data : []);
        } catch {
            // silent
        }
    }, []);

    const refreshSizes = useCallback(async () => {
        try {
            const data = await sizesApi.getAll();
            setSizes(Array.isArray(data) ? data : []);
        } catch {
            // silent
        }
    }, []);

    const refreshOrders = useCallback(async () => {
        setOrdersLoading(true);
        setOrdersError(null);
        try {
            const res = await ordersApi.getAll();
            setOrders(Array.isArray(res.data) ? res.data : []);
        } catch (e: unknown) {
            setOrdersError(e instanceof Error ? e.message : "Buyurtmalar yuklanmadi");
        } finally {
            setOrdersLoading(false);
        }
    }, []);

    // Initial load
    useEffect(() => {
        refreshProducts();
        refreshCategories();
        refreshCollections();
        refreshColors();
        refreshSizes();
        refreshOrders();
    }, [refreshProducts, refreshCategories, refreshCollections, refreshColors, refreshSizes, refreshOrders]);

    // ── Products ─────────────────────────────────────────────────────────────
    const deleteProduct = useCallback(async (id: number) => {
        await productsApi.delete(id);
        setProducts((prev) => prev.filter((p) => p.id !== id));
    }, []);

    // ── Categories ───────────────────────────────────────────────────────────
    const addCategory = useCallback(async (data: { name_uz: string; name_ru: string; name_eng: string; is_active?: boolean }) => {
        const res = await categoriesApi.create(data);
        if (res.data) setCategories((prev) => [res.data, ...prev]);
        else await refreshCategories();
    }, [refreshCategories]);

    const updateCategory = useCallback(async (id: number, data: Partial<{ name_uz: string; name_ru: string; name_eng: string; is_active: boolean }>) => {
        const res = await categoriesApi.update(id, data);
        if (res.data) {
            setCategories((prev) => prev.map((c) => (c.id === id ? { ...c, ...res.data } : c)));
        } else {
            await refreshCategories();
        }
    }, [refreshCategories]);

    const deleteCategory = useCallback(async (id: number) => {
        await categoriesApi.delete(id);
        setCategories((prev) => prev.filter((c) => c.id !== id));
    }, []);

    // ── Collections ──────────────────────────────────────────────────────────
    const addCollection = useCallback(async (data: { name_uz: string; name_ru: string; name_eng: string; is_active?: boolean }) => {
        await collectionsApi.create(data);
        await refreshCollections();
    }, [refreshCollections]);

    const updateCollection = useCallback(async (id: number, data: Partial<{ name_uz: string; name_ru: string; name_eng: string; is_active: boolean }>) => {
        await collectionsApi.update(id, data);
        await refreshCollections();
    }, [refreshCollections]);

    const deleteCollection = useCallback(async (id: number) => {
        await collectionsApi.delete(id);
        setCollections((prev) => prev.filter((c) => c.id !== id));
    }, []);

    // ── Orders ───────────────────────────────────────────────────────────────
    const updateOrderStatus = useCallback(async (orderId: number, status: ApiOrderStatus) => {
        const res = await ordersApi.updateStatus(orderId, status);
        if (res.data) {
            setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: res.data.status as ApiOrderStatus } : o)));
        }
    }, []);

    const confirmOrderPayment = useCallback(async (orderId: number) => {
        await ordersApi.confirmPayment(orderId);
        await refreshOrders();
    }, [refreshOrders]);

    // ── Colors / Sizes ───────────────────────────────────────────────────────
    const addColor = useCallback(async (data: { color_code: string }) => {
        await colorsApi.create(data);
        await refreshColors();
    }, [refreshColors]);

    const deleteColor = useCallback(async (id: number) => {
        await colorsApi.delete(id);
        setColors((prev) => prev.filter((c) => c.id !== id));
    }, []);

    const addSize = useCallback(async (data: { name: string }) => {
        await sizesApi.create(data);
        await refreshSizes();
    }, [refreshSizes]);

    const deleteSize = useCallback(async (id: number) => {
        await sizesApi.delete(id);
        setSizes((prev) => prev.filter((s) => s.id !== id));
    }, []);

    return (
        <StoreContext.Provider
            value={{
                products, categories, collections, colors, sizes, orders,
                productsLoading, categoriesLoading, collectionsLoading, ordersLoading,
                productsError, categoriesError, collectionsError, ordersError,
                refreshProducts, deleteProduct,
                refreshCategories, addCategory, updateCategory, deleteCategory,
                refreshCollections, addCollection, updateCollection, deleteCollection,
                refreshOrders, updateOrderStatus, confirmOrderPayment,
                refreshColors, refreshSizes,
                addColor, deleteColor, addSize, deleteSize,
            }}
        >
            {children}
        </StoreContext.Provider>
    );
}

export function useStore() {
    const ctx = useContext(StoreContext);
    if (!ctx) throw new Error("useStore must be used within StoreProvider");
    return ctx;
}