import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { StoreCategory, useStore } from "@/context/StoreContext";
import { useLang } from "@/context/LangContext";
import { useAppToast } from "@/hooks/use-app-toast";

interface Props {
    open: boolean;
    onClose: () => void;
    category?: StoreCategory | null;
}

const EMPTY: StoreCategory = {
    id: "",
    nameEn: "",
    nameRu: "",
    descriptionEn: "",
    descriptionRu: "",
    icon: "📁",
    parentId: null,
    status: "active",
};

export function CategoryModal({ open, onClose, category }: Props) {
    const { tr } = useLang();
    const { addCategory, updateCategory, categories } = useStore();
    const { success } = useAppToast();
    const [form, setForm] = useState<StoreCategory>(EMPTY);

    const isEdit = !!category;

    useEffect(() => {
        if (open) {
            setForm(category ? { ...category } : { ...EMPTY, id: `cat-${Date.now()}` });
        }
    }, [open, category]);

    if (!open) return null;

    const set = (k: keyof StoreCategory, v: any) => setForm((f) => ({ ...f, [k]: v }));

    const rootCats = categories.filter((c) => !c.parentId && c.id !== form.id);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (isEdit) {
            updateCategory(form);
            success(tr.categoryUpdated);
        } else {
            addCategory(form);
            success(tr.categoryAdded);
        }
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative glass-strong rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 glass-strong rounded-t-2xl flex items-center justify-between px-6 py-4 border-b border-border/30 z-10">
                    <h2 className="text-lg font-bold gradient-text">
                        {isEdit ? tr.editCategory : tr.addCategory}
                    </h2>
                    <button onClick={onClose} className="glass rounded-lg p-2 hover:bg-red-500/20 transition-colors">
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {/* Icon */}
                    <div>
                        <label className="text-xs text-muted-foreground mb-1 block">{tr.icon}</label>
                        <input
                            value={form.icon}
                            onChange={(e) => set("icon", e.target.value)}
                            className="w-20 glass rounded-xl px-3 py-2.5 text-2xl text-center outline-none focus:ring-2 focus:ring-primary/50"
                        />
                    </div>

                    {/* Names */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs text-muted-foreground mb-1 block">{tr.nameEn}</label>
                            <input
                                required
                                value={form.nameEn}
                                onChange={(e) => set("nameEn", e.target.value)}
                                className="w-full glass rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/50"
                                placeholder="Name in English"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-muted-foreground mb-1 block">{tr.nameRu}</label>
                            <input
                                required
                                value={form.nameRu}
                                onChange={(e) => set("nameRu", e.target.value)}
                                className="w-full glass rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/50"
                                placeholder="Название на русском"
                            />
                        </div>
                    </div>

                    {/* Descriptions */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs text-muted-foreground mb-1 block">{tr.descriptionEn}</label>
                            <textarea
                                rows={2}
                                value={form.descriptionEn}
                                onChange={(e) => set("descriptionEn", e.target.value)}
                                className="w-full glass rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-muted-foreground mb-1 block">{tr.descriptionRu}</label>
                            <textarea
                                rows={2}
                                value={form.descriptionRu}
                                onChange={(e) => set("descriptionRu", e.target.value)}
                                className="w-full glass rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                            />
                        </div>
                    </div>

                    {/* Parent category */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs text-muted-foreground mb-1 block">{tr.parentCategory}</label>
                            <select
                                value={form.parentId ?? ""}
                                onChange={(e) => set("parentId", e.target.value || null)}
                                className="w-full glass rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/50 bg-black"
                            >
                                <option value="">{tr.noParent}</option>
                                {rootCats.map((c) => (
                                    <option key={c.id} value={c.id}>
                                        {c.icon} {c.nameEn}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs text-muted-foreground mb-1 block">{tr.status}</label>
                            <select
                                value={form.status}
                                onChange={(e) => set("status", e.target.value as "active" | "inactive")}
                                className="w-full glass rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/50 bg-black"
                            >
                                <option value="active">{tr.active}</option>
                                <option value="inactive">{tr.inactive}</option>
                            </select>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={onClose}
                                className="flex-1 glass rounded-xl py-3 text-sm font-medium hover:bg-muted/20 transition-colors">
                            {tr.cancel}
                        </button>
                        <button type="submit"
                                className="flex-1 rounded-xl py-3 text-sm font-semibold transition-all"
                                style={{ background: "linear-gradient(135deg, hsl(199,89%,48%), hsl(280,60%,55%))", color: "hsl(225,25%,8%)" }}>
                            {tr.save}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}