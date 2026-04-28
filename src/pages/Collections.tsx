import { AdminLayout } from "@/components/AdminLayout";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { Plus, Edit, Trash2, Layers, Search, RefreshCw, AlertCircle, X, Check } from "lucide-react";
import { useState } from "react";
import { useStore } from "@/context/StoreContext";
import { useLang } from "@/context/LangContext";
import { useAppToast } from "@/hooks/use-app-toast";
import { DeleteModal } from "@/components/DeleteModal";
import type { ApiCollection } from "@/api";

interface CollectionFormData {
    name_uz: string;
    name_ru: string;
    name_eng: string;
    is_active: boolean;
}

function CollectionForm({
                            initial,
                            onSave,
                            onCancel,
                            saving,
                        }: {
    initial?: Partial<CollectionFormData>;
    onSave: (data: CollectionFormData) => void;
    onCancel: () => void;
    saving: boolean;
}) {
    const [form, setForm] = useState<CollectionFormData>({
        name_uz: initial?.name_uz || "",
        name_ru: initial?.name_ru || "",
        name_eng: initial?.name_eng || "",
        is_active: initial?.is_active ?? true,
    });

    const set = <K extends keyof CollectionFormData>(k: K, v: CollectionFormData[K]) =>
        setForm((f) => ({ ...f, [k]: v }));

    return (
        <div className="glass-subtle rounded-xl p-4 space-y-3" onClick={(e) => e.stopPropagation()}>
            <div className="grid grid-cols-3 gap-2">
                {(["name_uz", "name_ru", "name_eng"] as const).map((field, i) => (
                    <div key={field}>
                        <label className="text-xs text-muted-foreground mb-1 block">
                            {["Nomi (UZ)", "Nomi (RU)", "Nomi (EN)"][i]}
                        </label>
                        <input
                            value={form[field]}
                            onChange={(e) => set(field, e.target.value)}
                            placeholder={["O'zbek", "Русский", "English"][i]}
                            className="w-full glass rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50"
                        />
                    </div>
                ))}
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
                    <button type="button" onClick={onCancel} className="glass rounded-lg px-3 py-1.5 text-xs hover:bg-muted/20 transition-colors">
                        Bekor
                    </button>
                    <button
                        type="button"
                        onClick={() => onSave(form)}
                        disabled={saving || !form.name_uz || !form.name_ru || !form.name_eng}
                        className="rounded-lg px-3 py-1.5 text-xs font-semibold disabled:opacity-50 flex items-center gap-1.5"
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

export default function Collections() {
    const { collections, products, refreshCollections, addCollection, updateCollection, deleteCollection, collectionsLoading, collectionsError } = useStore();
    const { lang } = useLang();
    const { success, error: toastError } = useAppToast();

    const [search, setSearch] = useState("");
    const [showAddForm, setShowAddForm] = useState(false);
    const [editId, setEditId] = useState<number | null>(null);
    const [deleteCol, setDeleteCol] = useState<ApiCollection | null>(null);
    const [saving, setSaving] = useState(false);

    const getColName = (c: ApiCollection) => lang === "RU" ? c.name_ru : c.name_eng;
    const productCount = (id: number) => products.filter((p) => p.collection_id === id).length;
    const filtered = collections.filter((c) => getColName(c).toLowerCase().includes(search.toLowerCase()));

    const handleAdd = async (data: CollectionFormData) => {
        setSaving(true);
        try {
            await addCollection(data);
            success("Kolleksiya qo'shildi");
            setShowAddForm(false);
        } catch (e: unknown) {
            toastError(e instanceof Error ? e.message : "Xatolik");
        } finally { setSaving(false); }
    };

    const handleUpdate = async (id: number, data: CollectionFormData) => {
        setSaving(true);
        try {
            await updateCollection(id, data);
            success("Kolleksiya yangilandi");
            setEditId(null);
        } catch (e: unknown) {
            toastError(e instanceof Error ? e.message : "Xatolik");
        } finally { setSaving(false); }
    };

    const handleDelete = async () => {
        if (!deleteCol) return;
        try {
            await deleteCollection(deleteCol.id as number);
            success("Kolleksiya o'chirildi");
        } catch (e: unknown) {
            toastError(e instanceof Error ? e.message : "Xatolik");
        } finally { setDeleteCol(null); }
    };

    return (
        <AdminLayout title="Kolleksiyalar">
            <div className="space-y-6">
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center glass rounded-lg px-3 py-2 gap-2 w-64">
                        <Search className="h-4 w-4 text-muted-foreground" />
                        <input
                            placeholder="Kolleksiya qidirish..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="bg-transparent outline-none text-sm w-full placeholder:text-muted-foreground"
                        />
                    </div>
                    <div className="flex gap-2">
                        <button onClick={refreshCollections} className="glass rounded-lg p-2.5 hover:bg-muted/20 transition-colors">
                            <RefreshCw className={`h-4 w-4 text-muted-foreground ${collectionsLoading ? "animate-spin" : ""}`} />
                        </button>
                        <button onClick={() => setShowAddForm(true)} className="glass rounded-lg px-4 py-2.5 flex items-center gap-2 hover:bg-primary/20 transition-colors text-sm font-medium">
                            <Plus className="h-4 w-4" /> Yangi kolleksiya
                        </button>
                    </div>
                </div>

                {collectionsError && (
                    <div className="glass rounded-xl p-4 border border-red-500/20 flex items-center gap-3 text-red-400">
                        <AlertCircle className="h-5 w-5 shrink-0" />
                        <span className="text-sm">{collectionsError}</span>
                        <button onClick={refreshCollections} className="ml-auto text-xs underline">Qayta</button>
                    </div>
                )}

                {showAddForm && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                        <div className="glass rounded-xl p-4">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-sm font-semibold gradient-text">Yangi kolleksiya</h3>
                                <button onClick={() => setShowAddForm(false)} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
                            </div>
                            <CollectionForm onSave={handleAdd} onCancel={() => setShowAddForm(false)} saving={saving} />
                        </div>
                    </motion.div>
                )}

                {collectionsLoading && collections.length === 0 ? (
                    <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="glass rounded-xl h-16 animate-pulse" />)}</div>
                ) : (
                    <div className="space-y-2">
                        {filtered.map((col, i) => (
                            <motion.div key={col.id as number} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} className="glass rounded-xl overflow-hidden">
                                {editId === col.id ? (
                                    <div className="p-4">
                                        <CollectionForm
                                            initial={{ name_uz: col.name_uz, name_ru: col.name_ru, name_eng: col.name_eng, is_active: (col as any).is_active ?? true }}
                                            onSave={(data) => handleUpdate(col.id as number, data)}
                                            onCancel={() => setEditId(null)}
                                            saving={saving}
                                        />
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-4 p-4 hover:bg-muted/10 transition-colors group">
                                        <div className="h-10 w-10 rounded-xl bg-secondary/10 flex items-center justify-center shrink-0">
                                            <Layers className="h-5 w-5 text-secondary/60" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-semibold text-foreground">{getColName(col)}</h3>
                                                <Badge variant="outline" className={(col as any).is_active ? "bg-green-500/20 text-green-400 border-green-500/30 text-[10px]" : "bg-muted/50 text-muted-foreground text-[10px]"}>
                                                    {(col as any).is_active ? "Faol" : "Nofaol"}
                                                </Badge>
                                            </div>
                                            <p className="text-xs text-muted-foreground">ID: {col.id as number} · {productCount(col.id as number)} mahsulot</p>
                                        </div>
                                        <div className="hidden lg:flex gap-4 text-xs text-muted-foreground">
                                            <span>{col.name_uz}</span><span>·</span><span>{col.name_ru}</span>
                                        </div>
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => setEditId(col.id as number)} className="glass rounded-lg p-2 hover:bg-primary/20 transition-colors">
                                                <Edit className="h-3.5 w-3.5 text-muted-foreground" />
                                            </button>
                                            <button onClick={() => setDeleteCol(col)} className="glass rounded-lg p-2 hover:bg-red-500/20 transition-colors">
                                                <Trash2 className="h-3.5 w-3.5 text-red-400" />
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        ))}
                        {filtered.length === 0 && !collectionsLoading && (
                            <div className="glass rounded-2xl p-12 text-center">
                                <Layers className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-40" />
                                <p className="text-muted-foreground">Hech narsa topilmadi</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
            <DeleteModal open={!!deleteCol} title="Kolleksiyani o'chirish" itemName={deleteCol ? getColName(deleteCol) : ""} onConfirm={handleDelete} onClose={() => setDeleteCol(null)} />
        </AdminLayout>
    );
}