import { AdminLayout } from "@/components/AdminLayout";
import { StatsCard } from "@/components/StatsCard";
import { ShoppingCart, Package, Users, DollarSign, TrendingUp, BarChart2, RefreshCw, ImagePlus, MapPin, Tag } from "lucide-react";
import { useStore } from "@/context/StoreContext";
import { useLang } from "@/context/LangContext";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { BASE_URL } from "@/api";
import { historyApi } from "@/api/panel";
import { useEffect, useState, useCallback } from "react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
    PieChart,
    Pie,
    Cell,
} from "recharts";

// ─── Types ────────────────────────────────────────────────────────────────────
interface SalesStats {
    from: string;
    to: string;
    total_orders: number;
    paid_orders: number;
    sold_items_count: number;
    sales_amount: number;
    payment_breakdown: {
        click?: { orders_count: number; items_count: number; amount: number };
        payme?: { orders_count: number; items_count: number; amount: number };
        cash?: { orders_count: number; items_count: number; amount: number };
    };
    currency: string;
}

interface DashboardStats {
    today_sales: { orders_count: number; sold_items: number; revenue: number };
    week_sales: { orders_count: number; sold_items: number; revenue: number };
    new_orders: number;
    low_stock: unknown[];
    top_products: { product_id: number; name: string; total_sold: number; revenue: number }[];
}

// ─── Constants ────────────────────────────────────────────────────────────────
const statusColors: Record<string, string> = {
    "yangi":          "bg-blue-500/15 text-blue-400 border-blue-500/20",
    "to'landi":       "bg-success/15 text-success border-success/20",
    "jarayonda":      "bg-primary/15 text-primary border-primary/20",
    "tayyor":         "bg-accent/15 text-accent border-accent/20",
    "yetkazilmoqda":  "bg-warning/15 text-warning border-warning/20",
    "yetkazildi":     "bg-success/15 text-success border-success/20",
    "bekor qilindi":  "bg-destructive/15 text-destructive border-destructive/20",
};

// Keyword-based gender classification from product name
function classifyGender(name: string): "men" | "women" | "unisex" {
    const lower = name.toLowerCase();
    const womenKw = ["ayol", "женщин", "women", "woman", "lady", "ladies", "girl", "qiz", "xotin", "female"];
    const menKw   = ["erkak", "мужск", "men", "man", "male", "boy", "o'g'il", "ogil"];
    if (womenKw.some(k => lower.includes(k))) return "women";
    if (menKw.some(k => lower.includes(k))) return "men";
    return "unisex";
}

// Format UZS amount
function fmtAmount(n: number) {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000)    return `${(n / 1_000).toFixed(0)}K`;
    return n.toString();
}

// Get ISO date strings for date range
function getDateRange(days: number) {
    const to   = new Date();
    const from = new Date();
    from.setDate(from.getDate() - days);
    return {
        date_from: from.toISOString(),
        date_to:   to.toISOString(),
    };
}

// ─── Payment breakdown pie chart colors ───────────────────────────────────────
const PIE_COLORS = ["hsl(199,89%,48%)", "hsl(280,60%,55%)", "hsl(45,93%,47%)"];

// ─── Main component ───────────────────────────────────────────────────────────
export default function Index() {
    const { products, orders, categories } = useStore();
    const { tr, lang } = useLang();

    const [salesStats, setSalesStats]       = useState<SalesStats | null>(null);
    const [dashStats, setDashStats]         = useState<DashboardStats | null>(null);
    const [loadingStats, setLoadingStats]   = useState(true);
    const [statsRange, setStatsRange]       = useState<7 | 30>(30);

    const fetchStats = useCallback(async () => {
        setLoadingStats(true);
        try {
            const range = getDateRange(statsRange);
            const [salesRes, dashRes] = await Promise.all([
                historyApi.getSalesStats(range),
                historyApi.getDashboardStats({ top_limit: 10 }),
            ]);
            if (salesRes.ok) setSalesStats(salesRes.data as SalesStats);
            if (dashRes.ok)  setDashStats(dashRes.data as DashboardStats);
        } catch {
            // silent
        } finally {
            setLoadingStats(false);
        }
    }, [statsRange]);

    useEffect(() => { fetchStats(); }, [fetchStats]);

    // ── Derived stats cards ──────────────────────────────────────────────────
    const stats = [
        {
            title: tr.totalOrders,
            value: salesStats
                ? salesStats.total_orders.toString()
                : orders.length.toString(),
            change: dashStats ? `+${dashStats.today_sales.orders_count} bugun` : "",
            trend: "up" as const,
            icon: ShoppingCart,
        },
        {
            title: tr.totalProducts,
            value: products.length.toString(),
            change: "",
            trend: "up" as const,
            icon: Package,
        },
        {
            title: tr.categories,
            value: categories.length.toString(),
            change: "",
            trend: "up" as const,
            icon: Users,
        },
        {
            title: tr.revenue,
            value: salesStats
                ? `${salesStats.sales_amount.toLocaleString()} so'm`
                : `${orders.reduce((s, o) => s + ((o.price as number) || 0), 0).toLocaleString()} so'm`,
            change: dashStats ? `Hafta: ${fmtAmount(dashStats.week_sales.revenue)} so'm` : "",
            trend: "up" as const,
            icon: DollarSign,
        },
    ];

    // ── Payment breakdown pie data ───────────────────────────────────────────
    const pieData = salesStats
        ? Object.entries(salesStats.payment_breakdown).map(([key, val]) => ({
            name:  key.charAt(0).toUpperCase() + key.slice(1),
            value: val?.amount ?? 0,
            orders: val?.orders_count ?? 0,
        })).filter(d => d.value > 0)
        : [];

    // ── Gender-split top products (from store products + dashStats top list) ──
    const topProductsRaw = dashStats?.top_products ?? [];

    const genderChartData = topProductsRaw.slice(0, 8).map(tp => {
        const gender = classifyGender(tp.name);
        return {
            name: tp.name.length > 16 ? tp.name.slice(0, 16) + "…" : tp.name,
            fullName: tp.name,
            men:   gender === "men"   ? tp.total_sold : gender === "unisex" ? Math.round(tp.total_sold * 0.5) : 0,
            women: gender === "women" ? tp.total_sold : gender === "unisex" ? Math.round(tp.total_sold * 0.5) : 0,
            revenue: tp.revenue,
        };
    });

    const totalMen   = genderChartData.reduce((s, d) => s + d.men, 0);
    const totalWomen = genderChartData.reduce((s, d) => s + d.women, 0);
    const totalAll   = totalMen + totalWomen || 1;

    // ── Fallback top products from store ────────────────────────────────────
    const storeTopProducts = products
        .map(p => ({
            ...p,
            salesCount: orders.filter(o => (o as Record<string, unknown>).product_id === p.id).length,
        }))
        .sort((a, b) => b.salesCount - a.salesCount)
        .slice(0, 5);

    // ── Recent orders ────────────────────────────────────────────────────────
    const recentOrders = [...orders]
        .sort((a, b) => (b.id as number) - (a.id as number))
        .slice(0, 10);

    const getProductName = (p: typeof products[0]) =>
        lang === "RU" ? p.name_ru : p.name_eng;

    const getPhotoSrc = (p: typeof products[0]) => {
        const url = (p as { photo_url?: string }).photo_url;
        if (!url) return null;
        return url.startsWith("http") ? url : `${BASE_URL}${url}`;
    };

    // Get order items for a given order (from order object if available)
    const getOrderItems = (order: typeof orders[0]) => {
        const items = (order as Record<string, unknown>).order_items as { product_id?: number; count?: number }[] | undefined;
        return items ?? [];
    };

    const getOrderProductNames = (order: typeof orders[0]) => {
        const items = getOrderItems(order);
        if (!items.length) return null;
        return items
            .map(item => {
                const prod = products.find(p => p.id === item.product_id);
                if (!prod) return null;
                return `${getProductName(prod)}${item.count && item.count > 1 ? ` ×${item.count}` : ""}`;
            })
            .filter(Boolean)
            .join(", ");
    };

    return (
        <AdminLayout title={tr.dashboard}>
            <div className="space-y-6">

                {/* ── Stats cards ── */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {stats.map((stat, i) => (
                        <StatsCard key={stat.title} {...stat} index={i} />
                    ))}
                </div>

                {/* ── Sales stats + Payment breakdown ── */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* Sales summary cards (from API) */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="glass rounded-2xl p-5 md:p-6 lg:col-span-2"
                    >
                        <div className="flex items-center justify-between mb-5">
                            <div className="flex items-center gap-2">
                                <TrendingUp className="h-4 w-4 text-primary" />
                                <h3 className="text-base font-semibold">Sotuv statistikasi</h3>
                            </div>
                            <div className="flex items-center gap-2">
                                {/* Range selector */}
                                <div className="flex gap-1 glass rounded-lg p-1">
                                    {([7, 30] as const).map(d => (
                                        <button
                                            key={d}
                                            onClick={() => setStatsRange(d)}
                                            className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                                                statsRange === d
                                                    ? "bg-primary/30 text-primary"
                                                    : "text-muted-foreground hover:text-foreground"
                                            }`}
                                        >
                                            {d} kun
                                        </button>
                                    ))}
                                </div>
                                <button
                                    onClick={fetchStats}
                                    disabled={loadingStats}
                                    className="glass rounded-lg p-2 hover:bg-muted/20 transition-colors"
                                >
                                    <RefreshCw className={`h-3.5 w-3.5 text-muted-foreground ${loadingStats ? "animate-spin" : ""}`} />
                                </button>
                            </div>
                        </div>

                        {loadingStats ? (
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                {[...Array(4)].map((_, i) => (
                                    <div key={i} className="glass-subtle rounded-xl p-4 animate-pulse h-20" />
                                ))}
                            </div>
                        ) : salesStats ? (
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                {[
                                    { label: "Jami buyurtma", value: salesStats.total_orders, icon: ShoppingCart, color: "text-blue-400" },
                                    { label: "To'langan",    value: salesStats.paid_orders,   icon: DollarSign,   color: "text-green-400" },
                                    { label: "Sotilgan dona", value: salesStats.sold_items_count, icon: Package,  color: "text-accent" },
                                    { label: "Sotuv summasi", value: `${fmtAmount(salesStats.sales_amount)} so'm`, icon: TrendingUp, color: "text-primary", isText: true },
                                ].map(card => (
                                    <div key={card.label} className="glass-subtle rounded-xl p-4 flex flex-col gap-2">
                                        <card.icon className={`h-4 w-4 ${card.color}`} />
                                        <p className={`text-lg font-bold ${card.color}`}>
                                            {card.isText ? card.value : (card.value as number).toLocaleString()}
                                        </p>
                                        <p className="text-xs text-muted-foreground">{card.label}</p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground text-center py-6">Statistika yuklanmadi</p>
                        )}

                        {/* Today vs Week mini comparison */}
                        {dashStats && (
                            <div className="mt-4 grid grid-cols-2 gap-3">
                                <div className="glass-subtle rounded-xl p-3 flex items-center gap-3">
                                    <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
                                        <BarChart2 className="h-4 w-4 text-primary" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">Bugun</p>
                                        <p className="text-sm font-semibold">{fmtAmount(dashStats.today_sales.revenue)} so'm</p>
                                        <p className="text-xs text-muted-foreground">{dashStats.today_sales.orders_count} buyurtma</p>
                                    </div>
                                </div>
                                <div className="glass-subtle rounded-xl p-3 flex items-center gap-3">
                                    <div className="h-8 w-8 rounded-lg bg-accent/20 flex items-center justify-center shrink-0">
                                        <TrendingUp className="h-4 w-4 text-accent" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">Bu hafta</p>
                                        <p className="text-sm font-semibold">{fmtAmount(dashStats.week_sales.revenue)} so'm</p>
                                        <p className="text-xs text-muted-foreground">{dashStats.week_sales.orders_count} buyurtma</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </motion.div>

                    {/* Payment breakdown pie */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="glass rounded-2xl p-5 md:p-6"
                    >
                        <h3 className="text-base font-semibold mb-4">To'lov turlari</h3>
                        {pieData.length > 0 ? (
                            <>
                                <ResponsiveContainer width="100%" height={160}>
                                    <PieChart>
                                        <Pie
                                            data={pieData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={45}
                                            outerRadius={70}
                                            paddingAngle={3}
                                            dataKey="value"
                                        >
                                            {pieData.map((_, idx) => (
                                                <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            formatter={(v: number) => [`${fmtAmount(v)} so'm`, "Summa"]}
                                            contentStyle={{ background: "hsl(225,25%,12%)", border: "1px solid hsl(225,25%,22%)", borderRadius: 8 }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="space-y-2 mt-2">
                                    {pieData.map((d, idx) => (
                                        <div key={d.name} className="flex items-center justify-between text-xs">
                                            <div className="flex items-center gap-2">
                                                <div className="h-2.5 w-2.5 rounded-full" style={{ background: PIE_COLORS[idx % PIE_COLORS.length] }} />
                                                <span className="text-muted-foreground">{d.name}</span>
                                            </div>
                                            <span className="font-medium">{d.orders} buyurtma</span>
                                        </div>
                                    ))}
                                </div>
                            </>
                        ) : (
                            <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">
                                {loadingStats ? "Yuklanmoqda…" : "Ma'lumot yo'q"}
                            </div>
                        )}
                    </motion.div>
                </div>

                {/* ── Gender-split top products chart ── */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35 }}
                    className="glass rounded-2xl p-5 md:p-6"
                >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
                        <div>
                            <h3 className="text-base font-semibold">{tr.topProducts} — Jins bo'yicha tahlil</h3>
                            <p className="text-xs text-muted-foreground mt-0.5">Erkaklar va ayollar kiyimlari talab taqqoslash</p>
                        </div>
                        {/* Gender ratio pills */}
                        <div className="flex items-center gap-3 shrink-0">
                            <div className="flex items-center gap-1.5 glass-subtle rounded-full px-3 py-1">
                                <div className="h-2 w-2 rounded-full bg-blue-400" />
                                <span className="text-xs font-medium text-blue-400">Erkak</span>
                                <span className="text-xs text-muted-foreground">{Math.round((totalMen / totalAll) * 100)}%</span>
                            </div>
                            <div className="flex items-center gap-1.5 glass-subtle rounded-full px-3 py-1">
                                <div className="h-2 w-2 rounded-full bg-pink-400" />
                                <span className="text-xs font-medium text-pink-400">Ayol</span>
                                <span className="text-xs text-muted-foreground">{Math.round((totalWomen / totalAll) * 100)}%</span>
                            </div>
                        </div>
                    </div>

                    {genderChartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={240}>
                            <BarChart data={genderChartData} barGap={4} barCategoryGap="28%">
                                <CartesianGrid strokeDasharray="3 3" stroke="hsl(225,25%,18%)" vertical={false} />
                                <XAxis
                                    dataKey="name"
                                    tick={{ fill: "hsl(215,20%,55%)", fontSize: 11 }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <YAxis
                                    tick={{ fill: "hsl(215,20%,55%)", fontSize: 11 }}
                                    axisLine={false}
                                    tickLine={false}
                                    width={30}
                                />
                                <Tooltip
                                    contentStyle={{ background: "hsl(225,25%,12%)", border: "1px solid hsl(225,25%,22%)", borderRadius: 8, fontSize: 12 }}
                                    cursor={{ fill: "hsl(225,25%,20%)" }}
                                    formatter={(val: number, name: string) => [
                                        `${val} dona`,
                                        name === "men" ? "Erkak" : "Ayol",
                                    ]}
                                    labelFormatter={(label) => {
                                        const item = genderChartData.find(d => d.name === label);
                                        return item?.fullName ?? label;
                                    }}
                                />
                                <Legend
                                    formatter={(value) => value === "men" ? "Erkak" : "Ayol"}
                                    wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
                                />
                                <Bar dataKey="men"   fill="hsl(210,90%,55%)" radius={[4, 4, 0, 0]} name="men" />
                                <Bar dataKey="women" fill="hsl(340,75%,60%)" radius={[4, 4, 0, 0]} name="women" />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        /* Fallback: store-based top products list */
                        <div className="space-y-3">
                            {storeTopProducts.length === 0 ? (
                                <p className="text-sm text-muted-foreground text-center py-6">{tr.noResults}</p>
                            ) : storeTopProducts.map(p => {
                                const photoSrc = getPhotoSrc(p);
                                const gender   = classifyGender(getProductName(p));
                                return (
                                    <div key={p.id as number} className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-xl overflow-hidden bg-primary/10 flex items-center justify-center shrink-0">
                                            {photoSrc
                                                ? <img src={photoSrc} alt="" className="w-full h-full object-cover" />
                                                : <ImagePlus className="h-4 w-4 text-primary/40" />
                                            }
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate">{getProductName(p)}</p>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                                                    gender === "women" ? "bg-pink-500/15 text-pink-400"
                                                        : gender === "men"   ? "bg-blue-500/15 text-blue-400"
                                                            : "bg-muted/30 text-muted-foreground"
                                                }`}>
                                                    {gender === "women" ? "Ayol" : gender === "men" ? "Erkak" : "Unisex"}
                                                </span>
                                                <span className="text-xs text-muted-foreground">{p.salesCount} {tr.sold}</span>
                                            </div>
                                        </div>
                                        <p className="text-sm font-semibold text-primary shrink-0">
                                            {p.price?.toLocaleString()} so'm
                                        </p>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </motion.div>

                {/* ── Recent Orders ── */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="glass rounded-2xl p-5 md:p-6"
                >
                    <div className="flex items-center justify-between mb-5">
                        <h3 className="text-base font-semibold">{tr.recentOrders}</h3>
                        {dashStats && (
                            <span className="text-xs glass rounded-full px-2 py-0.5 text-muted-foreground">
                                {dashStats.new_orders} yangi
                            </span>
                        )}
                    </div>

                    {recentOrders.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-8">{tr.noResults}</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                <tr className="text-muted-foreground text-xs uppercase tracking-wider">
                                    <th className="text-left pb-3 font-medium">ID</th>
                                    <th className="text-left pb-3 font-medium">{tr.customer}</th>
                                    <th className="text-left pb-3 font-medium hidden md:table-cell">
                                            <span className="flex items-center gap-1">
                                                <MapPin className="h-3 w-3" /> Shahar
                                            </span>
                                    </th>
                                    <th className="text-left pb-3 font-medium hidden lg:table-cell">
                                            <span className="flex items-center gap-1">
                                                <Tag className="h-3 w-3" /> Mahsulotlar
                                            </span>
                                    </th>
                                    <th className="text-left pb-3 font-medium hidden md:table-cell">To'lov</th>
                                    <th className="text-right pb-3 font-medium">{tr.orderStatus}</th>
                                </tr>
                                </thead>
                                <tbody>
                                {recentOrders.map(order => {
                                    const orderProductNames = getOrderProductNames(order);
                                    const city = (order as Record<string, unknown>).town_city as string | undefined;
                                    return (
                                        <tr
                                            key={order.id as number}
                                            className="border-t border-border/50 hover:bg-muted/10 transition-colors"
                                        >
                                            <td className="py-3 font-medium text-primary whitespace-nowrap">
                                                #{order.id as number}
                                            </td>
                                            <td className="py-3 whitespace-nowrap">
                                                <p className="font-medium">{order.first_name} {order.last_name}</p>
                                                <p className="text-xs text-muted-foreground">{order.contact}</p>
                                            </td>
                                            <td className="py-3 hidden md:table-cell">
                                                {city ? (
                                                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                                            <MapPin className="h-3 w-3 shrink-0" />
                                                        {city}
                                                        </span>
                                                ) : (
                                                    <span className="text-xs text-muted-foreground/40">—</span>
                                                )}
                                            </td>
                                            <td className="py-3 hidden lg:table-cell max-w-[220px]">
                                                {orderProductNames ? (
                                                    <p className="text-xs text-muted-foreground truncate" title={orderProductNames}>
                                                        {orderProductNames}
                                                    </p>
                                                ) : (
                                                    <span className="text-xs text-muted-foreground/40">—</span>
                                                )}
                                            </td>
                                            <td className="py-3 hidden md:table-cell">
                                                <span className="text-xs glass rounded-full px-2 py-0.5">{order.payment}</span>
                                            </td>
                                            <td className="py-3 text-right">
                                                <Badge
                                                    variant="outline"
                                                    className={statusColors[order.status as string] || "bg-muted text-muted-foreground"}
                                                >
                                                    {order.status as string}
                                                </Badge>
                                            </td>
                                        </tr>
                                    );
                                })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </motion.div>

            </div>
        </AdminLayout>
    );
}