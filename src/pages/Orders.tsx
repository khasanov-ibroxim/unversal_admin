import { AdminLayout } from "@/components/AdminLayout";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import {
    Search, ShoppingCart, Edit, RefreshCw, AlertCircle,
    X, Check, CreditCard, WifiOff, RotateCcw, Filter, Calendar,
    ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
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

// ─── How many times to silently auto-retry on first load ─────────────────────
const AUTO_RETRY_LIMIT = 3;
const AUTO_RETRY_DELAY = 1500; // ms between auto-retries

export default function Orders() {
    const { orders, ordersLoading, ordersError, refreshOrders, updateOrderStatus, confirmOrderPayment, products } = useStore();
    const { tr } = useLang();
    const { success, error: toastError } = useAppToast();

    const [search, setSearch]                     = useState("");
    const [filterStatus, setFilterStatus]         = useState<ApiOrderStatus | "">("");
    const [filterPayment, setFilterPayment]       = useState("");
    const [filterDateFrom, setFilterDateFrom]     = useState("");
    const [filterDateTo, setFilterDateTo]         = useState("");
    const [showAdvancedFilter, setShowAdvancedFilter] = useState(false);
    const [currentPage, setCurrentPage]           = useState(1);
    const [itemsPerPage, setItemsPerPage]         = useState(15);
    const [editOrder, setEditOrder]               = useState<ApiOrder | null>(null);
    const [newStatus, setNewStatus]               = useState<ApiOrderStatus>("yangi");
    const [saving, setSaving]                     = useState(false);
    const [confirmingPayment, setConfirmingPayment] = useState<number | null>(null);

    // Auto-retry state
    const [autoRetryCount, setAutoRetryCount]     = useState(0);
    const [retrying, setRetrying]                 = useState(false);
    const retryTimerRef                           = useRef<ReturnType<typeof setTimeout> | null>(null);

    // ── Auto-retry logic when error occurs ───────────────────────────────────
    useEffect(() => {
        // Clear any pending timer on cleanup
        return () => {
            if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
        };
    }, []);

    useEffect(() => {
        // If there's an error and we haven't exhausted auto-retries, retry silently
        if (ordersError && autoRetryCount < AUTO_RETRY_LIMIT && !ordersLoading) {
            setRetrying(true);
            retryTimerRef.current = setTimeout(async () => {
                setAutoRetryCount(c => c + 1);
                try {
                    await refreshOrders();
                } finally {
                    setRetrying(false);
                }
            }, AUTO_RETRY_DELAY);
        }
        // Reset counter when data loads successfully
        if (!ordersError && orders.length >= 0 && !ordersLoading) {
            setAutoRetryCount(0);
        }
    }, [ordersError, ordersLoading]); // eslint-disable-line react-hooks/exhaustive-deps

    // ── Manual refresh ────────────────────────────────────────────────────────
    const handleManualRefresh = async () => {
        if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
        setAutoRetryCount(0);
        setRetrying(false);
        await refreshOrders();
    };

    // ── Filtering ─────────────────────────────────────────────────────────────
    const filtered = orders
        .filter((o) => {
            const matchSearch =
                String(o.id).includes(search) ||
                o.first_name?.toLowerCase().includes(search.toLowerCase()) ||
                o.last_name?.toLowerCase().includes(search.toLowerCase()) ||
                o.contact?.includes(search);
            const matchStatus = !filterStatus || o.status === filterStatus;
            const matchPayment = !filterPayment || o.payment === filterPayment;

            let matchDateFrom = true;
            let matchDateTo = true;
            if (o.created_at) {
                const orderDate = new Date(o.created_at);
                if (filterDateFrom) {
                    const fromDate = new Date(filterDateFrom);
                    fromDate.setHours(0, 0, 0, 0);
                    matchDateFrom = orderDate >= fromDate;
                }
                if (filterDateTo) {
                    const toDate = new Date(filterDateTo);
                    toDate.setHours(23, 59, 59, 999);
                    matchDateTo = orderDate <= toDate;
                }
            }

            return matchSearch && matchStatus && matchPayment && matchDateFrom && matchDateTo;
        })
        .sort((a, b) => {
            // Sort by created_at descending (newest first)
            const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
            const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
            return dateB - dateA;
        });

    // ── Pagination ────────────────────────────────────────────────────────────
    const totalPages = Math.ceil(filtered.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedOrders = filtered.slice(startIndex, endIndex);

    // Reset to page 1 when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [search, filterStatus, filterPayment, filterDateFrom, filterDateTo]);

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

    // ── Determine if we're in a "failed but retrying" state ──────────────────
    const isAutoRetrying = ordersError && autoRetryCount < AUTO_RETRY_LIMIT && retrying;
    const hasFinalError  = ordersError && autoRetryCount >= AUTO_RETRY_LIMIT && !ordersLoading && !retrying;

    return (
        <AdminLayout title={tr.orders}>
            <div className="space-y-6">

                {/* ── Auto-retry banner (soft, non-blocking) ── */}
                {isAutoRetrying && (
                    <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="glass rounded-xl px-4 py-3 flex items-center gap-3 border border-yellow-500/20 text-yellow-400"
                    >
                        <RotateCcw className="h-4 w-4 shrink-0 animate-spin" />
                        <span className="text-sm">
                            Ma'lumotlar yuklanmadi. Qayta urinilmoqda... ({autoRetryCount}/{AUTO_RETRY_LIMIT})
                        </span>
                    </motion.div>
                )}

                {/* ── Final error banner (after all retries exhausted) ── */}
                {hasFinalError && (
                    <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="glass rounded-xl p-4 border border-red-500/20 flex items-center gap-3 text-red-400"
                    >
                        <WifiOff className="h-5 w-5 shrink-0" />
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium">Serverga ulanib bo'lmadi</p>
                            <p className="text-xs text-red-400/70 mt-0.5 truncate">{ordersError}</p>
                        </div>
                        <button
                            onClick={handleManualRefresh}
                            disabled={ordersLoading}
                            className="glass rounded-lg px-3 py-1.5 text-xs font-medium hover:bg-red-500/20 transition-colors shrink-0 flex items-center gap-1.5"
                        >
                            <RefreshCw className={`h-3.5 w-3.5 ${ordersLoading ? "animate-spin" : ""}`} />
                            Qayta urinish
                        </button>
                    </motion.div>
                )}

                {/* ── Status filter pills ── */}
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

                {/* ── Search + Refresh ── */}
                <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex items-center glass rounded-lg px-3 py-2 gap-2 flex-1 max-w-sm">
                        <Search className="h-4 w-4 text-muted-foreground" />
                        <input
                            placeholder={`${tr.search}...`}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="bg-transparent outline-none text-sm w-full placeholder:text-muted-foreground"
                        />
                        {search && (
                            <button onClick={() => setSearch("")} className="text-muted-foreground hover:text-foreground">
                                <X className="h-3.5 w-3.5" />
                            </button>
                        )}
                    </div>
                    <button
                        onClick={() => setShowAdvancedFilter(!showAdvancedFilter)}
                        className={`glass rounded-lg p-2.5 hover:bg-muted/20 transition-colors ${showAdvancedFilter ? "bg-primary/20" : ""}`}
                        title="Kengaytirilgan filter"
                    >
                        <Filter className="h-4 w-4 text-muted-foreground" />
                    </button>
                    <button
                        onClick={handleManualRefresh}
                        disabled={ordersLoading || retrying}
                        className="glass rounded-lg p-2.5 hover:bg-muted/20 transition-colors disabled:opacity-50"
                        title="Yangilash"
                    >
                        <RefreshCw className={`h-4 w-4 text-muted-foreground ${(ordersLoading || retrying) ? "animate-spin" : ""}`} />
                    </button>
                    {/* Show order count when loaded */}
                    {!ordersLoading && !ordersError && orders.length > 0 && (
                        <span className="text-xs text-muted-foreground glass rounded-lg px-3 py-2">
                            {filtered.length} / {orders.length} buyurtma
                        </span>
                    )}
                </div>

                {/* ── Advanced Filter Panel ── */}
                {showAdvancedFilter && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="glass rounded-xl p-4 space-y-3"
                    >
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-sm font-semibold flex items-center gap-2">
                                <Filter className="h-4 w-4" />
                                Kengaytirilgan filter
                            </h3>
                            <button
                                onClick={() => {
                                    setFilterPayment("");
                                    setFilterDateFrom("");
                                    setFilterDateTo("");
                                    setFilterStatus("");
                                    setSearch("");
                                }}
                                className="text-xs text-muted-foreground hover:text-foreground"
                            >
                                Tozalash
                            </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {/* Payment filter */}
                            <div>
                                <label className="text-xs text-muted-foreground mb-1.5 block">To'lov turi</label>
                                <select
                                    value={filterPayment}
                                    onChange={(e) => setFilterPayment(e.target.value)}
                                    className="w-full glass rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50"
                                >
                                    <option value="">Barchasi</option>
                                    <option value="cash">Naqd</option>
                                    <option value="click">Click</option>
                                    <option value="payme">Payme</option>
                                </select>
                            </div>
                            {/* Date from */}
                            <div>
                                <label className="text-xs text-muted-foreground mb-1.5 block flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    Sanadan
                                </label>
                                <input
                                    type="date"
                                    value={filterDateFrom}
                                    onChange={(e) => setFilterDateFrom(e.target.value)}
                                    className="w-full glass rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50"
                                />
                            </div>
                            {/* Date to */}
                            <div>
                                <label className="text-xs text-muted-foreground mb-1.5 block flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    Sanagacha
                                </label>
                                <input
                                    type="date"
                                    value={filterDateTo}
                                    onChange={(e) => setFilterDateTo(e.target.value)}
                                    className="w-full glass rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50"
                                />
                            </div>
                        </div>
                    </motion.div>
                )}


                {/* ── Table ── */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl overflow-hidden">
                    {(ordersLoading || retrying) && orders.length === 0 ? (
                        /* Skeleton while loading */
                        <div className="p-8 space-y-3">
                            {Array.from({ length: 6 }).map((_, i) => (
                                <div key={i} className="h-12 bg-muted/20 rounded-lg animate-pulse" />
                            ))}
                            <p className="text-center text-xs text-muted-foreground pt-2">
                                {retrying
                                    ? `Qayta urinilmoqda... (${autoRetryCount}/${AUTO_RETRY_LIMIT})`
                                    : "Yuklanmoqda..."}
                            </p>
                        </div>
                    ) : filtered.length === 0 && !hasFinalError ? (
                        <div className="p-12 text-center">
                            <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-40" />
                            <p className="text-muted-foreground">
                                {orders.length === 0 ? "Buyurtmalar yo'q" : tr.noResults}
                            </p>
                        </div>
                    ) : hasFinalError && orders.length === 0 ? (
                        /* Big error state when no cached data */
                        <div className="p-12 text-center">
                            <AlertCircle className="h-12 w-12 text-red-400/50 mx-auto mb-3" />
                            <p className="text-muted-foreground mb-4">Ma'lumotlar yuklanmadi</p>
                            <button
                                onClick={handleManualRefresh}
                                className="glass rounded-xl px-4 py-2 text-sm font-medium hover:bg-primary/20 transition-colors inline-flex items-center gap-2"
                            >
                                <RotateCcw className="h-4 w-4" />
                                Qayta urinish
                            </button>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                <tr className="text-muted-foreground text-xs uppercase tracking-wider border-b border-border/30">
                                    <th className="text-left px-4 py-3 font-medium">ID</th>
                                    <th className="text-left px-4 py-3 font-medium">{tr.customer}</th>
                                    <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Manzil</th>
                                    <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Kontakt</th>
                                    <th className="text-left px-4 py-3 font-medium hidden lg:table-cell">Tovarlar</th>
                                    <th className="text-left px-4 py-3 font-medium hidden lg:table-cell">To'lov</th>
                                    <th className="text-left px-4 py-3 font-medium hidden lg:table-cell">Sana</th>
                                    <th className="text-right px-4 py-3 font-medium hidden xl:table-cell">Summa</th>
                                    <th className="text-right px-4 py-3 font-medium">Status</th>
                                    <th className="text-center px-4 py-3 font-medium">Amallar</th>
                                </tr>
                                </thead>
                                <tbody>
                                {paginatedOrders.map((order, i) => {
                                    const totalItems = order.order_items?.reduce((sum, item) => sum + item.count, 0) || 0;
                                    const totalPrice = order.order_items?.reduce((sum, item) => {
                                        const product = products.find(p => p.id === item.product_id);
                                        return sum + (product?.price || 0) * item.count;
                                    }, 0) || 0;

                                    return (
                                        <motion.tr
                                            key={order.id as number}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ delay: i * 0.02 }}
                                            className="border-t border-border/30 hover:bg-muted/10 transition-colors"
                                        >
                                            <td className="px-4 py-3 font-medium text-primary">
                                                #{order.id as number}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div>
                                                    <p className="font-medium">{order.first_name} {order.last_name}</p>
                                                    <p className="text-xs text-muted-foreground">{order.town_city}, {order.country}</p>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                                                <div className="max-w-[200px]">
                                                    <p className="text-xs truncate" title={order.address}>{order.address}</p>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                                                {order.contact}
                                            </td>
                                            <td className="px-4 py-3 hidden lg:table-cell">
                                                <div className="text-xs">
                                                    {order.order_items && order.order_items.length > 0 ? (
                                                        <div className="space-y-1">
                                                            {order.order_items.slice(0, 2).map((item, idx) => {
                                                                const product = products.find(p => p.id === item.product_id);
                                                                return (
                                                                    <div key={idx} className="text-muted-foreground">
                                                                        {product?.name_uz || `ID: ${item.product_id}`} x{item.count}
                                                                    </div>
                                                                );
                                                            })}
                                                            {order.order_items.length > 2 && (
                                                                <div className="text-primary">+{order.order_items.length - 2} ta</div>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <span className="text-muted-foreground">-</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 hidden lg:table-cell">
                                                <span className="text-xs glass rounded-full px-2 py-1">{order.payment}</span>
                                            </td>
                                            <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">
                                                <div className="text-xs">
                                                    {order.created_at ? (
                                                        <>
                                                            <div>{new Date(order.created_at).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' })}</div>
                                                            <div className="text-muted-foreground/70">{new Date(order.created_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}</div>
                                                        </>
                                                    ) : (
                                                        <span>-</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-right font-medium hidden xl:table-cell">
                                                {totalPrice.toLocaleString()} so'm
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <Badge
                                                    variant="outline"
                                                    className={statusColors[order.status] || "bg-muted text-muted-foreground"}
                                                >
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
                                    );
                                })}
                                </tbody>
                            </table>

                            {/* Stale data warning — show old data but indicate refresh issue */}
                            {hasFinalError && orders.length > 0 && (
                                <div className="px-4 py-3 border-t border-border/30 flex items-center gap-2 text-yellow-400/70">
                                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                                    <p className="text-xs">Eski ma'lumotlar ko'rsatilmoqda. Yangilash tugmasini bosing.</p>
                                </div>
                            )}

                            {/* Pagination */}
                            {filtered.length > 0 && totalPages > 1 && (
                                <div className="px-4 py-3 border-t border-border/30 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-muted-foreground">
                                            {startIndex + 1}-{Math.min(endIndex, filtered.length)} / {filtered.length}
                                        </span>
                                        <select
                                            value={itemsPerPage}
                                            onChange={(e) => {
                                                setItemsPerPage(Number(e.target.value));
                                                setCurrentPage(1);
                                            }}
                                            className="glass rounded-lg px-2 py-1 text-xs outline-none"
                                        >
                                            <option value={10}>10</option>
                                            <option value={15}>15</option>
                                            <option value={20}>20</option>
                                            <option value={50}>50</option>
                                        </select>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={() => setCurrentPage(1)}
                                            disabled={currentPage === 1}
                                            className="glass rounded-lg p-1.5 hover:bg-muted/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                        >
                                            <ChevronsLeft className="h-4 w-4" />
                                        </button>
                                        <button
                                            onClick={() => setCurrentPage(currentPage - 1)}
                                            disabled={currentPage === 1}
                                            className="glass rounded-lg p-1.5 hover:bg-muted/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                        >
                                            <ChevronLeft className="h-4 w-4" />
                                        </button>
                                        <span className="text-xs text-muted-foreground px-3">
                                            {currentPage} / {totalPages}
                                        </span>
                                        <button
                                            onClick={() => setCurrentPage(currentPage + 1)}
                                            disabled={currentPage === totalPages}
                                            className="glass rounded-lg p-1.5 hover:bg-muted/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                        >
                                            <ChevronRight className="h-4 w-4" />
                                        </button>
                                        <button
                                            onClick={() => setCurrentPage(totalPages)}
                                            disabled={currentPage === totalPages}
                                            className="glass rounded-lg p-1.5 hover:bg-muted/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                        >
                                            <ChevronsRight className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </motion.div>
            </div>

            {/* ── Edit Status Modal ── */}
            {editOrder && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={() => setEditOrder(null)}
                    />
                    <div className="relative glass-strong rounded-2xl w-full max-w-sm p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-bold gradient-text">
                                {tr.editOrder} #{editOrder.id as number}
                            </h2>
                            <button
                                onClick={() => setEditOrder(null)}
                                className="glass rounded-lg p-2 hover:bg-red-500/20 transition-colors"
                            >
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
                                <span className="text-muted-foreground">Manzil</span>
                                <span className="text-right max-w-[200px] truncate" title={editOrder.address}>{editOrder.address}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">To'lov turi</span>
                                <span>{editOrder.payment}</span>
                            </div>
                            {editOrder.created_at && (
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Sana</span>
                                    <span>
                                        {new Date(editOrder.created_at).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' })} {new Date(editOrder.created_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            )}
                            {editOrder.order_items && editOrder.order_items.length > 0 && (
                                <div className="pt-2 border-t border-border/30">
                                    <p className="text-muted-foreground mb-2">Buyurtma tovarlari:</p>
                                    <div className="space-y-1.5">
                                        {editOrder.order_items.map((item, idx) => {
                                            const product = products.find(p => p.id === item.product_id);
                                            const itemTotal = (product?.price || 0) * item.count;
                                            return (
                                                <div key={idx} className="flex justify-between text-xs">
                                                    <span>{product?.name_uz || `ID: ${item.product_id}`} x{item.count}</span>
                                                    <span className="font-medium">{itemTotal.toLocaleString()} so'm</span>
                                                </div>
                                            );
                                        })}
                                        <div className="flex justify-between pt-1.5 border-t border-border/30 font-semibold">
                                            <span>Jami:</span>
                                            <span className="text-primary">
                                                {editOrder.order_items.reduce((sum, item) => {
                                                    const product = products.find(p => p.id === item.product_id);
                                                    return sum + (product?.price || 0) * item.count;
                                                }, 0).toLocaleString()} so'm
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}
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
                                style={{
                                    background: "linear-gradient(135deg, hsl(199,89%,48%), hsl(280,60%,55%))",
                                    color: "hsl(225,25%,8%)",
                                }}
                            >
                                {saving
                                    ? <div className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
                                    : null
                                }
                                {tr.save}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}