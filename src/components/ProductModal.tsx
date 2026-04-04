import { useState, useEffect, useRef } from "react";
import { X, Plus, Trash2, GripVertical, ImagePlus, ChevronDown, ChevronUp } from "lucide-react";
import { StoreProduct, ProductColor, ProductDetail, useStore } from "@/context/StoreContext";
import { useLang } from "@/context/LangContext";
import { useAppToast } from "@/hooks/use-app-toast";

// ─── Predefined sizes ──────────────────────────────────────────────────────────
const SIZE_GROUPS = [
    { label: "Clothing", sizes: ["XXS", "XS", "S", "M", "L", "XL", "XXL", "3XL"] },
    { label: "Numeric", sizes: ["34", "36", "38", "40", "42", "44", "46", "48"] },
    { label: "One Size", sizes: ["One Size", "Free Size"] },
];

const makeEmpty = (): StoreProduct => ({
    id: `prod-${Date.now()}`,
    nameEn: "",
    nameRu: "",
    descriptionEn: "",
    descriptionRu: "",
    price: 0,
    stock: 0,
    categoryId: "",
    status: "active",
    colors: [],
    sizes: [],
    images: [],
    details: [],
    delivery: "Free standard delivery on orders over $200. Returns within 28 days.",
});

interface Props {
    open: boolean;
    onClose: () => void;
    product?: StoreProduct | null;
}

// ─── Image Upload Zone ────────────────────────────────────────────────────────
function ImageUploadZone({ images, onChange }: { images: string[]; onChange: (imgs: string[]) => void }) {
    const [draggingOver, setDraggingOver] = useState(false);
    const [dragIdx, setDragIdx] = useState<number | null>(null);
    const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);
    const fileRef = useRef<HTMLInputElement>(null);

    const readFiles = (files: FileList | null) => {
        if (!files || files.length === 0) return;
        const newImgs: string[] = [];
        let pending = files.length;
        Array.from(files).forEach((file) => {
            if (!file.type.startsWith("image/")) { pending--; return; }
            const reader = new FileReader();
            reader.onload = (e) => {
                newImgs.push(e.target?.result as string);
                if (--pending === 0) onChange([...images, ...newImgs]);
            };
            reader.readAsDataURL(file);
        });
    };

    const onZoneDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDraggingOver(false);
        // If dropping files from OS
        if (e.dataTransfer.files.length > 0) {
            readFiles(e.dataTransfer.files);
            return;
        }
    };

    const onItemDragStart = (e: React.DragEvent, idx: number) => {
        setDragIdx(idx);
        e.dataTransfer.effectAllowed = "move";
        // Prevent file drop from interfering
        e.dataTransfer.clearData();
    };
    const onItemDragOver = (e: React.DragEvent, idx: number) => { e.preventDefault(); setDragOverIdx(idx); };
    const onItemDrop = (e: React.DragEvent, idx: number) => {
        e.preventDefault();
        if (dragIdx === null || dragIdx === idx) { setDragIdx(null); setDragOverIdx(null); return; }
        const next = [...images];
        const [moved] = next.splice(dragIdx, 1);
        next.splice(idx, 0, moved);
        onChange(next);
        setDragIdx(null);
        setDragOverIdx(null);
    };
    const onItemDragEnd = () => { setDragIdx(null); setDragOverIdx(null); };

    return (
        <div className="space-y-3">
            {/* Drop zone */}
            <div
                onDragOver={(e) => { e.preventDefault(); setDraggingOver(true); }}
                onDragLeave={() => setDraggingOver(false)}
                onDrop={onZoneDrop}
                onClick={() => fileRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all
          ${draggingOver ? "border-primary bg-primary/10" : "border-border/50 hover:border-primary/50 hover:bg-primary/5"}`}
            >
                <ImagePlus className={`h-8 w-8 transition-colors ${draggingOver ? "text-primary" : "text-muted-foreground"}`} />
                <p className="text-sm font-medium text-center">
                    {draggingOver ? "Drop images here" : "Click or drag images here"}
                </p>
                <p className="text-xs text-muted-foreground">PNG, JPG, WEBP · Multiple files allowed</p>
                <input ref={fileRef} type="file" accept="image/*" multiple className="hidden"
                       onChange={(e) => readFiles(e.target.files)} />
            </div>

            {/* Thumbnails grid */}
            {images.length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                    {images.map((src, idx) => (
                        <div
                            key={idx}
                            draggable
                            onDragStart={(e) => onItemDragStart(e, idx)}
                            onDragOver={(e) => onItemDragOver(e, idx)}
                            onDrop={(e) => onItemDrop(e, idx)}
                            onDragEnd={onItemDragEnd}
                            className={`relative group aspect-square rounded-lg overflow-hidden border-2 cursor-grab active:cursor-grabbing transition-all select-none
                ${dragOverIdx === idx && dragIdx !== idx ? "border-primary scale-[1.04]" : idx === 0 ? "border-primary/70" : "border-border/30"}
                ${dragIdx === idx ? "opacity-40" : ""}`}
                        >
                            <img src={src} alt="" className="w-full h-full object-cover pointer-events-none" />
                            {idx === 0 && (
                                <span className="absolute top-1 left-1 text-[9px] font-bold bg-primary text-primary-foreground rounded px-1 leading-4">
                  MAIN
                </span>
                            )}
                            <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <div className="bg-black/50 backdrop-blur-sm rounded p-0.5">
                                    <GripVertical className="h-3 w-3 text-white" />
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => onChange(images.filter((_, i) => i !== idx))}
                                className="absolute bottom-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity bg-red-500/90 hover:bg-red-500 rounded p-0.5"
                            >
                                <X className="h-3 w-3 text-white" />
                            </button>
                        </div>
                    ))}
                    <button
                        type="button"
                        onClick={() => fileRef.current?.click()}
                        className="aspect-square rounded-lg border-2 border-dashed border-border/40 hover:border-primary/50 hover:bg-primary/5 flex items-center justify-center transition-all"
                    >
                        <Plus className="h-5 w-5 text-muted-foreground" />
                    </button>
                </div>
            )}
        </div>
    );
}

// ─── Main Modal ───────────────────────────────────────────────────────────────
export function ProductModal({ open, onClose, product }: Props) {
    const { tr, lang } = useLang();
    const { addProduct, updateProduct, categories } = useStore();
    const { success } = useAppToast();

    const [form, setForm] = useState<StoreProduct>(makeEmpty());
    const [colorEn, setColorEn] = useState("");
    const [colorRu, setColorRu] = useState("");
    const [colorHex, setColorHex] = useState("#1a1a1a");
    const [detailEn, setDetailEn] = useState("");
    const [detailRu, setDetailRu] = useState("");
    const [open_sections, setOpenSections] = useState({
        images: true, info: true, pricing: true,
        sizes: true, colors: true, details: true, delivery: false,
    });

    const isEdit = !!product;

    useEffect(() => {
        if (open) {
            setForm(product ? { ...product, images: [...(product.images || [])], colors: [...(product.colors || [])], details: [...(product.details || [])], sizes: [...(product.sizes || [])] } : makeEmpty());
            setColorEn(""); setColorRu(""); setColorHex("#1a1a1a");
            setDetailEn(""); setDetailRu("");
        }
    }, [open, product]);

    if (!open) return null;

    const set = (k: keyof StoreProduct, v: any) => setForm((f) => ({ ...f, [k]: v }));
    const toggleSection = (s: keyof typeof open_sections) =>
        setOpenSections((p) => ({ ...p, [s]: !p[s] }));

    const toggleSize = (size: string) =>
        set("sizes", form.sizes.includes(size) ? form.sizes.filter((s) => s !== size) : [...form.sizes, size]);

    const addColor = () => {
        if (!colorEn.trim() || !colorRu.trim()) return;
        set("colors", [...form.colors, { nameEn: colorEn.trim(), nameRu: colorRu.trim(), hex: colorHex }]);
        setColorEn(""); setColorRu(""); setColorHex("#1a1a1a");
    };

    const addDetail = () => {
        if (!detailEn.trim() || !detailRu.trim()) return;
        set("details", [...form.details, { en: detailEn.trim(), ru: detailRu.trim() }]);
        setDetailEn(""); setDetailRu("");
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (isEdit) { updateProduct(form); success(tr.productUpdated); }
        else { addProduct(form); success(tr.productAdded); }
        onClose();
    };

    const rootCats = categories.filter((c) => !c.parentId);
    const subCats = categories.filter((c) => c.parentId);

    const Sec = ({ label, k }: { label: string; k: keyof typeof open_sections }) => (
        <button type="button" onClick={() => toggleSection(k)}
                className="w-full flex items-center justify-between py-2.5 text-xs font-semibold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors">
            <span>{label}</span>
            {open_sections[k] ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </button>
    );

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative glass-strong rounded-2xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-border/30 shrink-0">
                    <h2 className="text-lg font-bold gradient-text">{isEdit ? tr.editProduct : tr.addProduct}</h2>
                    <button onClick={onClose} className="glass rounded-lg p-2 hover:bg-red-500/20 transition-colors">
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 px-6 py-2">

                    {/* ── IMAGES ── */}
                    <Sec label="Images" k="images" />
                    {open_sections.images && <div className="pb-5"><ImageUploadZone images={form.images} onChange={(v) => set("images", v)} /></div>}

                    {/* ── NAME & DESCRIPTION ── */}
                    <div className="border-t border-border/20">
                        <Sec label={tr.name + " & " + tr.description} k="info" />
                    </div>
                    {open_sections.info && (
                        <div className="pb-5 space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs text-muted-foreground mb-1 block">{tr.nameEn}</label>
                                    <input required value={form.nameEn} onChange={(e) => set("nameEn", e.target.value)}
                                           placeholder="Name in English"
                                           className="w-full glass rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/50" />
                                </div>
                                <div>
                                    <label className="text-xs text-muted-foreground mb-1 block">{tr.nameRu}</label>
                                    <input required value={form.nameRu} onChange={(e) => set("nameRu", e.target.value)}
                                           placeholder="Название на русском"
                                           className="w-full glass rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/50" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs text-muted-foreground mb-1 block">{tr.descriptionEn}</label>
                                    <textarea rows={3} value={form.descriptionEn} onChange={(e) => set("descriptionEn", e.target.value)}
                                              className="w-full glass rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/50 resize-none" />
                                </div>
                                <div>
                                    <label className="text-xs text-muted-foreground mb-1 block">{tr.descriptionRu}</label>
                                    <textarea rows={3} value={form.descriptionRu} onChange={(e) => set("descriptionRu", e.target.value)}
                                              className="w-full glass rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/50 resize-none" />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── PRICING ── */}
                    <div className="border-t border-border/20">
                        <Sec label={tr.price + " · " + tr.stock + " · " + tr.status} k="pricing" />
                    </div>
                    {open_sections.pricing && (
                        <div className="pb-5 space-y-3">
                            <div className="grid grid-cols-3 gap-3">
                                <div>
                                    <label className="text-xs text-muted-foreground mb-1 block">{tr.price} ($)</label>
                                    <input type="number" required min={0} value={form.price}
                                           onChange={(e) => set("price", Number(e.target.value))}
                                           className="w-full glass rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/50" />
                                </div>
                                <div>
                                    <label className="text-xs text-muted-foreground mb-1 block">{tr.stock}</label>
                                    <input type="number" min={0} value={form.stock}
                                           onChange={(e) => set("stock", Number(e.target.value))}
                                           className="w-full glass rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/50" />
                                </div>
                                <div>
                                    <label className="text-xs text-muted-foreground mb-1 block">{tr.status}</label>
                                    <select value={form.status} onChange={(e) => set("status", e.target.value as "active" | "inactive")}
                                            className="w-full glass rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/50 bg-black">
                                        <option value="active">{tr.active}</option>
                                        <option value="inactive">{tr.inactive}</option>
                                    </select>
                                </div>
                            </div>
                            <div className="flex items-end gap-4">
                                <div className="flex-1">
                                    <label className="text-xs text-muted-foreground mb-1 block">{tr.category}</label>
                                    <select value={form.categoryId} onChange={(e) => set("categoryId", e.target.value)}
                                            className="w-full glass rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/50 bg-black">
                                        <option value="">{tr.selectCategory}</option>
                                        {rootCats.map((c) => (
                                            <optgroup key={c.id} label={lang === "RU" ? c.nameRu : c.nameEn}>
                                                {subCats.filter((s) => s.parentId === c.id).map((s) => (
                                                    <option key={s.id} value={s.id}>{s.icon} {lang === "RU" ? s.nameRu : s.nameEn}</option>
                                                ))}
                                            </optgroup>
                                        ))}
                                    </select>
                                </div>
                                <div className="flex gap-4 pb-1">
                                    <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
                                        <input type="checkbox" checked={!!form.isNew} onChange={(e) => set("isNew", e.target.checked)} className="accent-primary w-4 h-4" />
                                        New
                                    </label>
                                    <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
                                        <input type="checkbox" checked={!!form.isSale} onChange={(e) => set("isSale", e.target.checked)} className="accent-primary w-4 h-4" />
                                        Sale
                                    </label>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── SIZES ── */}
                    <div className="border-t border-border/20">
                        <Sec label={tr.sizes} k="sizes" />
                    </div>
                    {open_sections.sizes && (
                        <div className="pb-5 space-y-3">
                            {SIZE_GROUPS.map((group) => (
                                <div key={group.label}>
                                    <p className="text-xs text-muted-foreground mb-2">{group.label}</p>
                                    <div className="flex flex-wrap gap-2">
                                        {group.sizes.map((size) => {
                                            const checked = form.sizes.includes(size);
                                            return (
                                                <label key={size}
                                                       className={`px-3 py-1.5 rounded-lg text-sm cursor-pointer transition-all border select-none
                            ${checked
                                                           ? "bg-primary/20 border-primary text-primary font-semibold"
                                                           : "glass border-border/30 text-muted-foreground hover:border-primary/40 hover:text-foreground"
                                                       }`}
                                                >
                                                    <input type="checkbox" checked={checked} onChange={() => toggleSize(size)} className="hidden" />
                                                    {size}
                                                </label>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                            {form.sizes.length > 0 && (
                                <p className="text-xs text-muted-foreground">
                                    {lang === "RU" ? "Выбрано: " : "Selected: "}
                                    <span className="text-foreground font-medium">{form.sizes.join(", ")}</span>
                                </p>
                            )}
                        </div>
                    )}

                    {/* ── COLORS ── */}
                    <div className="border-t border-border/20">
                        <Sec label={tr.colors} k="colors" />
                    </div>
                    {open_sections.colors && (
                        <div className="pb-5 space-y-3">
                            {form.colors.length > 0 && (
                                <div className="space-y-1.5">
                                    {form.colors.map((c, i) => (
                                        <div key={i} className="flex items-center gap-3 glass rounded-xl px-3 py-2.5">
                                            <div className="h-6 w-6 rounded-full border border-white/20 shrink-0" style={{ background: c.hex }} />
                                            <span className="text-sm font-medium flex-1 min-w-0 truncate">{c.nameEn}</span>
                                            <span className="text-sm text-muted-foreground flex-1 min-w-0 truncate">{c.nameRu}</span>
                                            <span className="text-xs text-muted-foreground font-mono shrink-0">{c.hex}</span>
                                            <button type="button" onClick={() => set("colors", form.colors.filter((_, j) => j !== i))}
                                                    className="text-red-400 hover:text-red-300 transition-colors shrink-0">
                                                <X className="h-3.5 w-3.5" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                            <div className="glass-subtle rounded-xl p-4 space-y-3">
                                <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">Add color</p>
                                <div className="grid grid-cols-2 gap-2">
                                    <input value={colorEn} onChange={(e) => setColorEn(e.target.value)}
                                           placeholder="EN: Black, White, Ivory…"
                                           onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addColor())}
                                           className="glass rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50" />
                                    <input value={colorRu} onChange={(e) => setColorRu(e.target.value)}
                                           placeholder="RU: Чёрный, Белый…"
                                           onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addColor())}
                                           className="glass rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50" />
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-2 glass rounded-lg px-3 py-1.5 flex-1">
                                        <input type="color" value={colorHex} onChange={(e) => setColorHex(e.target.value)}
                                               className="w-7 h-7 rounded-md cursor-pointer border-0 bg-transparent p-0 outline-none" />
                                        <input value={colorHex} onChange={(e) => setColorHex(e.target.value)}
                                               className="w-20 bg-transparent text-sm outline-none font-mono uppercase" maxLength={7} />
                                    </div>
                                    <button type="button" onClick={addColor}
                                            className="glass rounded-lg px-4 py-2 text-sm hover:bg-primary/20 transition-colors flex items-center gap-1.5 font-medium shrink-0">
                                        <Plus className="h-3.5 w-3.5" /> Add
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── DETAILS ── */}
                    <div className="border-t border-border/20">
                        <Sec label={tr.details} k="details" />
                    </div>
                    {open_sections.details && (
                        <div className="pb-5 space-y-3">
                            {form.details.length > 0 && (
                                <div className="space-y-1.5">
                                    {form.details.map((d, i) => (
                                        <div key={i} className="flex items-start gap-3 glass rounded-xl px-3 py-2.5">
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm">{d.en}</p>
                                                <p className="text-xs text-muted-foreground mt-0.5">{d.ru}</p>
                                            </div>
                                            <button type="button" onClick={() => set("details", form.details.filter((_, j) => j !== i))}
                                                    className="text-red-400 hover:text-red-300 transition-colors mt-0.5 shrink-0">
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                            <div className="glass-subtle rounded-xl p-4 space-y-2">
                                <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">Add detail</p>
                                <input value={detailEn} onChange={(e) => setDetailEn(e.target.value)}
                                       placeholder="EN: 95% Viscose, 5% Elastane"
                                       onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addDetail())}
                                       className="w-full glass rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50" />
                                <div className="flex gap-2">
                                    <input value={detailRu} onChange={(e) => setDetailRu(e.target.value)}
                                           placeholder="RU: 95% вискоза, 5% эластан"
                                           onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addDetail())}
                                           className="flex-1 glass rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50" />
                                    <button type="button" onClick={addDetail}
                                            className="glass rounded-lg px-4 py-2 text-sm hover:bg-primary/20 transition-colors flex items-center gap-1.5 font-medium shrink-0">
                                        <Plus className="h-3.5 w-3.5" /> Add
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── DELIVERY ── */}
                    <div className="border-t border-border/20">
                        <Sec label={tr.delivery} k="delivery" />
                    </div>
                    {open_sections.delivery && (
                        <div className="pb-5">
                            <input value={form.delivery} onChange={(e) => set("delivery", e.target.value)}
                                   className="w-full glass rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/50" />
                        </div>
                    )}

                    {/* ── ACTIONS ── */}
                    <div className="border-t border-border/20 py-4 flex gap-3 sticky bottom-0 bg-transparent backdrop-blur-sm">
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