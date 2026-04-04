import { AdminLayout } from "@/components/AdminLayout";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { Search, ShoppingCart, Edit } from "lucide-react";
import { useState } from "react";
import { useStore, StoreOrder, OrderStatus } from "@/context/StoreContext";
import { useLang } from "@/context/LangContext";
import { OrderModal } from "@/components/OrderModal";

const statusColors: Record<OrderStatus, string> = {
    delivered: "bg-success/15 text-success border-success/20",
    processing: "bg-primary/15 text-primary border-primary/20",
    shipped: "bg-warning/15 text-warning border-warning/20",
    pending: "bg-muted text-muted-foreground border-muted",
    cancelled: "bg-destructive/15 text-destructive border-destructive/20",
};

const ALL_STATUSES: OrderStatus[] = ["delivered", "processing", "shipped", "pending", "cancelled"];

export default function Orders() {
    const { orders, products } = useStore();
    const { tr, lang } = useLang();

    const [search, setSearch] = useState("");
    const [filterStatus, setFilterStatus] = useState<OrderStatus | "">("");
    const [editOrder, setEditOrder] = useState<StoreOrder | null>(null);
    const [modalOpen, setModalOpen] = useState(false);

    const filtered = orders.filter((o) => {
        const product = products.find((p) => p.id === o.productId);
        const productName = product ? (lang === "RU" ? product.nameRu : product.nameEn) : o.productId;
        const matchSearch =
            o.id.toLowerCase().includes(search.toLowerCase()) ||
            o.customer.toLowerCase().includes(search.toLowerCase()) ||
            productName.toLowerCase().includes(search.toLowerCase());
        const matchStatus = !filterStatus || o.status === filterStatus;
        return matchSearch && matchStatus;
    });

    const openEdit = (o: StoreOrder) => {
        setEditOrder(o);
        setModalOpen(true);
    };

    // Stats
    const stats = ALL_STATUSES.map((s) => ({
        status: s,
        count: orders.filter((o) => o.status === s).length,
    }));

    return (
        <AdminLayout title={tr.orders}>
            <div className="space-y-6">
                {/* Status summary pills */}
                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={() => setFilterStatus("")}
                        className={`glass rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${!filterStatus ? "bg-primary/20 text-primary" : "hover:bg-muted/20"}`}
                    >
                        {tr.allStatuses} ({orders.length})
                    </button>
                    {stats.map((s) => (
                        <button
                            key={s.status}
                            onClick={() => setFilterStatus(filterStatus === s.status ? "" : s.status)}
                            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors border ${
                                filterStatus === s.status
                                    ? statusColors[s.status] + " opacity-100"
                                    : "glass hover:bg-muted/20 border-border/30"
                            }`}
                        >
                            {(tr as any)[s.status]} ({s.count})
                        </button>
                    ))}
                </div>

                {/* Search */}
                <div className="flex items-center glass rounded-lg px-3 py-2 gap-2 w-full sm:w-72">
                    <Search className="h-4 w-4 text-muted-foreground" />
                    <input
                        placeholder={tr.search + "..."}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="bg-transparent outline-none text-sm w-full placeholder:text-muted-foreground"
                    />
                </div>

                {/* Table */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass rounded-2xl overflow-hidden"
                >
                    {filtered.length === 0 ? (
                        <div className="p-12 text-center">
                            <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-40" />
                            <p className="text-muted-foreground">{tr.noResults}</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                <tr className="text-muted-foreground text-xs uppercase tracking-wider border-b border-border/30">
                                    <th className="text-left px-4 py-3 font-medium">{tr.orderId}</th>
                                    <th className="text-left px-4 py-3 font-medium">{tr.customer}</th>
                                    <th className="text-left px-4 py-3 font-medium hidden md:table-cell">{tr.product}</th>
                                    <th className="text-left px-4 py-3 font-medium hidden lg:table-cell">{tr.orderDate}</th>
                                    <th className="text-right px-4 py-3 font-medium">{tr.amount}</th>
                                    <th className="text-center px-4 py-3 font-medium">{tr.orderStatus}</th>
                                    <th className="text-center px-4 py-3 font-medium">{tr.edit}</th>
                                </tr>
                                </thead>
                                <tbody>
                                {filtered.map((order, i) => {
                                    const product = products.find((p) => p.id === order.productId);
                                    const productName = product
                                        ? lang === "RU" ? product.nameRu : product.nameEn
                                        : order.productId;
                                    return (
                                        <motion.tr
                                            key={order.id}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ delay: i * 0.03 }}
                                            className="border-t border-border/30 hover:bg-muted/10 transition-colors"
                                        >
                                            <td className="px-4 py-3 font-medium text-primary">{order.id}</td>
                                            <td className="px-4 py-3">
                                                <div>
                                                    <p className="font-medium">{order.customer}</p>
                                                    <p className="text-xs text-muted-foreground">{order.phone}</p>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                                                <div className="flex items-center gap-2">
                                                    {product && product.images && product.images.length > 0 && (
                                                        <div className="h-7 w-7 rounded overflow-hidden shrink-0">
                                                            <img src={product.images[0]} alt="" className="w-full h-full object-cover" />
                                                        </div>
                                                    )}
                                                    <span className="line-clamp-1">{productName}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell text-xs">{order.date}</td>
                                            <td className="px-4 py-3 text-right font-bold text-primary">${order.amount}</td>
                                            <td className="px-4 py-3 text-center">
                                                <Badge variant="outline" className={statusColors[order.status]}>
                                                    {(tr as any)[order.status]}
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <button
                                                    onClick={() => openEdit(order)}
                                                    className="glass rounded-lg p-2 hover:bg-primary/20 transition-colors"
                                                >
                                                    <Edit className="h-3.5 w-3.5 text-muted-foreground" />
                                                </button>
                                            </td>
                                        </motion.tr>
                                    );
                                })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </motion.div>
            </div>

            <OrderModal open={modalOpen} onClose={() => setModalOpen(false)} order={editOrder} />
        </AdminLayout>
    );
}