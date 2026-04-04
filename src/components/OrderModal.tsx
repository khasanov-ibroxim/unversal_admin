import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { StoreOrder, OrderStatus, useStore } from "@/context/StoreContext";
import { useLang } from "@/context/LangContext";
import { useAppToast } from "@/hooks/use-app-toast";

interface Props {
    open: boolean;
    onClose: () => void;
    order: StoreOrder | null;
}

const STATUSES: OrderStatus[] = ["pending", "processing", "shipped", "delivered", "cancelled"];

export function OrderModal({ open, onClose, order }: Props) {
    const { tr, lang } = useLang();
    const { updateOrder, products } = useStore();
    const { success } = useAppToast();
    const [form, setForm] = useState<StoreOrder | null>(null);

    useEffect(() => {
        if (open && order) setForm({ ...order });
    }, [open, order]);

    if (!open || !form) return null;

    const set = (k: keyof StoreOrder, v: any) => setForm((f) => f ? { ...f, [k]: v } : f);

    const product = products.find((p) => p.id === form.productId);
    const productName = product ? (lang === "RU" ? product.nameRu : product.nameEn) : form.productId;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        updateOrder(form);
        success(tr.orderUpdated);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative glass-strong rounded-2xl w-full max-w-md">
                <div className="flex items-center justify-between px-6 py-4 border-b border-border/30">
                    <h2 className="text-lg font-bold gradient-text">{tr.editOrder} {form.id}</h2>
                    <button onClick={onClose} className="glass rounded-lg p-2 hover:bg-red-500/20 transition-colors">
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="glass-subtle rounded-xl p-4 space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">{tr.customer}</span>
                            <span className="font-medium">{form.customer}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">{tr.product}</span>
                            <span className="font-medium">{productName}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">{tr.amount}</span>
                            <span className="font-bold text-primary">${form.amount}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">{tr.orderDate}</span>
                            <span>{form.date}</span>
                        </div>
                    </div>

                    <div>
                        <label className="text-xs text-muted-foreground mb-1 block">{tr.orderStatus}</label>
                        <select
                            value={form.status}
                            onChange={(e) => set("status", e.target.value as OrderStatus)}
                            className="w-full glass rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/50 bg-black"
                        >
                            {STATUSES.map((s) => (
                                <option key={s} value={s}>{(tr as any)[s]}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="text-xs text-muted-foreground mb-1 block">{tr.customer}</label>
                        <input
                            value={form.customer}
                            onChange={(e) => set("customer", e.target.value)}
                            className="w-full glass rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/50"
                        />
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={onClose}
                                className="flex-1 glass rounded-xl py-3 text-sm font-medium hover:bg-muted/20 transition-colors">
                            {tr.cancel}
                        </button>
                        <button type="submit"
                                className="flex-1 rounded-xl py-3 text-sm font-semibold"
                                style={{ background: "linear-gradient(135deg, hsl(199,89%,48%), hsl(280,60%,55%))", color: "hsl(225,25%,8%)" }}>
                            {tr.save}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}