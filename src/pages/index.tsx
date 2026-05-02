import { AdminLayout } from "@/components/AdminLayout";
import { StatsCard } from "@/components/StatsCard";
import {
    ShoppingCart, Package, Users, DollarSign,
    TrendingUp, BarChart2, RefreshCw, ImagePlus, MapPin, Tag,
} from "lucide-react";
import { useStore } from "@/context/StoreContext";
import { useLang } from "@/context/LangContext";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { BASE_URL } from "@/api";
import { historyApi, type SalesStats, type AnalyticsV2, type DashboardStats } from "@/api/panel";
import { useEffect, useState, useCallback } from "react";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, Legend, PieChart, Pie, Cell, LineChart, Line,
} from "recharts";
import type { ClothingType } from "@/api/products";

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

const PIE_COLORS = ["hsl(199,89%,48%)", "hsl(280,60%,55%)", "hsl(45,93%,47%)"];

const CLOTHING_LABELS: Record<ClothingType, string> = {
    erkak:  "Erkak",
    ayol:   "Ayol",
    unisex: "Unisex",
};

const CLOTHING_COLORS: Record<ClothingType, { bg: string; text: string; dot: string }> = {
    erkak:  { bg: "bg-blue-500/15",   text: "text-blue-400",   dot: "bg-blue-400"   },
    ayol:   { bg: "bg-pink-500/15",   text: "text-pink-400",   dot: "bg-pink-400"   },
    unisex: { bg: "bg-yellow-500/15", text: "text-yellow-400", dot: "bg-yellow-400" },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtAmount(n: number) {
    if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
    if (n >= 1_000_000)     return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000)         return `${(n / 1_000).toFixed(0)}K`;
    return n.toString();
}

function toDateStr(d: Date) {
    return d.toISOString().slice(0, 10);
}

function getDateRange(days: number) {
    const to   = new Date();
    const from = new Date();
    from.setDate(from.getDate() - days);
    return { date_from: toDateStr(from), date_to: toDateStr(to) };
}

/**
 * Resolve clothing_type from the product record or analytics entry.
 * Falls back to "unisex" if the field is missing/invalid.
 */
function resolveClothingType(raw: string | undefined): ClothingType {
    if (raw === "erkak" || raw === "ayol" || raw === "unisex") return raw;
    return "unisex";
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function Index() {
    const { products, orders, categories } = useStore();
    const { tr, lang } = useLang();

    const [salesStats,   setSalesStats]   = useState<SalesStats | null>(null);
    const [analyticsV2,  setAnalyticsV2]  = useState<AnalyticsV2 | null>(null);
    const [dashStats,    setDashStats]    = useState<DashboardStats | null>(null);
    const [loadingStats, setLoadingStats] = useState(true);
    const [statsError,   setStatsError]   = useState<string | null>(null);
    const [statsRange,   setStatsRange]   = useState<7 | 30>(30);

    const fetchStats = useCallback(async () => {
        setLoadingStats(true);
        setStatsError(null);
        try {
            const range = getDateRange(statsRange);
            const [salesRes, analyticsRes, dashRes] = await Promise.allSettled([
                historyApi.getSalesStats(range),
                historyApi.getAnalyticsV2({ ...range, top_limit: 10 }),
                historyApi.getDashboardStats({ top_limit: 10 }),
            ]);

            setSalesStats(salesRes.status === "fulfilled" && salesRes.value?.ok ? salesRes.value.data : null);
            setAnalyticsV2(analyticsRes.status === "fulfilled" && analyticsRes.value?.ok ? analyticsRes.value.data : null);
            setDashStats(dashRes.status === "fulfilled" && dashRes.value?.ok ? dashRes.value.data : null);

            if (
                salesRes.status === "rejected" &&
                analyticsRes.status === "rejected" &&
                dashRes.status === "rejected"
            ) {
                setStatsError("Statistika serverdan yuklanmadi");
            }
        } catch (e) {
            setStatsError(e instanceof Error ? e.message : "Xatolik yuz berdi");
        } finally {
            setLoadingStats(false);
        }
    }, [statsRange]);

    useEffect(() => { fetchStats(); }, [fetchStats]);

    // ── Stats cards ──────────────────────────────────────────────────────────
    const stats = [
        {
            title: tr.totalOrders,
            value: salesStats ? salesStats.total_orders.toString() : orders.length.toString(),
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
                ? `${fmtAmount(salesStats.sales_amount)} so'm`
                : `${fmtAmount(orders.reduce((s, o) => s + ((o.price as number) || 0), 0))} so'm`,
            change: dashStats ? `Hafta: ${fmtAmount(dashStats.week_sales.revenue)} so'm` : "",
            trend: "up" as const,
            icon: DollarSign,
        },
    ];

    // ── Payment breakdown pie ────────────────────────────────────────────────
    const pieData = salesStats
        ? Object.entries(salesStats.payment_breakdown)
            .map(([key, val]) => ({
                name:   key.charAt(0).toUpperCase() + key.slice(1),
                value:  val?.amount ?? 0,
                orders: val?.orders_count ?? 0,
                items:  val?.items_count ?? 0,
            }))
            .filter(d => d.value > 0)
        : [];

    // ── Top products by gender (using Analytics.tsx logic) ───────────────────
    const getTopProductsByGender = (clothingType: "erkak" | "ayol" | "unisex") => {
        // Filter products by clothing type
        const genderProducts = products.filter(p => p.clothing_type === clothingType);

        // Calculate sales count for each product from orders
        const productSales = genderProducts.map(product => {
            let totalSold = 0;
            orders.forEach(order => {
                if (order.order_items) {
                    order.order_items.forEach(item => {
                        if (item.product_id === product.id) {
                            totalSold += item.count;
                        }
                    });
                }
            });
            return { product, totalSold };
        });

        // Sort by total sold and get top N
        return productSales
            .filter(p => p.totalSold > 0)
            .sort((a, b) => b.totalSold - a.totalSold)
            .slice(0, 8);
    };

    const topMenProducts = getTopProductsByGender("erkak");
    const topWomenProducts = getTopProductsByGender("ayol");
    const topUnisexProducts = getTopProductsByGender("unisex");

    // Combine all for chart
    const allTopProducts = [...topMenProducts, ...topWomenProducts, ...topUnisexProducts]
        .sort((a, b) => b.totalSold - a.totalSold)
        .slice(0, 8);

    const enrichedTopProducts = allTopProducts.map(tp => {
        const productName = lang === "RU" ? tp.product.name_ru : tp.product.name_eng;
        const label = productName.length > 14 ? productName.slice(0, 14) + "…" : productName;
        const clothingType = resolveClothingType(tp.product.clothing_type as string | undefined);

        return {
            name:         label,
            fullName:     productName,
            men:          clothingType === "erkak"  ? tp.totalSold : 0,
            women:        clothingType === "ayol"   ? tp.totalSold : 0,
            unisex:       clothingType === "unisex" ? tp.totalSold : 0,
            revenue:      tp.product.price * tp.totalSold,
            clothingType,
        };
    });

    const totalMen    = enrichedTopProducts.reduce((s, d) => s + d.men,    0);
    const totalWomen  = enrichedTopProducts.reduce((s, d) => s + d.women,  0);
    const totalUnisex = enrichedTopProducts.reduce((s, d) => s + d.unisex, 0);
    const totalAll    = Math.max(totalMen + totalWomen + totalUnisex, 1);
    const hasAnyData  = totalMen + totalWomen + totalUnisex > 0;

    // ── Fallback store-based top products ────────────────────────────────────
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

    const getOrderProductNames = (order: typeof orders[0]) => {
        const items = (order as Record<string, unknown>).order_items as
            { product_id?: number; count?: number }[] | undefined;
        if (!items?.length) return null;
        return items
            .map(item => {
                const prod = products.find(p => p.id === item.product_id);
                if (!prod) return null;
                return `${getProductName(prod)}${item.count && item.count > 1 ? ` ×${item.count}` : ""}`;
            })
            .filter(Boolean)
            .join(", ");
    };

    /**
     * Calculate total sum of an order:
     * sum over order_items of (product.price * item.count)
     */
    const getOrderTotal = (order: typeof orders[0]): number | null => {
        const items = (order as Record<string, unknown>).order_items as
            { product_id?: number; product_item_id?: number; count?: number }[] | undefined;
        if (!items?.length) return null;
        let total = 0;
        let allFound = true;
        for (const item of items) {
            const prod = products.find(p => p.id === item.product_id);
            if (!prod) { allFound = false; continue; }
            total += (prod.price ?? 0) * (item.count ?? 1);
        }
        return allFound || total > 0 ? total : null;
    };

    // ── Sales-by-day chart ────────────────────────────────────────────────────
    const salesByDay = (analyticsV2?.sales_by_day ?? []).slice(-14).map(d => ({
        date:    d.date.slice(5),
        revenue: d.revenue,
        orders:  d.orders_count,
    }));

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

                    {/* Sales summary */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="glass rounded-2xl p-5 md:p-6 lg:col-span-2"
                    >
                        <div className="flex items-center justify-between mb-5">
                            <div className="flex items-center gap-2">
                                <TrendingUp className="h-4 w-4 text-primary" />
                                <h3 className="text-base font-semibold">{tr.salesStatistics}</h3>
                            </div>
                            <div className="flex items-center gap-2">
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
                                            {d} {tr.days}
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
                                    { label: tr.totalOrdersLabel,  value: salesStats.total_orders.toLocaleString(),          icon: ShoppingCart, color: "text-blue-400"  },
                                    { label: tr.paidLabel,      value: salesStats.paid_orders.toLocaleString(),           icon: DollarSign,   color: "text-green-400" },
                                    { label: tr.soldItemsLabel,  value: salesStats.sold_items_count.toLocaleString(),      icon: Package,      color: "text-accent"    },
                                    { label: tr.salesAmountLabel,  value: `${fmtAmount(salesStats.sales_amount)} ${tr.sum}`,      icon: TrendingUp,   color: "text-primary"   },
                                ].map(card => (
                                    <div key={card.label} className="glass-subtle rounded-xl p-4 flex flex-col gap-2">
                                        <card.icon className={`h-4 w-4 ${card.color}`} />
                                        <p className={`text-lg font-bold ${card.color}`}>{card.value}</p>
                                        <p className="text-xs text-muted-foreground">{card.label}</p>
                                    </div>
                                ))}
                            </div>
                        ) : statsError ? (
                            <p className="text-sm text-red-400/80 text-center py-6">{statsError}</p>
                        ) : (
                            <p className="text-sm text-muted-foreground text-center py-6">Statistika mavjud emas</p>
                        )}

                        {analyticsV2 && (
                            <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-3">
                                <div className="glass-subtle rounded-xl p-3">
                                    <p className="text-xs text-muted-foreground">{tr.averageCheck}</p>
                                    <p className="text-sm font-semibold text-primary mt-1">
                                        {typeof analyticsV2.average_check === 'number'
                                            ? `${fmtAmount(analyticsV2.average_check)} ${tr.sum}`
                                            : `0 ${tr.sum}`
                                        }
                                    </p>
                                </div>
                                <div className="glass-subtle rounded-xl p-3">
                                    <p className="text-xs text-muted-foreground">{tr.repeatSales}</p>
                                    <p className="text-sm font-semibold text-accent mt-1">
                                        {analyticsV2.repeat_sales?.repeat_count ?? 0} ta
                                        <span className="text-xs text-muted-foreground ml-1">
                                            ({((analyticsV2.repeat_sales?.repeat_rate ?? 0) * 100).toFixed(1)}%)
                                        </span>
                                    </p>
                                </div>
                                <div className="glass-subtle rounded-xl p-3">
                                    <p className="text-xs text-muted-foreground">LTV</p>
                                    <p className="text-sm font-semibold text-yellow-400 mt-1">
                                        {typeof analyticsV2.ltv === 'number'
                                            ? `${fmtAmount(analyticsV2.ltv)} ${tr.sum}`
                                            : `0 ${tr.sum}`
                                        }
                                    </p>
                                </div>
                            </div>
                        )}

                        {dashStats && (
                            <div className="mt-3 grid grid-cols-2 gap-3">
                                <div className="glass-subtle rounded-xl p-3 flex items-center gap-3">
                                    <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
                                        <BarChart2 className="h-4 w-4 text-primary" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">{tr.today}</p>
                                        <p className="text-sm font-semibold">{fmtAmount(dashStats.today_sales.revenue)} {tr.sum}</p>
                                        <p className="text-xs text-muted-foreground">{dashStats.today_sales.orders_count} {tr.orders.toLowerCase()}</p>
                                    </div>
                                </div>
                                <div className="glass-subtle rounded-xl p-3 flex items-center gap-3">
                                    <div className="h-8 w-8 rounded-lg bg-accent/20 flex items-center justify-center shrink-0">
                                        <TrendingUp className="h-4 w-4 text-accent" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">{tr.thisWeek}</p>
                                        <p className="text-sm font-semibold">{fmtAmount(dashStats.week_sales.revenue)} {tr.sum}</p>
                                        <p className="text-xs text-muted-foreground">{dashStats.week_sales.orders_count} {tr.orders.toLowerCase()}</p>
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
                        <h3 className="text-base font-semibold mb-4">{tr.paymentTypes}</h3>
                        {loadingStats ? (
                            <div className="flex items-center justify-center h-40">
                                <RefreshCw className="h-5 w-5 text-muted-foreground animate-spin" />
                            </div>
                        ) : pieData.length > 0 ? (
                            <>
                                <ResponsiveContainer width="100%" height={160}>
                                    <PieChart>
                                        <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                                            {pieData.map((_, idx) => (
                                                <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            formatter={(v: number) => [`${fmtAmount(v)} so'm`, "Summa"]}
                                            contentStyle={{ background: "hsl(225,25%,12%)", border: "1px solid hsl(225,25%,22%)", borderRadius: 8, fontSize: 12 }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="space-y-2 mt-2">
                                    {pieData.map((d, idx) => (
                                        <div key={d.name} className="flex items-center justify-between text-xs">
                                            <div className="flex items-center gap-2">
                                                <div className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: PIE_COLORS[idx % PIE_COLORS.length] }} />
                                                <span className="text-muted-foreground">{d.name}</span>
                                            </div>
                                            <div className="text-right">
                                                <span className="font-medium">{d.orders} buyurtma</span>
                                                <span className="text-muted-foreground ml-2">{fmtAmount(d.value)} so'm</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        ) : (
                            <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">Ma'lumot yo'q</div>
                        )}
                    </motion.div>
                </div>

                {/* ── Sales by day chart ── */}
                {salesByDay.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.32 }}
                        className="glass rounded-2xl p-5 md:p-6"
                    >
                        <h3 className="text-base font-semibold mb-4">{tr.dailySalesDynamics}</h3>
                        <ResponsiveContainer width="100%" height={200}>
                            <BarChart data={salesByDay} barCategoryGap="30%">
                                <CartesianGrid strokeDasharray="3 3" stroke="hsl(225,25%,18%)" vertical={false} />
                                <XAxis dataKey="date" tick={{ fill: "hsl(215,20%,55%)", fontSize: 10 }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fill: "hsl(215,20%,55%)", fontSize: 10 }} axisLine={false} tickLine={false} width={38} tickFormatter={fmtAmount} />
                                <Tooltip
                                    contentStyle={{ background: "hsl(225,25%,12%)", border: "1px solid hsl(225,25%,22%)", borderRadius: 8, fontSize: 12 }}
                                    formatter={(v: number, name: string) => [
                                        name === "revenue" ? `${fmtAmount(v)} so'm` : `${v} ta`,
                                        name === "revenue" ? "Sotuv" : "Buyurtma",
                                    ]}
                                />
                                <Bar dataKey="revenue" fill="hsl(199,89%,48%)" radius={[4, 4, 0, 0]} name="revenue" />
                            </BarChart>
                        </ResponsiveContainer>
                    </motion.div>
                )}

                {/* ── Top products — Jins bo'yicha tahlil ── */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35 }}
                    className="glass rounded-2xl p-5 md:p-6"
                >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
                        <div>
                            <h3 className="text-base font-semibold">{tr.topProducts} — {tr.genderAnalysis}</h3>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                {tr.menWomenUnisex}
                            </p>
                        </div>
                        {/* Gender ratio pills */}
                        <div className="flex flex-wrap items-center gap-2 shrink-0">
                            {(["erkak", "ayol", "unisex"] as ClothingType[]).map(ct => {
                                const counts: Record<ClothingType, number> = { erkak: totalMen, ayol: totalWomen, unisex: totalUnisex };
                                const pct = hasAnyData ? Math.round((counts[ct] / totalAll) * 100) : null;
                                const c = CLOTHING_COLORS[ct];
                                return (
                                    <div key={ct} className="flex items-center gap-1.5 glass-subtle rounded-full px-3 py-1">
                                        <div className={`h-2 w-2 rounded-full ${c.dot}`} />
                                        <span className={`text-xs font-medium ${c.text}`}>{CLOTHING_LABELS[ct]}</span>
                                        <span className="text-xs text-muted-foreground">
                                            {pct !== null ? `${pct}%` : "—"}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {enrichedTopProducts.length > 0 ? (
                        <ResponsiveContainer width="100%" height={240}>
                            <LineChart data={enrichedTopProducts}>
                                <CartesianGrid strokeDasharray="3 3" stroke="hsl(225,25%,18%)" vertical={false} />
                                <XAxis dataKey="name" tick={{ fill: "hsl(215,20%,55%)", fontSize: 11 }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fill: "hsl(215,20%,55%)", fontSize: 11 }} axisLine={false} tickLine={false} width={30} />
                                <Tooltip
                                    contentStyle={{ background: "hsl(225,25%,12%)", border: "1px solid hsl(225,25%,22%)", borderRadius: 8, fontSize: 12 }}
                                    cursor={{ stroke: "hsl(225,25%,30%)", strokeWidth: 1 }}
                                    formatter={(val: number, name: string) => [
                                        `${val} dona`,
                                        name === "men" ? "Erkak" : name === "women" ? "Ayol" : "Unisex",
                                    ]}
                                    labelFormatter={(label) => {
                                        const item = enrichedTopProducts.find(d => d.name === label);
                                        return item?.fullName ?? label;
                                    }}
                                />
                                <Legend
                                    formatter={(value) => value === "men" ? "Erkak" : value === "women" ? "Ayol" : "Unisex"}
                                    wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
                                />
                                <Line type="monotone" dataKey="men" stroke="hsl(210,90%,55%)" strokeWidth={2} dot={{ fill: "hsl(210,90%,55%)", r: 4 }} activeDot={{ r: 6 }} name="men" />
                                <Line type="monotone" dataKey="women" stroke="hsl(340,75%,60%)" strokeWidth={2} dot={{ fill: "hsl(340,75%,60%)", r: 4 }} activeDot={{ r: 6 }} name="women" />
                                <Line type="monotone" dataKey="unisex" stroke="hsl(45,93%,47%)" strokeWidth={2} dot={{ fill: "hsl(45,93%,47%)", r: 4 }} activeDot={{ r: 6 }} name="unisex" />
                            </LineChart>
                        </ResponsiveContainer>
                    ) : loadingStats ? (
                        <div className="h-40 flex items-center justify-center">
                            <RefreshCw className="h-5 w-5 text-muted-foreground animate-spin" />
                        </div>
                    ) : (
                        /* Fallback: store-based top products list */
                        <div className="space-y-3">
                            {storeTopProducts.length === 0 ? (
                                <p className="text-sm text-muted-foreground text-center py-6">{tr.noResults}</p>
                            ) : storeTopProducts.map(p => {
                                const photoSrc = getPhotoSrc(p);
                                const ct = resolveClothingType(p.clothing_type as string | undefined);
                                const c = CLOTHING_COLORS[ct];
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
                                                <span className={`text-xs px-1.5 py-0.5 rounded-full ${c.bg} ${c.text}`}>
                                                    {CLOTHING_LABELS[ct]}
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
                                {dashStats.new_orders} {tr.newOrders}
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
                                        <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {tr.city}</span>
                                    </th>
                                    <th className="text-left pb-3 font-medium hidden lg:table-cell">
                                        <span className="flex items-center gap-1"><Tag className="h-3 w-3" /> {tr.productsLabel}</span>
                                    </th>
                                    <th className="text-left pb-3 font-medium hidden md:table-cell">{tr.payment}</th>
                                    {/* NEW: Total sum column */}
                                    <th className="text-right pb-3 font-medium hidden sm:table-cell">
                                            <span className="flex items-center justify-end gap-1">
                                                <DollarSign className="h-3 w-3" /> {tr.amount}
                                            </span>
                                    </th>
                                    <th className="text-right pb-3 font-medium">{tr.orderStatus}</th>
                                </tr>
                                </thead>
                                <tbody>
                                {recentOrders.map(order => {
                                    const orderProductNames = getOrderProductNames(order);
                                    const city = (order as Record<string, unknown>).town_city as string | undefined;
                                    const total = getOrderTotal(order);
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
                                                            <MapPin className="h-3 w-3 shrink-0" />{city}
                                                        </span>
                                                ) : (
                                                    <span className="text-xs text-muted-foreground/40">—</span>
                                                )}
                                            </td>
                                            <td className="py-3 hidden lg:table-cell max-w-[200px]">
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
                                            {/* Total sum */}
                                            <td className="py-3 hidden sm:table-cell text-right">
                                                {total !== null ? (
                                                    <span className="text-sm font-semibold text-primary whitespace-nowrap">
                                                            {total.toLocaleString()} so'm
                                                        </span>
                                                ) : (
                                                    <span className="text-xs text-muted-foreground/40">—</span>
                                                )}
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