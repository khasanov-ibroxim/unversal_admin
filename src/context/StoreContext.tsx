import { createContext, useContext, useState, ReactNode } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ProductI18n {
    nameEn: string;
    nameRu: string;
    descriptionEn: string;
    descriptionRu: string;
}

export interface ProductColor {
    nameEn: string;
    nameRu: string;
    hex: string; // color hex for swatch preview
}

export interface ProductDetail {
    en: string;
    ru: string;
}

export interface StoreProduct extends ProductI18n {
    id: string;
    price: number;
    originalPrice?: number;
    stock: number;
    categoryId: string;
    status: "active" | "inactive";
    isNew?: boolean;
    isSale?: boolean;
    colors: ProductColor[];
    sizes: string[]; // selected from predefined list
    images: string[]; // base64 or object URLs
    details: ProductDetail[];
    delivery: string;
}

export interface StoreCategory {
    id: string;
    nameEn: string;
    nameRu: string;
    descriptionEn: string;
    descriptionRu: string;
    icon: string;
    parentId: string | null;
    status: "active" | "inactive";
}

export type OrderStatus = "delivered" | "processing" | "shipped" | "pending" | "cancelled";

export interface StoreOrder {
    id: string;
    customer: string;
    productId: string;
    amount: number;
    status: OrderStatus;
    date: string;
    phone: string;
}

// ─── Initial Data ──────────────────────────────────────────────────────────────

const initialCategories: StoreCategory[] = [
    {
        id: "women-clothing",
        nameEn: "Women's Clothing",
        nameRu: "Женская одежда",
        descriptionEn: "Premium women's fashion and apparel",
        descriptionRu: "Премиальная женская мода и одежда",
        icon: "👗",
        parentId: null,
        status: "active",
    },
    {
        id: "tops",
        nameEn: "Tops & Blouses",
        nameRu: "Топы и блузки",
        descriptionEn: "Longsleeves, mocknecks, blouses",
        descriptionRu: "Лонгсливы, водолазки, блузки",
        icon: "👚",
        parentId: "women-clothing",
        status: "active",
    },
    {
        id: "blazers",
        nameEn: "Blazers & Jackets",
        nameRu: "Блейзеры и жакеты",
        descriptionEn: "Tailored blazers, structured jackets",
        descriptionRu: "Приталенные блейзеры, структурированные жакеты",
        icon: "🧥",
        parentId: "women-clothing",
        status: "active",
    },
    {
        id: "dresses",
        nameEn: "Dresses",
        nameRu: "Платья",
        descriptionEn: "Evening, cocktail, and casual dresses",
        descriptionRu: "Вечерние, коктейльные и повседневные платья",
        icon: "👘",
        parentId: "women-clothing",
        status: "active",
    },
    {
        id: "accessories",
        nameEn: "Accessories",
        nameRu: "Аксессуары",
        descriptionEn: "Bags, belts, jewellery and more",
        descriptionRu: "Сумки, ремни, украшения и многое другое",
        icon: "💍",
        parentId: null,
        status: "active",
    },
    {
        id: "new-arrivals",
        nameEn: "New Arrivals",
        nameRu: "Новинки",
        descriptionEn: "Latest collections and new pieces",
        descriptionRu: "Последние коллекции и новинки",
        icon: "✨",
        parentId: null,
        status: "active",
    },
];

const initialProducts: StoreProduct[] = [
    {
        id: "contour-mockneck-longsleeve",
        nameEn: "Contour Mockneck Longsleeve",
        nameRu: "Облегающий лонгслив с воротником-стойкой",
        descriptionEn: "A refined mockneck longsleeve crafted from premium stretch fabric. The contoured silhouette flatters the figure while maintaining effortless comfort.",
        descriptionRu: "Изысканный лонгслив с воротником-стойкой из премиального эластичного материала. Облегающий силуэт подчёркивает фигуру, сохраняя комфорт.",
        price: 285,
        stock: 42,
        categoryId: "tops",
        status: "active",
        isNew: true,
        isSale: true,
        colors: [
            { nameEn: "Ivory", nameRu: "Слоновая кость", hex: "#FFFFF0" },
            { nameEn: "Black", nameRu: "Чёрный", hex: "#1a1a1a" },
            { nameEn: "Camel", nameRu: "Верблюжий", hex: "#C19A6B" },
        ],
        sizes: ["XS", "S", "M", "L", "XL"],
        images: [],
        details: [
            { en: "95% Viscose, 5% Elastane", ru: "95% вискоза, 5% эластан" },
            { en: "Slim contoured fit", ru: "Приталенный облегающий крой" },
            { en: "Mock neckline", ru: "Воротник-стойка" },
            { en: "Dry clean recommended", ru: "Рекомендуется химчистка" },
        ],
        delivery: "Free standard delivery on orders over $200. Returns within 28 days.",
    },
    {
        id: "generation-blazer",
        nameEn: "Generation Blazer",
        nameRu: "Блейзер Generation",
        descriptionEn: "The Generation Blazer redefines power dressing. Tailored in luxurious fluid fabric with a deep V-wrap front and dramatic flared cuffs.",
        descriptionRu: "Блейзер Generation переосмысляет деловой стиль. Пошит из роскошной текучей ткани с глубоким запахом и драматичными расклешёнными манжетами.",
        price: 510,
        stock: 18,
        categoryId: "blazers",
        status: "active",
        colors: [
            { nameEn: "Black", nameRu: "Чёрный", hex: "#1a1a1a" },
            { nameEn: "Midnight Navy", nameRu: "Тёмно-синий", hex: "#191970" },
            { nameEn: "Ivory", nameRu: "Слоновая кость", hex: "#FFFFF0" },
        ],
        sizes: ["XS", "S", "M", "L"],
        images: [],
        details: [
            { en: "100% Cupro lining", ru: "Подкладка 100% купро" },
            { en: "Wrap-front silhouette", ru: "Силуэт с запахом спереди" },
            { en: "Flared cuff detail", ru: "Расклешённые манжеты" },
            { en: "Dry clean only", ru: "Только химчистка" },
        ],
        delivery: "Free standard delivery on orders over $200. Returns within 28 days.",
    },
    {
        id: "oversized-blazer",
        nameEn: "Oversized Blazer",
        nameRu: "Оверсайз блейзер",
        descriptionEn: "Classic oversized blazer with a contemporary edge. Features double-breasted front and peak lapels with contrast stitching.",
        descriptionRu: "Классический оверсайз блейзер с современными деталями. Двубортный крой, остроконечные лацканы с контрастной строчкой.",
        price: 375,
        stock: 27,
        categoryId: "blazers",
        status: "active",
        colors: [
            { nameEn: "Black", nameRu: "Чёрный", hex: "#1a1a1a" },
            { nameEn: "Charcoal", nameRu: "Тёмно-серый", hex: "#36454F" },
        ],
        sizes: ["XS", "S", "M", "L", "XL"],
        images: [],
        details: [
            { en: "60% Wool, 40% Polyester", ru: "60% шерсть, 40% полиэстер" },
            { en: "Double-breasted front", ru: "Двубортный крой" },
            { en: "Peak lapel construction", ru: "Остроконечные лацканы" },
            { en: "Dry clean only", ru: "Только химчистка" },
        ],
        delivery: "Free standard delivery on orders over $200. Returns within 28 days.",
    },
    {
        id: "dazzle-bustier",
        nameEn: "Dazzle Bustier",
        nameRu: "Платье-корсет Dazzle",
        descriptionEn: "An architectural bustier dress that sculpts the silhouette with precision. Crafted in heavy crepe fabric with subtle texture.",
        descriptionRu: "Архитектурное платье-корсет, точно скульптурирующее силуэт. Пошито из плотного крепа с тонкой текстурой.",
        price: 455,
        stock: 12,
        categoryId: "dresses",
        status: "active",
        isNew: true,
        colors: [
            { nameEn: "Ivory", nameRu: "Слоновая кость", hex: "#FFFFF0" },
            { nameEn: "Black", nameRu: "Чёрный", hex: "#1a1a1a" },
        ],
        sizes: ["XS", "S", "M", "L"],
        images: [],
        details: [
            { en: "100% Polyester crepe", ru: "100% полиэстер крепового плетения" },
            { en: "Structured boning at bodice", ru: "Структурированные косточки в лифе" },
            { en: "Midi length", ru: "Длина миди" },
            { en: "Back zip closure", ru: "Застёжка-молния сзади" },
            { en: "Dry clean only", ru: "Только химчистка" },
        ],
        delivery: "Free standard delivery on orders over $200. Returns within 28 days.",
    },
];

const initialOrders: StoreOrder[] = [
    { id: "#10241", customer: "Anna Sokolova", productId: "contour-mockneck-longsleeve", amount: 285, status: "delivered", date: "2025-03-28", phone: "+7 900 111 2233" },
    { id: "#10242", customer: "Maria Ivanova", productId: "generation-blazer", amount: 510, status: "processing", date: "2025-03-29", phone: "+7 900 222 3344" },
    { id: "#10243", customer: "Elena Petrova", productId: "dazzle-bustier", amount: 455, status: "shipped", date: "2025-03-30", phone: "+7 900 333 4455" },
    { id: "#10244", customer: "Olga Sidorova", productId: "oversized-blazer", amount: 375, status: "pending", date: "2025-04-01", phone: "+7 900 444 5566" },
    { id: "#10245", customer: "Nadia Volkova", productId: "contour-mockneck-longsleeve", amount: 285, status: "delivered", date: "2025-04-01", phone: "+7 900 555 6677" },
    { id: "#10246", customer: "Irina Kozlova", productId: "generation-blazer", amount: 510, status: "cancelled", date: "2025-04-02", phone: "+7 900 666 7788" },
    { id: "#10247", customer: "Svetlana Novikova", productId: "dazzle-bustier", amount: 455, status: "processing", date: "2025-04-03", phone: "+7 900 777 8899" },
    { id: "#10248", customer: "Kate Johnson", productId: "oversized-blazer", amount: 375, status: "delivered", date: "2025-04-03", phone: "+1 555 888 9900" },
];

// ─── Context ───────────────────────────────────────────────────────────────────

interface StoreContextType {
    products: StoreProduct[];
    categories: StoreCategory[];
    orders: StoreOrder[];
    addProduct: (p: StoreProduct) => void;
    updateProduct: (p: StoreProduct) => void;
    deleteProduct: (id: string) => void;
    addCategory: (c: StoreCategory) => void;
    updateCategory: (c: StoreCategory) => void;
    deleteCategory: (id: string) => void;
    updateOrder: (o: StoreOrder) => void;
}

const StoreContext = createContext<StoreContextType | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
    const [products, setProducts] = useState<StoreProduct[]>(initialProducts);
    const [categories, setCategories] = useState<StoreCategory[]>(initialCategories);
    const [orders, setOrders] = useState<StoreOrder[]>(initialOrders);

    const addProduct = (p: StoreProduct) => setProducts((prev) => [p, ...prev]);
    const updateProduct = (p: StoreProduct) =>
        setProducts((prev) => prev.map((x) => (x.id === p.id ? p : x)));
    const deleteProduct = (id: string) =>
        setProducts((prev) => prev.filter((x) => x.id !== id));

    const addCategory = (c: StoreCategory) => setCategories((prev) => [c, ...prev]);
    const updateCategory = (c: StoreCategory) =>
        setCategories((prev) => prev.map((x) => (x.id === c.id ? c : x)));
    const deleteCategory = (id: string) =>
        setCategories((prev) => prev.filter((x) => x.id !== id));

    const updateOrder = (o: StoreOrder) =>
        setOrders((prev) => prev.map((x) => (x.id === o.id ? o : x)));

    return (
        <StoreContext.Provider
            value={{
                products,
                categories,
                orders,
                addProduct,
                updateProduct,
                deleteProduct,
                addCategory,
                updateCategory,
                deleteCategory,
                updateOrder,
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