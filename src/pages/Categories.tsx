import { AdminLayout } from "@/components/AdminLayout";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { Plus, Edit, Trash2, FolderOpen, Search, RefreshCw, AlertCircle, X, Check } from "lucide-react";
import { useState } from "react";
import { useStore } from "@/context/StoreContext";
import { useLang } from "@/context/LangContext";
import { useAppToast } from "@/hooks/use-app-toast";
import { DeleteModal } from "@/components/DeleteModal";
import type { ApiCategory } from "@/api";

// ─── Inline Category Form ─────────────────────────────────────────────────────
interface CategoryFormData {
    name_uz: string;
    name_ru: string;
    name_eng: string;
    is_active: boolean;
}

function CategoryForm({
    initial,
    onSave,
    onCancel,
    saving,
}: {
    initial?: Partial<CategoryFormData>;
    onSave: (data: CategoryFormData) => void;
    onCancel: () => void;
    saving: boolean;
}) {
    const [form, setForm] = useState<CategoryFormData>({
        name_uz: initial?.name_uz || "",
        name_ru: initial?.name_ru || "",
        name_eng: initial?.name_eng || "",
        is_active: initial?.is_active ?? true,
    });

    const set = <K extends keyof CategoryFormData>(k: K, v: CategoryFormData[K]) =>
        setForm((f) => ({ ...f, [k]: v }));

    return (
        <div className="glass-subtle rounded-xl p-4 space-y-3" onClick={(e) => e.stopPropagation()}>
            <div className="grid grid-cols-3 gap-2">
                <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Nomi (UZ)</label>
                    <input
                        required
                        value={form.name_uz}
                        onChange={(e) => set("name_uz", e.target.value)}
                        placeholder="O'zbek"
                        className="w-full glass rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50"
                    />
                </div>
                <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Nomi (RU)</label>
                    <input
                        required
                        value={form.name_ru}
                        onChange={(e) => set("name_ru", e.target.value)}
                        placeholder="Русский"
                        className="w-full glass rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50"
                    />
                </div>
                <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Nomi (EN)</label>
                    <input
                        required
                        value={form.name_eng}
                        onChange={(e) => set("name_eng", e.target.value)}
                        placeholder="English"
                        className="w-full glass rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50"
                    />
                </div>
            </div>
            <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                        type="checkbox"
                        checked={form.is_active}
                        onChange={(e) => set("is_active", e.target.checked)}
                        className="accent-primary w-4 h-4"
                    />
                    Faol
                </label>
                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="glass rounded-lg px-3 py-1.5 text-xs hover:bg-muted/20 transition-colors"
                    >
                        Bekor
                    </button>
                    <button
                        type="button"
                        onClick={() => onSave(form)}
                        disabled={saving || !form.name_uz || !form.name_ru || !form.name_eng}
                        className="rounded-lg px-3 py-1.5 text-xs font-semibold disabled:opacity-50 flex items-center gap-1.5 transition-all"
                        style={{ background: "linear-gradient(135deg, hsl(199,89%,48%), hsl(280,60%,55%))", color: "hsl(225,25%,8%)" }}
                    >
                        {saving ? <div className="h-3 w-3 rounded-full border-2 border-current border-t-transparent animate-spin" /> : <Check className="h-3 w-3" />}
                        Saqlash
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Categories() {
    const { categories, products, addCategory, updateCategory, deleteCategory, categoriesLoading, categoriesError, refreshCategories } = useStore();
    const { tr, lang } = useLang();
    const { success, error: toastError } = useAppToast();

    const [search, setSearch] = useState("");
    const [showAddForm, setShowAddForm] = useState(false);
    const [editId, setEditId] = useState<number | null>(null);
    const [deleteCat, setDeleteCat] = useState<ApiCategory | null>(null);
    const [saving, setSaving] = useState(false);

    const getCatName = (c: ApiCategory) => lang === "RU" ? c.name_ru : c.name_eng;
    const productCount = (id: number) => products.filter((p) => p.category_id === id).length;

    const filtered = categories.filter((c) => {
        const name = getCatName(c);
        return name.toLowerCase().includes(search.toLowerCase());
    });

    const handleAdd = async (data: CategoryFormData) => {
        setSaving(true);
        try {
            await addCategory(data);
            success(tr.categoryAdded);
            setShowAddForm(false);
        } catch (e: unknown) {
            toastError(e instanceof Error ? e.message : "Xatolik");
        } finally {
            setSaving(false);
        }
    };

    const handleUpdate = async (id: number, data: CategoryFormData) => {
        setSaving(true);
        try {
            await updateCategory(id, data);
            success(tr.categoryUpdated);
            setEditId(null);
        } catch (e: unknown) {
            toastError(e instanceof Error ? e.message : "Xatolik");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteCat) return;
        try {
            await deleteCategory(deleteCat.id as number);
            success(tr.categoryDeleted);
        } catch (e: unknown) {
            toastError(e instanceof Error ? e.message : "O'chirishda xatolik");
        } finally {
            setDeleteCat(null);
        }
    };

    return (
        <AdminLayout title={tr.categories}>
            <div className="space-y-6">
                {/* Toolbar */}
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center glass rounded-lg px-3 py-2 gap-2 w-64">
                        <Search className="h-4 w-4 text-muted-foreground" />
                        <input
                            placeholder={tr.searchCategory}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="bg-transparent outline-none text-sm w-full placeholder:text-muted-foreground"
                        />
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={refreshCategories}
                            className="glass rounded-lg p-2.5 hover:bg-muted/20 transition-colors"
                            title="Yangilash"
                        >
                            <RefreshCw className={`h-4 w-4 text-muted-foreground ${categoriesLoading ? "animate-spin" : ""}`} />
                        </button>
                        <button
                            onClick={() => setShowAddForm(true)}
                            className="glass rounded-lg px-4 py-2.5 flex items-center gap-2 hover:bg-primary/20 transition-colors text-sm font-medium"
                        >
                            <Plus className="h-4 w-4" />
                            {tr.newCategory}
                        </button>
                    </div>
                </div>

                {/* Error */}
                {categoriesError && (
                    <div className="glass rounded-xl p-4 border border-red-500/20 flex items-center gap-3 text-red-400">
                        <AlertCircle className="h-5 w-5 shrink-0" />
                        <span className="text-sm">{categoriesError}</span>
                        <button onClick={refreshCategories} className="ml-auto text-xs underline">Qayta</button>
                    </div>
                )}

                {/* Add form */}
                {showAddForm && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                        <div className="glass rounded-xl p-4">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-sm font-semibold gradient-text">{tr.addCategory}</h3>
                                <button onClick={() => setShowAddForm(false)} className="text-muted-foreground hover:text-foreground">
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                            <CategoryForm onSave={handleAdd} onCancel={() => setShowAddForm(false)} saving={saving} />
                        </div>
                    </motion.div>
                )}

                {/* Loading skeleton */}
                {categoriesLoading && categories.length === 0 ? (
                    <div className="space-y-3">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="glass rounded-xl h-16 animate-pulse" />
                        ))}
                    </div>
                ) : (
                    <div className="space-y-2">
                        {filtered.map((cat, i) => (
                            <motion.div
                                key={cat.id as number}
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.04 }}
                                className="glass rounded-xl overflow-hidden"
                            >
                                {editId === cat.id ? (
                                    <div className="p-4">
                                        <CategoryForm
                                            initial={{
                                                name_uz: cat.name_uz,
                                                name_ru: cat.name_ru,
                                                name_eng: cat.name_eng,
                                                is_active: cat.is_active,
                                            }}
                                            onSave={(data) => handleUpdate(cat.id as number, data)}
                                            onCancel={() => setEditId(null)}
                                            saving={saving}
                                        />
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-4 p-4 hover:bg-muted/10 transition-colors group">
                                        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                                            <FolderOpen className="h-5 w-5 text-primary/60" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-semibold text-foreground">{getCatName(cat)}</h3>
                                                <Badge
                                                    variant="outline"
                                                    className={
                                                        cat.is_active
                                                            ? "bg-green-500/20 text-green-400 border-green-500/30 text-[10px]"
                                                            : "bg-muted/50 text-muted-foreground text-[10px]"
                                                    }
                                                >
                                                    {cat.is_active ? tr.active : tr.inactive}
                                                </Badge>
                                            </div>
                                            <p className="text-xs text-muted-foreground">
                                                ID: {cat.id as number} · {productCount(cat.id as number)} {tr.productsCount}
                                            </p>
                                        </div>
                                        {/* All three names */}
                                        <div className="hidden lg:flex gap-4 text-xs text-muted-foreground">
                                            <span>{cat.name_uz}</span>
                                            <span>·</span>
                                            <span>{cat.name_ru}</span>
                                        </div>
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => setEditId(cat.id as number)}
                                                className="glass rounded-lg p-2 hover:bg-primary/20 transition-colors"
                                                title={tr.edit}
                                            >
                                                <Edit className="h-3.5 w-3.5 text-muted-foreground" />
                                            </button>
                                            <button
                                                onClick={() => setDeleteCat(cat)}
                                                className="glass rounded-lg p-2 hover:bg-red-500/20 transition-colors"
                                                title={tr.delete}
                                            >
                                                <Trash2 className="h-3.5 w-3.5 text-red-400" />
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        ))}

                        {filtered.length === 0 && !categoriesLoading && (
                            <div className="glass rounded-2xl p-12 text-center">
                                <FolderOpen className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-40" />
                                <p className="text-muted-foreground">{tr.noResults}</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <DeleteModal
                open={!!deleteCat}
                title={tr.deleteCategory}
                itemName={deleteCat ? getCatName(deleteCat) : ""}
                onConfirm={handleDelete}
                onClose={() => setDeleteCat(null)}
            />
        </AdminLayout>
    );
}
