import { AdminLayout } from "@/components/AdminLayout";
import { motion } from "framer-motion";
import { BarChart3, TrendingUp, Users, Package } from "lucide-react";
import { useStore } from "@/context/StoreContext";
import { useLang } from "@/context/LangContext";
import { Badge } from "@/components/ui/badge";
import type { ApiProduct } from "@/api";

const Analytics = () => {
    const { products, orders } = useStore();
    const { lang } = useLang();

    // Calculate top products by gender
    const getTopProductsByGender = (clothingType: "erkak" | "ayol" | "unisex", limit = 5) => {
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
            .slice(0, limit);
    };

    const getProductName = (p: ApiProduct) => lang === "RU" ? p.name_ru : p.name_eng;

    const topMen = getTopProductsByGender("erkak");
    const topWomen = getTopProductsByGender("ayol");
    const topUnisex = getTopProductsByGender("unisex");

    const genderLabels = {
        erkak: "Erkaklar",
        ayol: "Ayollar",
        unisex: "Unisex"
    };

    const genderColors = {
        erkak: "bg-blue-500/15 text-blue-400 border-blue-500/20",
        ayol: "bg-pink-500/15 text-pink-400 border-pink-500/20",
        unisex: "bg-purple-500/15 text-purple-400 border-purple-500/20"
    };

    const renderTopProducts = (title: string, topProducts: { product: ApiProduct; totalSold: number }[], colorClass: string) => (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-2xl p-6"
        >
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    {title}
                </h3>
                <Badge variant="outline" className={colorClass}>
                    {topProducts.length} mahsulot
                </Badge>
            </div>
            {topProducts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                    <Package className="h-8 w-8 mx-auto mb-2 opacity-40" />
                    Ma'lumot yo'q
                </div>
            ) : (
                <div className="space-y-3">
                    {topProducts.map(({ product, totalSold }, index) => (
                        <div
                            key={product.id}
                            className="glass-subtle rounded-xl p-3 flex items-center gap-3 hover:bg-muted/10 transition-colors"
                        >
                            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/20 text-primary font-bold text-sm">
                                {index + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-medium truncate">{getProductName(product)}</p>
                                <p className="text-xs text-muted-foreground">
                                    {product.price?.toLocaleString()} so'm
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="font-bold text-primary">{totalSold}</p>
                                <p className="text-xs text-muted-foreground">sotildi</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </motion.div>
    );

    return (
        <AdminLayout title="Statistika">
            <div className="space-y-6">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass rounded-2xl p-6"
                >
                    <div className="flex items-center gap-3">
                        <BarChart3 className="h-8 w-8 text-primary" />
                        <div>
                            <h2 className="text-xl font-bold">Top Mahsulotlar</h2>
                            <p className="text-sm text-muted-foreground">Jins bo'yicha eng ko'p sotilgan mahsulotlar</p>
                        </div>
                    </div>
                </motion.div>

                {/* Top Products by Gender */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {renderTopProducts("Top Erkaklar", topMen, genderColors.erkak)}
                    {renderTopProducts("Top Ayollar", topWomen, genderColors.ayol)}
                    {renderTopProducts("Top Unisex", topUnisex, genderColors.unisex)}
                </div>
            </div>
        </AdminLayout>
    );
};

export default Analytics;
