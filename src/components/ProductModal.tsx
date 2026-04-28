import { useState, useEffect } from "react";
import { X, ChevronDown, ChevronUp } from "lucide-react";
import { useLang } from "@/context/LangContext";
import { useStore } from "@/context/StoreContext";
import { useAppToast } from "@/hooks/use-app-toast";
import { productsApi, productPhotosApi, type ApiProduct } from "@/api";

interface Props {
    open: boolean;
    onClose: () => void;
    product?: ApiProduct | null;
}

const makeEmpty = () => ({
    category_id: "" as unknown as number,
    collection_id: "" as unknown as number,
    name_uz: "",
    name_ru: "",
    name_eng: "",
    description_uz: "",
    description_ru: "",
    description_eng: "",
    price: 0,
    is_active: true,
});

export function ProductModal({ open, onClose, product }: Props) {
    const { tr, lang } = useLang();
    const { categories, collections, refreshProducts } = useStore();
    const { success, error: toastError } = useAppToast();

    const [form, setForm] = useState(makeEmpty());
    const [photoFile, setPhotoFile] = useState<File | null>(null);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [sections, setSections] = useState({ info: true, pricing: true, photo: true });

    const isEdit = !!product;

    useEffect(() => {
        if (open) {
            if (product) {
                setForm({
                    category_id: product.category_id as number,
                    collection_id: product.collection_id as number,
                    name_uz: product.name_uz,
                    name_ru: product.name_ru,
                    name_eng: product.name_eng,
                    description_uz: product.description_uz,
                    description_ru: product.description_ru,
                    description_eng: product.description_eng,
                    price: product.price,
                    is_active: product.is_active,
                });
            } else {
                setForm(makeEmpty());
            }
            setPhotoFile(null);
            setPhotoPreview(null);
        }
    }, [open, product]);

    if (!open) return null;

    const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
        setForm((f) => ({ ...f, [k]: v }));

    const toggleSection = (s: keyof typeof sections) =>
        setSections((p) => ({ ...p, [s]: !p[s] }));

    const handlePhotoChange = (file: File | null) => {
        setPhotoFile(file);
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => setPhotoPreview(e.target?.result as string);
            reader.readAsDataURL(file);
        } else {
            setPhotoPreview(null);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            if (isEdit) {
                // PATCH existing product
                await productsApi.update(product!.id as number, {
                    ...form,
                    photo: photoFile || undefined,
                });
                // Upload extra photo separately if needed
                if (photoFile) {
                    try {
                        await productPhotosApi.create(product!.id as number, photoFile);
                    } catch {
                        // photo already set via PATCH, ignore
                    }
                }
                success(tr.productUpdated);
            } else {
                // POST new product
                await productsApi.create({
                    ...form,
                    photo: photoFile || undefined,
                });
                success(tr.productAdded);
            }
            await refreshProducts();
            onClose();
        } catch (err: unknown) {
            toastError(err instanceof Error ? err.message : "Xatolik yuz berdi");
        } finally {
            setSaving(false);
        }
    };

    const Sec = ({ label, k }: { label: string; k: keyof typeof sections }) => (
        <button
            type="button"
            onClick={() => toggleSection(k)}
            className="w-full flex items-center justify-between py-2.5 text-xs font-semibold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
        >
            <span>{label}</span>
            {sections[k] ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </button>
    );

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative glass-strong rounded-2xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-border/30 shrink-0">
                    <h2 className="text-lg font-bold gradient-text">
                        {isEdit ? tr.editProduct : tr.addProduct}
                    </h2>
                    <button onClick={onClose} className="glass rounded-lg p-2 hover:bg-red-500/20 transition-colors">
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 px-6 py-2">

                    {/* ── PHOTO ── */}
                    <Sec label="Rasm" k="photo" />
                    {sections.photo && (
                        <div className="pb-5">
                            <div
                                className="border-2 border-dashed rounded-xl p-5 flex flex-col items-center gap-2 cursor-pointer hover:border-primary/50 transition-colors"
                                onClick={() => document.getElementById("product-photo-input")?.click()}
                            >
                                {photoPreview ? (
                                    <img src={photoPreview} alt="" className="h-40 object-contain rounded-lg" />
                                ) : (
                                    <div className="text-sm text-muted-foreground text-center py-4">
                                        Rasm tanlash uchun bosing
                                        <p className="text-xs mt-1">PNG, JPG, WEBP</p>
                                    </div>
                                )}
                                <input
                                    id="product-photo-input"
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => handlePhotoChange(e.target.files?.[0] || null)}
                                />
                            </div>
                            {photoFile && (
                                <button
                                    type="button"
                                    onClick={() => handlePhotoChange(null)}
                                    className="mt-2 text-xs text-red-400 hover:text-red-300"
                                >
                                    Rasmni olib tashlash
                                </button>
                            )}
                        </div>
                    )}

                    {/* ── INFO ── */}
                    <div className="border-t border-border/20">
                        <Sec label={`${tr.name} & ${tr.description}`} k="info" />
                    </div>
                    {sections.info && (
                        <div className="pb-5 space-y-3">
                            <div className="grid grid-cols-3 gap-3">
                                <div>
                                    <label className="text-xs text-muted-foreground mb-1 block">Nomi (UZ)</label>
                                    <input
                                        required
                                        value={form.name_uz}
                                        onChange={(e) => set("name_uz", e.target.value)}
                                        placeholder="O'zbek tilida"
                                        className="w-full glass rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/50"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-muted-foreground mb-1 block">{tr.nameRu}</label>
                                    <input
                                        required
                                        value={form.name_ru}
                                        onChange={(e) => set("name_ru", e.target.value)}
                                        placeholder="На русском"
                                        className="w-full glass rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/50"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-muted-foreground mb-1 block">{tr.nameEn}</label>
                                    <input
                                        required
                                        value={form.name_eng}
                                        onChange={(e) => set("name_eng", e.target.value)}
                                        placeholder="In English"
                                        className="w-full glass rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/50"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-3">
                                <div>
                                    <label className="text-xs text-muted-foreground mb-1 block">Tavsif (UZ)</label>
                                    <textarea
                                        rows={3}
                                        value={form.description_uz}
                                        onChange={(e) => set("description_uz", e.target.value)}
                                        className="w-full glass rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-muted-foreground mb-1 block">{tr.descriptionRu}</label>
                                    <textarea
                                        rows={3}
                                        value={form.description_ru}
                                        onChange={(e) => set("description_ru", e.target.value)}
                                        className="w-full glass rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-muted-foreground mb-1 block">{tr.descriptionEn}</label>
                                    <textarea
                                        rows={3}
                                        value={form.description_eng}
                                        onChange={(e) => set("description_eng", e.target.value)}
                                        className="w-full glass rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── PRICING ── */}
                    <div className="border-t border-border/20">
                        <Sec label={`${tr.price} · ${tr.status} · ${tr.category}`} k="pricing" />
                    </div>
                    {sections.pricing && (
                        <div className="pb-5 space-y-3">
                            <div className="grid grid-cols-3 gap-3">
                                <div>
                                    <label className="text-xs text-muted-foreground mb-1 block">{tr.price} (so'm)</label>
                                    <input
                                        type="number"
                                        required
                                        min={0}
                                        value={form.price}
                                        onChange={(e) => set("price", Number(e.target.value))}
                                        className="w-full glass rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/50"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-muted-foreground mb-1 block">{tr.category}</label>
                                    <select
                                        required
                                        value={form.category_id || ""}
                                        onChange={(e) => set("category_id", Number(e.target.value))}
                                        className="w-full glass rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/50 bg-black"
                                    >
                                        <option value="">{tr.selectCategory}</option>
                                        {categories.map((c) => (
                                            <option key={c.id} value={c.id}>
                                                {lang === "RU" ? c.name_ru : c.name_eng}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs text-muted-foreground mb-1 block">Kolleksiya</label>
                                    <select
                                        required
                                        value={form.collection_id || ""}
                                        onChange={(e) => set("collection_id", Number(e.target.value))}
                                        className="w-full glass rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/50 bg-black"
                                    >
                                        <option value="">Kolleksiya tanlang</option>
                                        {collections.map((c) => (
                                            <option key={c.id} value={c.id}>
                                                {lang === "RU" ? c.name_ru : c.name_eng}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
                                    <input
                                        type="checkbox"
                                        checked={form.is_active}
                                        onChange={(e) => set("is_active", e.target.checked)}
                                        className="accent-primary w-4 h-4"
                                    />
                                    {tr.active}
                                </label>
                            </div>
                        </div>
                    )}

                    {/* ── ACTIONS ── */}
                    <div className="border-t border-border/20 py-4 flex gap-3 sticky bottom-0 backdrop-blur-sm">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 glass rounded-xl py-3 text-sm font-medium hover:bg-muted/20 transition-colors"
                        >
                            {tr.cancel}
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="flex-1 rounded-xl py-3 text-sm font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-70"
                            style={{
                                background: "linear-gradient(135deg, hsl(199,89%,48%), hsl(280,60%,55%))",
                                color: "hsl(225,25%,8%)",
                            }}
                        >
                            {saving ? (
                                <>
                                    <div className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
                                    Saqlanmoqda...
                                </>
                            ) : tr.save}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
