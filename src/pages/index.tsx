import { AdminLayout } from "@/components/AdminLayout";
import { StatsCard } from "@/components/StatsCard";
import { SalesChart } from "@/components/SalesChart";
import { ShoppingCart, Package, Users, DollarSign } from "lucide-react";
import { useStore } from "@/context/StoreContext";
import { useLang } from "@/context/LangContext";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { ImagePlus } from "lucide-react";
import { BASE_URL } from "@/api";

const statusColors: Record<string, string> = {
    "yangi":          "bg-blue-500/15 text-blue-400 border-blue-500/20",
    "to'landi":       "bg-success/15 text-success border-success/20",
    "jarayonda":      "bg-primary/15 text-primary border-primary/20",
    "tayyor":         "bg-accent/15 text-accent border-accent/20",
    "yetkazilmoqda":  "bg-warning/15 text-warning border-warning/20",
    "yetkazildi":     "bg-success/15 text-success border-success/20",
    "bekor qilindi":  "bg-destructive/15 text-destructive border-destructive/20",
};

export default function Index() {
    const { products, orders, categories } = useStore();
    const { tr, lang } = useLang();

    const stats = [
        { title: tr.totalOrders, value: orders.length.toString(), change: "", trend: "up" as const, icon: ShoppingCart },
        { title: tr.totalProducts, value: products.length.toString(), change: "", trend: "up" as const, icon: Package },
        { title: tr.categories, value: categories.length.toString(), change: "", trend: "up" as const, icon: Users },
        {
            title: tr.revenue,
            value: `${orders.reduce((s, o) => s + (o.price as number || 0), 0).toLocaleString()} so'm`,
            change: "",
            trend: "up" as const,
            icon: DollarSign,
        },
    ];

    // Top products by order count
    const productStats = products
        .map((p) => ({
            ...p,
            salesCount: orders.filter((o) => (o as Record<string, unknown>).product_id === p.id).length,
        }))
        .sort((a, b) => b.salesCount - a.salesCount)
        .slice(0, 5);

    const recentOrders = [...orders]
        .sort((a, b) => (b.id as number) - (a.id as number))
        .slice(0, 8);

    const getProductName = (p: typeof products[0]) => lang === "RU" ? p.name_ru : p.name_eng;
    const getPhotoSrc = (p: typeof products[0]) => {
        const url = (p as { photo_url?: string }).photo_url;
        if (!url) return null;
        return url.startsWith("http") ? url : `${BASE_URL}${url}`;
    };

    return (
        <AdminLayout title={tr.dashboard}>
            <div className="space-y-6">
                {/* Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {stats.map((stat, i) => (
                        <StatsCard key={stat.title} {...stat} index={i} />
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2">
                        <SalesChart />
                    </div>

                    {/* Top Products */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6, duration: 0.4 }}
                        className="glass rounded-2xl p-5 md:p-6"
                    >
                        <h3 className="text-base font-semibold mb-5">{tr.topProducts}</h3>
                        <div className="space-y-3">
                            {productStats.length === 0 ? (
                                <p className="text-sm text-muted-foreground text-center py-6">{tr.noResults}</p>
                            ) : productStats.map((p) => {
                                const photoSrc = getPhotoSrc(p);
                                return (
                                    <div key={p.id as number} className="flex items-center gap-3 group">
                                        <div className="h-10 w-10 rounded-xl overflow-hidden bg-primary/10 flex items-center justify-center shrink-0">
                                            {photoSrc
                                                ? <img src={photoSrc} alt="" className="w-full h-full object-cover" />
                                                : <ImagePlus className="h-4 w-4 text-primary/40" />
                                            }
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate">{getProductName(p)}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {p.salesCount} {tr.sold}
                                            </p>
                                        </div>
                                        <p className="text-sm font-semibold text-primary shrink-0">
                                            {p.price?.toLocaleString()} so'm
                                        </p>
                                    </div>
                                );
                            })}
                        </div>
                    </motion.div>
                </div>

                {/* Recent Orders */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 0.4 }}
                    className="glass rounded-2xl p-5 md:p-6"
                >
                    <div className="flex items-center justify-between mb-5">
                        <h3 className="text-base font-semibold">{tr.recentOrders}</h3>
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
                                    <th className="text-left pb-3 font-medium hidden md:table-cell">Kontakt</th>
                                    <th className="text-left pb-3 font-medium hidden lg:table-cell">To'lov</th>
                                    <th className="text-right pb-3 font-medium">{tr.orderStatus}</th>
                                </tr>
                                </thead>
                                <tbody>
                                {recentOrders.map((order) => (
                                    <tr key={order.id as number} className="border-t border-border/50 hover:bg-muted/10 transition-colors">
                                        <td className="py-3 font-medium text-primary">#{order.id as number}</td>
                                        <td className="py-3">{order.first_name} {order.last_name}</td>
                                        <td className="py-3 text-muted-foreground hidden md:table-cell">{order.contact}</td>
                                        <td className="py-3 hidden lg:table-cell">
                                            <span className="text-xs glass rounded-full px-2 py-0.5">{order.payment}</span>
                                        </td>
                                        <td className="py-3 text-right">
                                            <Badge variant="outline" className={statusColors[order.status] || "bg-muted text-muted-foreground"}>
                                                {order.status}
                                            </Badge>
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </motion.div>
            </div>
        </AdminLayout>
    );
}