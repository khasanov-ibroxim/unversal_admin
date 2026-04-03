import { AdminLayout } from "@/components/AdminLayout";
import { StatsCard } from "@/components/StatsCard";
import { RecentOrders } from "@/components/RecentOrders";
import { SalesChart } from "@/components/SalesChart";
import { TopProducts } from "@/components/TopProducts";
import { ShoppingCart, Package, Users, DollarSign } from "lucide-react";

const stats = [
    { title: "Jami buyurtmalar", value: "12,846", change: "+12.5%", trend: "up" as const, icon: ShoppingCart },
    { title: "Jami mahsulotlar", value: "3,254", change: "+8.2%", trend: "up" as const, icon: Package },
    { title: "Foydalanuvchilar", value: "48,392", change: "+22.1%", trend: "up" as const, icon: Users },
    { title: "Daromad", value: "2.4 mlrd", change: "+18.7%", trend: "up" as const, icon: DollarSign },
];

const Index = () => {
    return (
        <AdminLayout title="Dashboard">
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
                    <TopProducts />
                </div>

                <RecentOrders />
            </div>
        </AdminLayout>
    );
};

export default Index;
