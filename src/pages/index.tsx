import { AdminLayout } from "@/components/AdminLayout";
import { StatsCard } from "@/components/StatsCard";
import { SalesChart } from "@/components/SalesChart";
import { ShoppingCart, Package, Users, DollarSign } from "lucide-react";
import { useStore } from "@/context/StoreContext";
import { useLang } from "@/context/LangContext";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";

const statusColors: Record<string, string> = {
    delivered: "bg-success/15 text-success border-success/20",
    processing: "bg-primary/15 text-primary border-primary/20",
    shipped: "bg-warning/15 text-warning border-warning/20",
    pending: "bg-muted text-muted-foreground border-muted",
    cancelled: "bg-destructive/15 text-destructive border-destructive/20",
};

export default function Index() {
    const { products, orders, categories } = useStore();
    const { tr, lang } = useLang();

    const totalRevenue = orders.reduce((s, o) => s + o.amount, 0);
    const revenueStr =
        totalRevenue >= 1000 ? `$${(totalRevenue / 1000).toFixed(1)}k` : `$${totalRevenue}`;

    const stats = [
        { title: tr.totalOrders, value: orders.length.toString(), change: "+12.5%", trend: "up" as const, icon: ShoppingCart },
        { title: tr.totalProducts, value: products.length.toString(), change: "+8.2%", trend: "up" as const, icon: Package },
        { title: tr.totalUsers, value: "48,392", change: "+22.1%", trend: "up" as const, icon: Users },
        { title: tr.revenue, value: revenueStr, change: "+18.7%", trend: "up" as const, icon: DollarSign },
    ];

    // top products by order count
    const productSales = products.map((p) => ({
        ...p,
        salesCount: orders.filter((o) => o.productId === p.id).length,
        revenue: orders.filter((o) => o.productId === p.id).reduce((s, o) => s + o.amount, 0),
    })).sort((a, b) => b.salesCount - a.salesCount).slice(0, 5);

    const recentOrders = [...orders].sort((a, b) => b.id.localeCompare(a.id)).slice(0, 6);

    return (
        <AdminLayout title={tr.dashboard}>
            <div className="space-y-6">
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
                        <div className="space-y-4">
                            {productSales.map((p, i) => (
                                <div key={p.id} className="flex items-center gap-3 group">
                                    <div className="h-10 w-10 rounded-xl overflow-hidden bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/10 transition-colors">
                                        {p.images && p.images.length > 0
                                            ? <img src={p.images[0]} alt="" className="w-full h-full object-cover" />
                                            : <Package className="h-4 w-4 text-primary/50" />
                                        }
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate">
                                            {lang === "RU" ? p.nameRu : p.nameEn}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {p.salesCount} {tr.sold}
                                        </p>
                                    </div>
                                    <p className="text-sm font-semibold text-primary shrink-0">${p.revenue}</p>
                                </div>
                            ))}
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
                        <button className="text-xs text-primary hover:underline font-medium">{tr.viewAll}</button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                            <tr className="text-muted-foreground text-xs uppercase tracking-wider">
                                <th className="text-left pb-3 font-medium">{tr.orderId}</th>
                                <th className="text-left pb-3 font-medium">{tr.customer}</th>
                                <th className="text-left pb-3 font-medium hidden md:table-cell">{tr.product}</th>
                                <th className="text-right pb-3 font-medium">{tr.amount}</th>
                                <th className="text-right pb-3 font-medium">{tr.orderStatus}</th>
                            </tr>
                            </thead>
                            <tbody>
                            {recentOrders.map((order) => {
                                const product = products.find((p) => p.id === order.productId);
                                const productName = product ? (lang === "RU" ? product.nameRu : product.nameEn) : order.productId;
                                return (
                                    <tr key={order.id} className="border-t border-border/50 hover:bg-muted/10 transition-colors">
                                        <td className="py-3 font-medium text-primary">{order.id}</td>
                                        <td className="py-3">{order.customer}</td>
                                        <td className="py-3 text-muted-foreground hidden md:table-cell">{productName}</td>
                                        <td className="py-3 text-right font-medium">${order.amount}</td>
                                        <td className="py-3 text-right">
                                            <Badge variant="outline" className={statusColors[order.status]}>
                                                {(tr as any)[order.status]}
                                            </Badge>
                                        </td>
                                    </tr>
                                );
                            })}
                            </tbody>
                        </table>
                    </div>
                </motion.div>
            </div>
        </AdminLayout>
    );
}