import { AdminLayout } from "@/components/AdminLayout";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { Search, ShoppingCart, Edit, RefreshCw, AlertCircle, X, Check, CreditCard } from "lucide-react";
import { useState } from "react";
import { useStore } from "@/context/StoreContext";
import { useLang } from "@/context/LangContext";
import { useAppToast } from "@/hooks/use-app-toast";
import type { ApiOrder, ApiOrderStatus } from "@/api";

const API_STATUSES: ApiOrderStatus[] = [
    "yangi", "to'landi", "jarayonda", "tayyor", "yetkazilmoqda", "yetkazildi", "bekor qilindi",
];

const statusColors: Record<string, string> = {
    "yangi":          "bg-blue-500/15 text-blue-400 border-blue-500/20",
    "to'landi":       "bg-success/15 text-success border-success/20",
    "jarayonda":      "bg-primary/15 text-primary border-primary/20",
    "tayyor":         "bg-accent/15 text-accent border-accent/20",
    "yetkazilmoqda":  "bg-warning/15 text-warning border-warning/20",
    "yetkazildi":     "bg-success/15 text-success border-success/20",
    "bekor qilindi":  "bg-destructive/15 text-destructive border-destructive/20",
};

export default function Orders() {
    const { orders, ordersLoading, ordersError, refreshOrders, updateOrderStatus, confirmOrderPayment } = useStore();
    const { tr } = useLang();
    const { success, error: toastError } = useAppToast();

    const [search, setSearch] = useState("");
    const [filterStatus, setFilterStatus] = useState<ApiOrderStatus | "">("");
    const [editOrder, setEditOrder] = useState<ApiOrder | null>(null);
    const [newStatus, setNewStatus] = useState<ApiOrderStatus>("yangi");
    const [saving, setSaving] = useState(false);
    const [confirmingPayment, setConfirmingPayment] = useState<number | null>(null);

    const filtered = orders.filter((o) => {
        const matchSearch =
            String(o.id).includes(search) ||
            o.first_name?.toLowerCase().includes(search.toLowerCase()) ||
            o.last_name?.toLowerCase().includes(search.toLowerCase()) ||
            o.contact?.includes(search);
        const matchStatus = !filterStatus || o.status === filterStatus;
        return matchSearch && matchStatus;
    });

    const openEdit = (o: ApiOrder) => {
        setEditOrder(o);
        setNewStatus(o.status as ApiOrderStatus);
    };

    const handleStatusUpdate = async () => {
        if (!editOrder) return;
        setSaving(true);
        try {
            await updateOrderStatus(editOrder.id as number, newStatus);
            success(tr.orderUpdated);
            setEditOrder(null);
        } catch (e: unknown) {
            toastError(e instanceof Error ? e.message : "Xatolik");
        } finally {
            setSaving(false);
        }
    };

    const handleConfirmPayment = async (orderId: number) => {
        setConfirmingPayment(orderId);
        try {
            await confirmOrderPayment(orderId);
            success("To'lov tasdiqlandi");
        } catch (e: unknown) {
            toastError(e instanceof Error ? e.message : "Xatolik");
        } finally {
            setConfirmingPayment(null);
        }
    };

    const stats = API_STATUSES.map((s) => ({
        status: s,
        count: orders.filter((o) => o.status === s).length,
    }));

    return (
        <AdminLayout title={tr.orders}>
            <div className="space-y-6">
                {/* Status pills */}
                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={() => setFilterStatus("")}
                        className={`glass rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${!filterStatus ? "bg-primary/20 text-primary" : "hover:bg-muted/20"}`}
                    >
                        {tr.allStatuses} ({orders.length})
                    </button>
                    {stats.filter((s) => s.count > 0).map((s) => (
                        <button
                            key={s.status}
                            onClick={() => setFilterStatus(filterStatus === s.status ? "" : s.status)}
                            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors border ${
                                filterStatus === s.status
                                    ? statusColors[s.status]
                                    : "glass hover:bg-muted/20 border-border/30"
                            }`}
                        >
                            {s.status} ({s.count})
                        </button>
                    ))}
                </div>

                {/* Search + Refresh */}
                <div className="flex items-center gap-3">
                    <div className="flex items-center glass rounded-lg px-3 py-2 gap-2 flex-1 max-w-sm">
                        <Search className="h-4 w-4 text-muted-foreground" />
                        <input
                            placeholder={`${tr.search}...`}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="bg-transparent outline-none text-sm w-full placeholder:text-muted-foreground"
                        />
                    </div>
                    <button
                        onClick={refreshOrders}
                        className="glass rounded-lg p-2.5 hover:bg-muted/20 transition-colors"
                    >
                        <RefreshCw className={`h-4 w-4 text-muted-foreground ${ordersLoading ? "animate-spin" : ""}`} />
                    </button>
                </div>

                {/* Error */}
                {ordersError && (
                    <div className="glass rounded-xl p-4 border border-red-500/20 flex items-center gap-3 text-red-400">
                        <AlertCircle className="h-5 w-5 shrink-0" />
                        <span className="text-sm">{ordersError}</span>
                        <button onClick={refreshOrders} className="ml-auto text-xs underline">Qayta</button>
                    </div>
                )}

                {/* Table */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl overflow-hidden">
                    {ordersLoading && orders.length === 0 ? (
                        <div className="p-8 space-y-3">
                            {Array.from({ length: 6 }).map((_, i) => (
                                <div key={i} className="h-12 bg-muted/20 rounded-lg animate-pulse" />
                            ))}
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="p-12 text-center">
                            <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-40" />
                            <p className="text-muted-foreground">{tr.noResults}</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="text-muted-foreground text-xs uppercase tracking-wider border-b border-border/30">
                                        <th className="text-left px-4 py-3 font-medium">ID</th>
                                        <th className="text-left px-4 py-3 font-medium">{tr.customer}</th>
                                        <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Kontakt</th>
                                        <th className="text-left px-4 py-3 font-medium hidden lg:table-cell">To'lov</th>
                                        <th className="text-right px-4 py-3 font-medium">Status</th>
                                        <th className="text-center px-4 py-3 font-medium">Amallar</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.map((order, i) => (
                                        <motion.tr
                                            key={order.id as number}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ delay: i * 0.03 }}
                                            className="border-t border-border/30 hover:bg-muted/10 transition-colors"
                                        >
                                            <td className="px-4 py-3 font-medium text-primary">#{order.id as number}</td>
                                            <td className="px-4 py-3">
                                                <div>
                                                    <p className="font-medium">{order.first_name} {order.last_name}</p>
                                                    <p className="text-xs text-muted-foreground">{order.town_city}, {order.country}</p>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{order.contact}</td>
                                            <td className="px-4 py-3 hidden lg:table-cell">
                                                <span className="text-xs glass rounded-full px-2 py-1">{order.payment}</span>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <Badge variant="outline" className={statusColors[order.status] || "bg-muted text-muted-foreground"}>
                                                    {order.status}
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <div className="flex items-center justify-center gap-1">
                                                    <button
                                                        onClick={() => openEdit(order)}
                                                        className="glass rounded-lg p-1.5 hover:bg-primary/20 transition-colors"
                                                        title="Statusni o'zgartirish"
                                                    >
                                                        <Edit className="h-3.5 w-3.5 text-muted-foreground" />
                                                    </button>
                                                    {order.status === "yangi" && (
                                                        <button
                                                            onClick={() => handleConfirmPayment(order.id as number)}
                                                            disabled={confirmingPayment === (order.id as number)}
                                                            className="glass rounded-lg p-1.5 hover:bg-success/20 transition-colors"
                                                            title="To'lovni tasdiqlash"
                                                        >
                                                            {confirmingPayment === (order.id as number)
                                                                ? <div className="h-3.5 w-3.5 rounded-full border-2 border-success border-t-transparent animate-spin" />
                                                                : <CreditCard className="h-3.5 w-3.5 text-success" />
                                                            }
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </motion.tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </motion.div>
            </div>

            {/* Edit Status Modal */}
            {editOrder && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setEditOrder(null)} />
                    <div className="relative glass-strong rounded-2xl w-full max-w-sm p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-bold gradient-text">{tr.editOrder} #{editOrder.id as number}</h2>
                            <button onClick={() => setEditOrder(null)} className="glass rounded-lg p-2 hover:bg-red-500/20 transition-colors">
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        <div className="glass-subtle rounded-xl p-4 mb-4 text-sm space-y-2">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">{tr.customer}</span>
                                <span className="font-medium">{editOrder.first_name} {editOrder.last_name}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Kontakt</span>
                                <span>{editOrder.contact}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">To'lov turi</span>
                                <span>{editOrder.payment}</span>
                            </div>
                        </div>

                        <div className="mb-4">
                            <label className="text-xs text-muted-foreground mb-2 block">{tr.orderStatus}</label>
                            <div className="grid grid-cols-2 gap-2">
                                {API_STATUSES.map((s) => (
                                    <button
                                        key={s}
                                        type="button"
                                        onClick={() => setNewStatus(s)}
                                        className={`rounded-lg px-3 py-2 text-xs font-medium transition-all border text-left ${
                                            newStatus === s
                                                ? statusColors[s]
                                                : "glass border-border/30 text-muted-foreground hover:border-primary/40"
                                        }`}
                                    >
                                        {newStatus === s && <Check className="h-3 w-3 inline mr-1" />}
                                        {s}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setEditOrder(null)}
                                className="flex-1 glass rounded-xl py-2.5 text-sm font-medium hover:bg-muted/20 transition-colors"
                            >
                                {tr.cancel}
                            </button>
                            <button
                                onClick={handleStatusUpdate}
                                disabled={saving || newStatus === editOrder.status}
                                className="flex-1 rounded-xl py-2.5 text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
                                style={{ background: "linear-gradient(135deg, hsl(199,89%,48%), hsl(280,60%,55%))", color: "hsl(225,25%,8%)" }}
                            >
                                {saving ? <div className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" /> : null}
                                {tr.save}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
