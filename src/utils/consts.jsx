// =====================
// ROUTE PATHS
// =====================
export const LOGIN = "/login";
export const ADMIN_DASHBOARD = "/";
export const ADMIN_ORDERS = "/orders";
export const ADMIN_PRODUCTS = "/products";
export const ADMIN_CATEGORIES = "/categories";
export const ADMIN_USERS = "/users";
export const ADMIN_SHOPS = "/shops";
export const ADMIN_MESSAGES = "/messages";
export const ADMIN_ANALYTICS = "/analytics";
export const ADMIN_NOTIFICATIONS = "/notifications";
export const ADMIN_SETTINGS = "/settings";

// =====================
// LAZY IMPORTS (used in router)
// =====================
import { lazy } from "react";

export const LoginPage = lazy(() => import("@/pages/Login"));
export const DashboardPage = lazy(() => import("@/pages/index"));
export const OrdersPage = lazy(() => import("@/pages/Orders"));
export const ProductsPage = lazy(() => import("@/pages/Products"));
export const CategoriesPage = lazy(() => import("@/pages/Categories"));
export const UsersPage = lazy(() => import("@/pages/Users"));
export const ShopsPage = lazy(() => import("@/pages/Shops"));
export const MessagesPage = lazy(() => import("@/pages/Messages"));
export const AnalyticsPage = lazy(() => import("@/pages/Analytics"));
export const NotificationsPage = lazy(() => import("@/pages/Notifications"));
export const SettingsPage = lazy(() => import("@/pages/Settings"));

// =====================
// PUBLIC ROUTES (no auth required)
// =====================
export const PUBLIC_ROUTES = [
    {
        path: LOGIN,
        Component: LoginPage,
    },
];

// =====================
// PROTECTED ROUTES (auth required)
// Add or remove routes here to manage the admin panel navigation
// =====================
export const PROTECTED_ROUTES = [
    {
        path: ADMIN_DASHBOARD,
        Component: DashboardPage,
        label: "Dashboard",
    },
    {
        path: ADMIN_ORDERS,
        Component: OrdersPage,
        label: "Buyurtmalar",
    },
    {
        path: ADMIN_PRODUCTS,
        Component: ProductsPage,
        label: "Mahsulotlar",
    },
    {
        path: ADMIN_CATEGORIES,
        Component: CategoriesPage,
        label: "Kategoriyalar",
    },
    {
        path: ADMIN_USERS,
        Component: UsersPage,
        label: "Foydalanuvchilar",
    },
    {
        path: ADMIN_SHOPS,
        Component: ShopsPage,
        label: "Do'konlar",
    },
    {
        path: ADMIN_MESSAGES,
        Component: MessagesPage,
        label: "Xabarlar",
    },
    {
        path: ADMIN_ANALYTICS,
        Component: AnalyticsPage,
        label: "Statistika",
    },
    {
        path: ADMIN_NOTIFICATIONS,
        Component: NotificationsPage,
        label: "Bildirishnomalar",
    },
    {
        path: ADMIN_SETTINGS,
        Component: SettingsPage,
        label: "Sozlamalar",
    },
];