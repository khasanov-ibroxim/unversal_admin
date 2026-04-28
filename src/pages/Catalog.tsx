import { AdminLayout } from "@/components/AdminLayout";
import { motion } from "framer-motion";
import { Plus, Trash2, Palette, Ruler, RefreshCw, X, Check } from "lucide-react";
import { useState } from "react";
import { useStore } from "@/context/StoreContext";
import { useAppToast } from "@/hooks/use-app-toast";
import { DeleteModal } from "@/components/DeleteModal";

export default function Catalog() {
    const { colors, sizes, addColor, deleteColor, addSize, deleteSize, refreshColors, refreshSizes } = useStore();
    const { success, error: toastError } = useAppToast();

    const [colorForm, setColorForm] = useState({ name_uz: "", name_ru: "", name_eng: "" });
    const [sizeForm, setSizeForm] = useState({ name: "" });
    const [showColorForm, setShowColorForm] = useState(false);
    const [showSizeForm, setShowSizeForm] = useState(false);
    const [savingColor, setSavingColor] = useState(false);
    const [savingSize, setSavingSize] = useState(false);
    const [deleteColor_, setDeleteColor_] = useState<{ id: number; name: string } | null>(null);
    const [deleteSize_, setDeleteSize_] = useState<{ id: number; name: string } | null>(null);

    const handleAddColor = async () => {
        if (!colorForm.name_uz || !colorForm.name_ru || !colorForm.name_eng) return;
        setSavingColor(true);
        try {
            await addColor(colorForm);
            success("Rang qo'shildi");
            setColorForm({ name_uz: "", name_ru: "", name_eng: "" });
            setShowColorForm(false);
        } catch (e: unknown) {
            toastError(e instanceof Error ? e.message : "Xatolik");
        } finally {
            setSavingColor(false);
        }
    };

    const handleAddSize = async () => {
        if (!sizeForm.name) return;
        setSavingSize(true);
        try {
            await addSize(sizeForm);
            success("O'lcham qo'shildi");
            setSizeForm({ name: "" });
            setShowSizeForm(false);
        } catch (e: unknown) {
            toastError(e instanceof Error ? e.message : "Xatolik");
        } finally {
            setSavingSize(false);
        }
    };

    const handleDeleteColor = async () => {
        if (!deleteColor_) return;
        try {
            await deleteColor(deleteColor_.id);
            success("Rang o'chirildi");
        } catch (e: unknown) {
            toastError(e instanceof Error ? e.message : "Xatolik");
        } finally {
            setDeleteColor_(null);
        }
    };

    const handleDeleteSize = async () => {
        if (!deleteSize_) return;
        try {
            await deleteSize(deleteSize_.id);
            success("O'lcham o'chirildi");
        } catch (e: unknown) {
            toastError(e instanceof Error ? e.message : "Xatolik");
        } finally {
            setDeleteSize_(null);
        }
    };

    return (
        <AdminLayout title="Katalog (Ranglar & O'lchamlar)">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Colors */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-5">
                        <div className="flex items-center gap-2">
                            <Palette className="h-5 w-5 text-primary" />
                            <h2 className="text-base font-semibold">Ranglar</h2>
                            <span className="text-xs glass rounded-full px-2 py-0.5 text-muted-foreground">{colors.length}</span>
                        </div>
                        <div className="flex gap-1">
                            <button onClick={refreshColors} className="glass rounded-lg p-2 hover:bg-muted/20 transition-colors">
                                <RefreshCw className="h-3.5 w-3.5 text-muted-foreground" />
                            </button>
                            <button
                                onClick={() => setShowColorForm(!showColorForm)}
                                className="glass rounded-lg px-3 py-2 flex items-center gap-1.5 hover:bg-primary/20 transition-colors text-xs font-medium"
                            >
                                <Plus className="h-3.5 w-3.5" />
                                Qo'shish
                            </button>
                        </div>
                    </div>

                    {showColorForm && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mb-4">
                            <div className="glass-subtle rounded-xl p-4 space-y-3">
                                <div className="grid grid-cols-3 gap-2">
                                    <input
                                        placeholder="UZ nomi"
                                        value={colorForm.name_uz}
                                        onChange={(e) => setColorForm(f => ({ ...f, name_uz: e.target.value }))}
                                        className="w-full glass rounded-lg px-2 py-2 text-xs outline-none focus:ring-2 focus:ring-primary/50"
                                    />
                                    <input
                                        placeholder="RU nomi"
                                        value={colorForm.name_ru}
                                        onChange={(e) => setColorForm(f => ({ ...f, name_ru: e.target.value }))}
                                        className="w-full glass rounded-lg px-2 py-2 text-xs outline-none focus:ring-2 focus:ring-primary/50"
                                    />
                                    <input
                                        placeholder="EN nomi"
                                        value={colorForm.name_eng}
                                        onChange={(e) => setColorForm(f => ({ ...f, name_eng: e.target.value }))}
                                        className="w-full glass rounded-lg px-2 py-2 text-xs outline-none focus:ring-2 focus:ring-primary/50"
                                    />
                                </div>
                                <div className="flex gap-2 justify-end">
                                    <button onClick={() => setShowColorForm(false)} className="glass rounded-lg px-3 py-1.5 text-xs hover:bg-muted/20">
                                        <X className="h-3 w-3" />
                                    </button>
                                    <button
                                        onClick={handleAddColor}
                                        disabled={savingColor}
                                        className="rounded-lg px-3 py-1.5 text-xs font-semibold flex items-center gap-1 disabled:opacity-50"
                                        style={{ background: "linear-gradient(135deg, hsl(199,89%,48%), hsl(280,60%,55%))", color: "hsl(225,25%,8%)" }}
                                    >
                                        {savingColor ? <div className="h-3 w-3 rounded-full border-2 border-current border-t-transparent animate-spin" /> : <Check className="h-3 w-3" />}
                                        Saqlash
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    <div className="space-y-2 max-h-96 overflow-y-auto">
                        {colors.map((color, i) => (
                            <motion.div
                                key={color.id}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: i * 0.03 }}
                                className="flex items-center gap-3 glass-subtle rounded-lg px-3 py-2.5 group hover:bg-muted/10"
                            >
                                <div className="h-6 w-6 rounded-full bg-gradient-to-br from-primary/30 to-secondary/30 flex items-center justify-center shrink-0">
                                    <Palette className="h-3 w-3 text-primary" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium">{color.name_eng}</p>
                                    <p className="text-xs text-muted-foreground">{color.name_uz} · {color.name_ru}</p>
                                </div>
                                <span className="text-xs text-muted-foreground font-mono">#{color.id}</span>
                                <button
                                    onClick={() => setDeleteColor_({ id: color.id, name: color.name_eng })}
                                    className="opacity-0 group-hover:opacity-100 glass rounded-lg p-1.5 hover:bg-red-500/20 transition-all"
                                >
                                    <Trash2 className="h-3 w-3 text-red-400" />
                                </button>
                            </motion.div>
                        ))}
                        {colors.length === 0 && (
                            <div className="text-center py-8 text-muted-foreground text-sm">Ranglar yo'q</div>
                        )}
                    </div>
                </motion.div>

                {/* Sizes */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-5">
                        <div className="flex items-center gap-2">
                            <Ruler className="h-5 w-5 text-accent" />
                            <h2 className="text-base font-semibold">O'lchamlar</h2>
                            <span className="text-xs glass rounded-full px-2 py-0.5 text-muted-foreground">{sizes.length}</span>
                        </div>
                        <div className="flex gap-1">
                            <button onClick={refreshSizes} className="glass rounded-lg p-2 hover:bg-muted/20 transition-colors">
                                <RefreshCw className="h-3.5 w-3.5 text-muted-foreground" />
                            </button>
                            <button
                                onClick={() => setShowSizeForm(!showSizeForm)}
                                className="glass rounded-lg px-3 py-2 flex items-center gap-1.5 hover:bg-accent/20 transition-colors text-xs font-medium"
                            >
                                <Plus className="h-3.5 w-3.5" />
                                Qo'shish
                            </button>
                        </div>
                    </div>

                    {showSizeForm && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mb-4">
                            <div className="glass-subtle rounded-xl p-4 space-y-3">
                                <input
                                    placeholder="O'lcham nomi (masalan: XL, 42, M)"
                                    value={sizeForm.name}
                                    onChange={(e) => setSizeForm({ name: e.target.value })}
                                    onKeyDown={(e) => e.key === "Enter" && handleAddSize()}
                                    className="w-full glass rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50"
                                />
                                <div className="flex gap-2 justify-end">
                                    <button onClick={() => setShowSizeForm(false)} className="glass rounded-lg px-3 py-1.5 text-xs hover:bg-muted/20">
                                        <X className="h-3 w-3" />
                                    </button>
                                    <button
                                        onClick={handleAddSize}
                                        disabled={savingSize || !sizeForm.name}
                                        className="rounded-lg px-3 py-1.5 text-xs font-semibold flex items-center gap-1 disabled:opacity-50"
                                        style={{ background: "linear-gradient(135deg, hsl(199,89%,48%), hsl(280,60%,55%))", color: "hsl(225,25%,8%)" }}
                                    >
                                        {savingSize ? <div className="h-3 w-3 rounded-full border-2 border-current border-t-transparent animate-spin" /> : <Check className="h-3 w-3" />}
                                        Saqlash
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    <div className="flex flex-wrap gap-2 max-h-96 overflow-y-auto content-start">
                        {sizes.map((size, i) => (
                            <motion.div
                                key={size.id}
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: i * 0.03 }}
                                className="group flex items-center gap-1.5 glass-subtle rounded-lg px-3 py-2 hover:bg-muted/10"
                            >
                                <Ruler className="h-3.5 w-3.5 text-accent" />
                                <span className="text-sm font-medium">{size.name}</span>
                                <span className="text-xs text-muted-foreground">#{size.id}</span>
                                <button
                                    onClick={() => setDeleteSize_({ id: size.id, name: size.name })}
                                    className="opacity-0 group-hover:opacity-100 ml-1 hover:text-red-400 transition-all"
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            </motion.div>
                        ))}
                        {sizes.length === 0 && (
                            <div className="text-center py-8 text-muted-foreground text-sm w-full">O'lchamlar yo'q</div>
                        )}
                    </div>
                </motion.div>
            </div>

            <DeleteModal
                open={!!deleteColor_}
                title="Rangni o'chirish"
                itemName={deleteColor_?.name || ""}
                onConfirm={handleDeleteColor}
                onClose={() => setDeleteColor_(null)}
            />
            <DeleteModal
                open={!!deleteSize_}
                title="O'lchamni o'chirish"
                itemName={deleteSize_?.name || ""}
                onConfirm={handleDeleteSize}
                onClose={() => setDeleteSize_(null)}
            />
        </AdminLayout>
    );
}