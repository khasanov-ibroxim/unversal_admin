import { useState, useEffect } from "react";
import { X, ChevronDown, ChevronUp, Plus, Trash2, ImagePlus, Upload, Save, Pencil } from "lucide-react";
import { useLang } from "@/context/LangContext";
import { useStore } from "@/context/StoreContext";
import { useAppToast } from "@/hooks/use-app-toast";
import {
    productsApi, productPhotosApi, productItemsApi, productDetailsApi,
    BASE_URL, type ApiProduct, type ApiProductPhoto, type ApiProductItem, type ApiProductDetail
} from "@/api";

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

// ─── Helper: filter sub-resources by product_id ───────────────────────────────
function filterByProduct<T extends { product_id: number }>(data: unknown, productId: number): T[] {
    if (!Array.isArray(data)) return [];
    return (data as T[]).filter((item) => item.product_id === productId);
}

export function ProductModal({ open, onClose, product }: Props) {
    const { tr, lang } = useLang();
    const { categories, collections, colors, sizes, refreshProducts } = useStore();
    const { success, error: toastError } = useAppToast();

    const [form, setForm] = useState(makeEmpty());
    const [saving, setSaving] = useState(false);
    const [sections, setSections] = useState({ info: true, pricing: true, photos: true, items: false, details: false });

    // Photos
    const [existingPhotos, setExistingPhotos] = useState<ApiProductPhoto[]>([]);
    const [newPhotoFiles, setNewPhotoFiles] = useState<File[]>([]);
    const [newPhotoPreview, setNewPhotoPreview] = useState<string[]>([]);
    const [photosLoading, setPhotosLoading] = useState(false);

    // Product Items
    const [items, setItems] = useState<ApiProductItem[]>([]);
    const [itemsLoading, setItemsLoading] = useState(false);
    const [newItem, setNewItem] = useState({ color_id: "", size_id: "", total_count: 1 });
    const [savingItem, setSavingItem] = useState(false);
    // Editing items
    const [editingItemId, setEditingItemId] = useState<number | null>(null);
    const [editingItemCount, setEditingItemCount] = useState<number>(1);
    const [savingItemUpdate, setSavingItemUpdate] = useState(false);
    const [colorDropdownOpen, setColorDropdownOpen] = useState(false);

    // Product Details
    const [details, setDetails] = useState<ApiProductDetail[]>([]);
    const [detailsLoading, setDetailsLoading] = useState(false);
    const [newDetail, setNewDetail] = useState({ name_uz: "", name_ru: "", name_eng: "" });
    const [savingDetail, setSavingDetail] = useState(false);
    // Editing details
    const [editingDetailId, setEditingDetailId] = useState<number | null>(null);
    const [editingDetail, setEditingDetail] = useState({ name_uz: "", name_ru: "", name_eng: "" });
    const [savingDetailUpdate, setSavingDetailUpdate] = useState(false);

    const isEdit = !!product;

    // ─── Load sub-resources when editing ─────────────────────────────────────
    useEffect(() => {
        if (!open) return;

        // Reset all state
        setItems([]);
        setDetails([]);
        setExistingPhotos([]);
        setNewPhotoFiles([]);
        setNewPhotoPreview([]);
        setNewItem({ color_id: "", size_id: "", total_count: 1 });
        setNewDetail({ name_uz: "", name_ru: "", name_eng: "" });
        setEditingItemId(null);
        setEditingDetailId(null);
        setColorDropdownOpen(false);

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

            const pid = product.id as number;

            // Fetch photos
            setPhotosLoading(true);
            productPhotosApi.getAll(pid)
                .then((data) => setExistingPhotos(Array.isArray(data) ? data : []))
                .catch(() => setExistingPhotos([]))
                .finally(() => setPhotosLoading(false));

            // Fetch items — filter by product_id
            setItemsLoading(true);
            productItemsApi.getAll(pid)
                .then((data) => setItems(filterByProduct<ApiProductItem>(data, pid)))
                .catch(() => setItems([]))
                .finally(() => setItemsLoading(false));

            // Fetch details — filter by product_id
            setDetailsLoading(true);
            productDetailsApi.getAll(pid)
                .then((data) => setDetails(filterByProduct<ApiProductDetail>(data, pid)))
                .catch(() => setDetails([]))
                .finally(() => setDetailsLoading(false));
        } else {
            setForm(makeEmpty());
        }
    }, [open, product?.id]);

    if (!open) return null;

    const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
        setForm((f) => ({ ...f, [k]: v }));

    const toggleSection = (s: keyof typeof sections) =>
        setSections((p) => ({ ...p, [s]: !p[s] }));

    // ─── Photo handlers ───────────────────────────────────────────────────────
    const handleAddPhotos = (files: FileList | null) => {
        if (!files) return;
        const arr = Array.from(files);
        setNewPhotoFiles((prev) => [...prev, ...arr]);
        arr.forEach((file) => {
            const reader = new FileReader();
            reader.onload = (e) => setNewPhotoPreview((prev) => [...prev, e.target?.result as string]);
            reader.readAsDataURL(file);
        });
    };

    const handleRemoveNewPhoto = (i: number) => {
        setNewPhotoFiles((prev) => prev.filter((_, idx) => idx !== i));
        setNewPhotoPreview((prev) => prev.filter((_, idx) => idx !== i));
    };

    const handleDeleteExistingPhoto = async (photoId: number) => {
        try {
            await productPhotosApi.delete(photoId);
            setExistingPhotos((prev) => prev.filter((p) => p.id !== photoId));
        } catch (e: unknown) {
            toastError(e instanceof Error ? e.message : "Rasmni o'chirishda xatolik");
        }
    };

    // ─── Item handlers ────────────────────────────────────────────────────────
    const handleAddItem = async (productId: number) => {
        if (!newItem.color_id || !newItem.size_id) return;
        setSavingItem(true);
        try {
            await productItemsApi.create({
                product_id: productId,
                color_id: Number(newItem.color_id),
                size_id: Number(newItem.size_id),
                total_count: Number(newItem.total_count),
            });
            const data = await productItemsApi.getAll(productId);
            setItems(filterByProduct<ApiProductItem>(data, productId));
            setNewItem({ color_id: "", size_id: "", total_count: 1 });
        } catch (e: unknown) {
            toastError(e instanceof Error ? e.message : "Xatolik");
        } finally {
            setSavingItem(false);
        }
    };

    const handleDeleteItem = async (itemId: number) => {
        try {
            await productItemsApi.delete(itemId);
            setItems((prev) => prev.filter((it) => it.id !== itemId));
            if (editingItemId === itemId) setEditingItemId(null);
        } catch (e: unknown) {
            toastError(e instanceof Error ? e.message : "Xatolik");
        }
    };

    const startEditItem = (item: ApiProductItem) => {
        setEditingItemId(item.id);
        setEditingItemCount(item.total_count);
    };

    const handleUpdateItem = async (itemId: number) => {
        setSavingItemUpdate(true);
        try {
            await productItemsApi.update(itemId, { total_count: editingItemCount });
            setItems((prev) => prev.map((it) => it.id === itemId ? { ...it, total_count: editingItemCount } : it));
            setEditingItemId(null);
        } catch (e: unknown) {
            toastError(e instanceof Error ? e.message : "Yangilashda xatolik");
        } finally {
            setSavingItemUpdate(false);
        }
    };

    // ─── Detail handlers ──────────────────────────────────────────────────────
    const handleAddDetail = async (productId: number) => {
        if (!newDetail.name_uz || !newDetail.name_ru || !newDetail.name_eng) return;
        setSavingDetail(true);
        try {
            await productDetailsApi.create({ product_id: productId, ...newDetail });
            const data = await productDetailsApi.getAll(productId);
            setDetails(filterByProduct<ApiProductDetail>(data, productId));
            setNewDetail({ name_uz: "", name_ru: "", name_eng: "" });
        } catch (e: unknown) {
            toastError(e instanceof Error ? e.message : "Xatolik");
        } finally {
            setSavingDetail(false);
        }
    };

    const handleDeleteDetail = async (detailId: number) => {
        try {
            await productDetailsApi.delete(detailId);
            setDetails((prev) => prev.filter((d) => d.id !== detailId));
            if (editingDetailId === detailId) setEditingDetailId(null);
        } catch (e: unknown) {
            toastError(e instanceof Error ? e.message : "Xatolik");
        }
    };

    const startEditDetail = (d: ApiProductDetail) => {
        setEditingDetailId(d.id);
        setEditingDetail({ name_uz: d.name_uz, name_ru: d.name_ru, name_eng: d.name_eng });
    };

    const handleUpdateDetail = async (detailId: number) => {
        setSavingDetailUpdate(true);
        try {
            await productDetailsApi.update(detailId, editingDetail);
            setDetails((prev) => prev.map((d) => d.id === detailId ? { ...d, ...editingDetail } : d));
            setEditingDetailId(null);
        } catch (e: unknown) {
            toastError(e instanceof Error ? e.message : "Yangilashda xatolik");
        } finally {
            setSavingDetailUpdate(false);
        }
    };

    // ─── Main submit ──────────────────────────────────────────────────────────
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            let productId: number;
            if (isEdit) {
                await productsApi.update(product!.id as number, form);
                productId = product!.id as number;
            } else {
                const res = await productsApi.create(form);
                productId = res.id;
            }

            for (const file of newPhotoFiles) {
                try { await productPhotosApi.create(productId, file); } catch {}
            }

            success(isEdit ? tr.productUpdated : tr.productAdded);
            await refreshProducts();
            onClose();
        } catch (err: unknown) {
            toastError(err instanceof Error ? err.message : "Xatolik yuz berdi");
        } finally {
            setSaving(false);
        }
    };

    // ─── UI helpers ───────────────────────────────────────────────────────────
    const Sec = ({ label, k, badge }: { label: string; k: keyof typeof sections; badge?: number }) => (
        <button
            type="button"
            onClick={() => toggleSection(k)}
            className="w-full flex items-center justify-between py-2.5 text-xs font-semibold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
        >
            <span className="flex items-center gap-2">
                {label}
                {badge !== undefined && badge > 0 && (
                    <span className="inline-flex items-center justify-center h-4 min-w-4 px-1 rounded-full bg-primary/20 text-primary text-[10px] font-bold">
                        {badge}
                    </span>
                )}
            </span>
            {sections[k] ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </button>
    );

    const getPhotoSrc = (p: ApiProductPhoto) => {
        const url = (p as any).photo_url || (p as any).photo;
        if (!url) return null;
        return url.startsWith("http") ? url : `${BASE_URL}/${url}`;
    };

    const getColor = (id: number) => colors.find((x) => x.id === id) ?? null;

    const getColorHex = (id: number): string => {
        const c = getColor(id) as any;
        if (!c) return "";
        // Check known field names first
        const known = c.hex ?? c.color ?? c.color_hex ?? c.code ?? c.value ?? c.rgb ?? c.colour ?? "";
        if (known && typeof known === "string" && known.startsWith("#")) return known;
        // Fallback: scan ALL fields for any value that looks like a hex color
        for (const val of Object.values(c)) {
            if (typeof val === "string" && /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(val)) {
                return val;
            }
        }
        return "";
    };

    const getColorName = (id: number) => {
        const c = getColor(id);
        return c ? (lang === "RU" ? c.name_ru : c.name_eng) : `#${id}`;
    };

    const getSizeName = (id: number) => {
        const s = sizes.find((x) => x.id === id);
        return s ? s.name : `#${id}`;
    };

    const Spinner = () => (
        <div className="h-3 w-3 rounded-full border-2 border-current border-t-transparent animate-spin" />
    );

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative glass-strong rounded-2xl w-full max-w-2xl max-h-[94vh] flex flex-col shadow-2xl">
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

                    {/* ── PHOTOS ── */}
                    <Sec label="Rasmlar" k="photos" badge={existingPhotos.length + newPhotoFiles.length} />
                    {sections.photos && (
                        <div className="pb-5">
                            {photosLoading ? (
                                <div className="flex gap-2 mb-3">
                                    {[1, 2, 3].map(i => <div key={i} className="h-20 w-20 rounded-lg bg-muted/30 animate-pulse" />)}
                                </div>
                            ) : existingPhotos.length > 0 && (
                                <div className="flex flex-wrap gap-2 mb-3">
                                    {existingPhotos.map((photo) => {
                                        const src = getPhotoSrc(photo);
                                        return (
                                            <div key={photo.id} className="relative group h-20 w-20 rounded-lg overflow-hidden bg-muted/20">
                                                {src ? (
                                                    <img src={src} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center">
                                                        <ImagePlus className="h-6 w-6 text-muted-foreground/40" />
                                                    </div>
                                                )}
                                                <button
                                                    type="button"
                                                    onClick={() => handleDeleteExistingPhoto(photo.id)}
                                                    className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                                                >
                                                    <Trash2 className="h-4 w-4 text-red-400" />
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {newPhotoPreview.length > 0 && (
                                <div className="flex flex-wrap gap-2 mb-3">
                                    {newPhotoPreview.map((src, i) => (
                                        <div key={i} className="relative group h-20 w-20 rounded-lg overflow-hidden border-2 border-primary/30">
                                            <img src={src} alt="" className="w-full h-full object-cover" />
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveNewPhoto(i)}
                                                className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                                            >
                                                <X className="h-4 w-4 text-red-400" />
                                            </button>
                                            <div className="absolute bottom-0 left-0 right-0 bg-primary/80 text-[9px] text-center py-0.5 text-primary-foreground">
                                                Yangi
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div
                                className="border-2 border-dashed rounded-xl p-4 flex flex-col items-center gap-2 cursor-pointer hover:border-primary/50 transition-colors"
                                onClick={() => document.getElementById("product-photo-multi-input")?.click()}
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={(e) => { e.preventDefault(); handleAddPhotos(e.dataTransfer.files); }}
                            >
                                <Upload className="h-6 w-6 text-muted-foreground/50" />
                                <p className="text-xs text-muted-foreground text-center">
                                    Ko'p rasm yuklash uchun bosing (PNG, JPG, WEBP)
                                </p>
                                <input
                                    id="product-photo-multi-input"
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    className="hidden"
                                    onChange={(e) => handleAddPhotos(e.target.files)}
                                />
                            </div>
                        </div>
                    )}

                    {/* ── INFO ── */}
                    <div className="border-t border-border/20">
                        <Sec label={`${tr.name} & ${tr.description}`} k="info" />
                    </div>
                    {sections.info && (
                        <div className="pb-5 space-y-3">
                            <div className="grid grid-cols-3 gap-3">
                                {(["uz", "ru", "eng"] as const).map((lng) => (
                                    <div key={lng}>
                                        <label className="text-xs text-muted-foreground mb-1 block">
                                            Nomi ({lng.toUpperCase()})
                                        </label>
                                        <input
                                            required
                                            value={form[`name_${lng}` as keyof typeof form] as string}
                                            onChange={(e) => set(`name_${lng}` as keyof typeof form, e.target.value as any)}
                                            placeholder={lng === "uz" ? "O'zbek tilida" : lng === "ru" ? "На русском" : "In English"}
                                            className="w-full glass rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/50"
                                        />
                                    </div>
                                ))}
                            </div>
                            <div className="grid grid-cols-3 gap-3">
                                {(["uz", "ru", "eng"] as const).map((lng) => (
                                    <div key={lng}>
                                        <label className="text-xs text-muted-foreground mb-1 block">
                                            Tavsif ({lng.toUpperCase()})
                                        </label>
                                        <textarea
                                            rows={3}
                                            value={form[`description_${lng}` as keyof typeof form] as string}
                                            onChange={(e) => set(`description_${lng}` as keyof typeof form, e.target.value as any)}
                                            className="w-full glass rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ── PRICING ── */}
                    <div className="border-t border-border/20">
                        <Sec label={`${tr.price} · ${tr.status} · ${tr.category}`} k="pricing" />
                    </div>
                    {sections.pricing && (
                        <div className="pb-5 space-y-3">
                            <div className="grid grid-cols-4 gap-3">
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
                                        <option value="">Tanlang</option>
                                        {collections.map((c) => (
                                            <option key={c.id} value={c.id}>
                                                {lang === "RU" ? c.name_ru : c.name_eng}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="flex items-end pb-2.5">
                                    <label className="flex items-center gap-2 text-sm cursor-pointer">
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
                        </div>
                    )}

                    {/* ── PRODUCT ITEMS (only in edit mode) ── */}
                    {isEdit && (
                        <>
                            <div className="border-t border-border/20">
                                <Sec label="Variantlar (rang + o'lcham)" k="items" badge={items.length} />
                            </div>
                            {sections.items && (
                                <div className="pb-5 space-y-3">
                                    {itemsLoading ? (
                                        <div className="space-y-2">
                                            {[1, 2].map(i => <div key={i} className="h-10 bg-muted/20 rounded-lg animate-pulse" />)}
                                        </div>
                                    ) : items.length > 0 ? (
                                        <div className="space-y-2">
                                            {items.map((item) => (
                                                <div key={item.id} className="glass-subtle rounded-lg px-3 py-2 group">
                                                    {editingItemId === item.id ? (
                                                        // Edit mode
                                                        <div className="flex items-center gap-2">
                                                            <span className="flex items-center gap-1.5 text-xs glass rounded-full px-2 py-0.5 text-primary shrink-0">
                                                                {getColorHex(item.color_id) && (
                                                                    <span
                                                                        className="inline-block h-3 w-3 rounded-full border border-white/20 shrink-0"
                                                                        style={{ background: getColorHex(item.color_id) }}
                                                                    />
                                                                )}
                                                                {getColorName(item.color_id)}
                                                            </span>
                                                            <span className="text-xs glass rounded-full px-2 py-0.5 shrink-0">
                                                                {getSizeName(item.size_id)}
                                                            </span>
                                                            <input
                                                                type="number"
                                                                min={0}
                                                                value={editingItemCount}
                                                                onChange={(e) => setEditingItemCount(Number(e.target.value))}
                                                                className="glass rounded-lg px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-primary/50 w-20 ml-auto"
                                                            />
                                                            <button
                                                                type="button"
                                                                onClick={() => handleUpdateItem(item.id)}
                                                                disabled={savingItemUpdate}
                                                                className="glass rounded-lg p-1.5 hover:bg-green-500/20 transition-colors"
                                                            >
                                                                {savingItemUpdate ? <Spinner /> : <Save className="h-3 w-3 text-green-400" />}
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => setEditingItemId(null)}
                                                                className="glass rounded-lg p-1.5 hover:bg-muted/20 transition-colors"
                                                            >
                                                                <X className="h-3 w-3 text-muted-foreground" />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        // View mode
                                                        <div className="flex items-center gap-3">
                                                            <span className="flex items-center gap-1.5 text-xs glass rounded-full px-2 py-0.5 text-primary">
                                                                {getColorHex(item.color_id) && (
                                                                    <span
                                                                        className="inline-block h-3 w-3 rounded-full border border-white/20 shrink-0"
                                                                        style={{ background: getColorHex(item.color_id) }}
                                                                    />
                                                                )}
                                                                {getColorName(item.color_id)}
                                                            </span>
                                                            <span className="text-xs glass rounded-full px-2 py-0.5">
                                                                {getSizeName(item.size_id)}
                                                            </span>
                                                            <span className="text-xs text-muted-foreground ml-auto">
                                                                {item.total_count} dona
                                                            </span>
                                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => startEditItem(item)}
                                                                    className="glass rounded-lg p-1.5 hover:bg-primary/20 transition-colors"
                                                                >
                                                                    <Pencil className="h-3 w-3 text-primary" />
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleDeleteItem(item.id)}
                                                                    className="glass rounded-lg p-1.5 hover:bg-red-500/20 transition-colors"
                                                                >
                                                                    <Trash2 className="h-3 w-3 text-red-400" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-xs text-muted-foreground text-center py-2">Variantlar yo'q</p>
                                    )}

                                    {/* Add new item */}
                                    <div className="glass-subtle rounded-xl p-3 space-y-2">
                                        <p className="text-xs text-muted-foreground font-medium">Yangi variant qo'shish</p>
                                        <div className="grid grid-cols-3 gap-2">
                                            {/* Custom color dropdown */}
                                            <div className="relative">
                                                <button
                                                    type="button"
                                                    onClick={() => setColorDropdownOpen(o => !o)}
                                                    className="w-full glass rounded-lg px-2 py-2 text-xs outline-none flex items-center gap-1.5 justify-between"
                                                    style={{ background: "hsl(225,25%,12%)" }}
                                                >
                                                    <span className="flex items-center gap-1.5 min-w-0">
                                                        {newItem.color_id ? (
                                                            <>
                                                                {getColorHex(Number(newItem.color_id)) && (
                                                                    <span
                                                                        className="inline-block h-3.5 w-3.5 rounded-full border border-white/20 shrink-0"
                                                                        style={{ background: getColorHex(Number(newItem.color_id)) }}
                                                                    />
                                                                )}
                                                                <span className="truncate">{getColorName(Number(newItem.color_id))}</span>
                                                                <span className="text-muted-foreground/60 font-mono shrink-0">{getColorHex(Number(newItem.color_id))}</span>
                                                            </>
                                                        ) : (
                                                            <span className="text-muted-foreground">Rang</span>
                                                        )}
                                                    </span>
                                                    <ChevronDown className="h-3 w-3 text-muted-foreground shrink-0" />
                                                </button>
                                                {colorDropdownOpen && (
                                                    <div className="fixed inset-0 z-40" onClick={() => setColorDropdownOpen(false)} />
                                                )}
                                                {colorDropdownOpen && (
                                                    <div
                                                        className="absolute z-50 top-full mt-1 left-0 right-0 rounded-xl overflow-hidden shadow-xl border border-border/30"
                                                        style={{ background: "hsl(225,25%,10%)", maxHeight: "180px", overflowY: "auto" }}
                                                    >
                                                        {colors.map((c) => {
                                                            const hex = getColorHex(c.id);
                                                            const name = lang === "RU" ? c.name_ru : c.name_eng;
                                                            const isSelected = String(newItem.color_id) === String(c.id);
                                                            return (
                                                                <button
                                                                    key={c.id}
                                                                    type="button"
                                                                    onClick={() => {
                                                                        setNewItem(n => ({ ...n, color_id: String(c.id) }));
                                                                        setColorDropdownOpen(false);
                                                                    }}
                                                                    className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-white/10 transition-colors text-left"
                                                                    style={{ background: isSelected ? "hsl(225,25%,18%)" : "transparent" }}
                                                                >
                                                                    <span
                                                                        className="inline-block h-4 w-4 rounded-full border border-white/20 shrink-0"
                                                                        style={{ background: hex || "#888" }}
                                                                    />
                                                                    <span className="flex-1 truncate">{name}</span>
                                                                    <span className="font-mono text-muted-foreground/70 shrink-0">{hex}</span>
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                            <select
                                                value={newItem.size_id}
                                                onChange={(e) => setNewItem(n => ({ ...n, size_id: e.target.value }))}
                                                className="glass rounded-lg px-2 py-2 text-xs outline-none"
                                                style={{ background: "hsl(225,25%,12%)", color: "inherit" }}
                                            >
                                                <option value="" style={{ background: "hsl(225,25%,12%)" }}>O'lcham</option>
                                                {sizes.map((s) => (
                                                    <option key={s.id} value={s.id} style={{ background: "hsl(225,25%,12%)" }}>{s.name}</option>
                                                ))}
                                            </select>
                                            <input
                                                type="number"
                                                min={0}
                                                value={newItem.total_count}
                                                onChange={(e) => setNewItem(n => ({ ...n, total_count: Number(e.target.value) }))}
                                                placeholder="Soni"
                                                className="glass rounded-lg px-2 py-2 text-xs outline-none focus:ring-1 focus:ring-primary/50"
                                            />
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => handleAddItem(product!.id as number)}
                                            disabled={savingItem || !newItem.color_id || !newItem.size_id}
                                            className="w-full rounded-lg py-2 text-xs font-semibold flex items-center justify-center gap-1.5 disabled:opacity-50 transition-all"
                                            style={{ background: "linear-gradient(135deg, hsl(199,89%,48%), hsl(280,60%,55%))", color: "hsl(225,25%,8%)" }}
                                        >
                                            {savingItem ? <Spinner /> : <Plus className="h-3 w-3" />}
                                            Variant qo'shish
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* ── PRODUCT DETAILS ── */}
                            <div className="border-t border-border/20">
                                <Sec label="Tafsilotlar" k="details" badge={details.length} />
                            </div>
                            {sections.details && (
                                <div className="pb-5 space-y-3">
                                    {detailsLoading ? (
                                        <div className="space-y-2">
                                            {[1, 2].map(i => <div key={i} className="h-10 bg-muted/20 rounded-lg animate-pulse" />)}
                                        </div>
                                    ) : details.length > 0 ? (
                                        <div className="space-y-2">
                                            {details.map((d) => (
                                                <div key={d.id} className="glass-subtle rounded-lg px-3 py-2 group">
                                                    {editingDetailId === d.id ? (
                                                        // Edit mode
                                                        <div className="space-y-2">
                                                            <div className="grid grid-cols-3 gap-2">
                                                                {(["name_uz", "name_ru", "name_eng"] as const).map((field) => (
                                                                    <textarea
                                                                        key={field}
                                                                        rows={2}
                                                                        value={editingDetail[field]}
                                                                        onChange={(e) => setEditingDetail(prev => ({ ...prev, [field]: e.target.value }))}
                                                                        placeholder={field.split("_")[1].toUpperCase()}
                                                                        className="glass rounded-lg px-2 py-1.5 text-xs outline-none focus:ring-1 focus:ring-primary/50 resize-none"
                                                                    />
                                                                ))}
                                                            </div>
                                                            <div className="flex gap-2 justify-end">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setEditingDetailId(null)}
                                                                    className="glass rounded-lg px-2 py-1 text-xs hover:bg-muted/20 transition-colors"
                                                                >
                                                                    Bekor
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleUpdateDetail(d.id)}
                                                                    disabled={savingDetailUpdate}
                                                                    className="glass rounded-lg px-2 py-1 text-xs hover:bg-green-500/20 transition-colors flex items-center gap-1 text-green-400"
                                                                >
                                                                    {savingDetailUpdate ? <Spinner /> : <Save className="h-3 w-3" />}
                                                                    Saqlash
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        // View mode
                                                        <div className="flex items-start gap-3">
                                                            <div className="flex-1 grid grid-cols-3 gap-2 text-xs">
                                                                <span>{d.name_uz}</span>
                                                                <span className="text-muted-foreground">{d.name_ru}</span>
                                                                <span className="text-muted-foreground">{d.name_eng}</span>
                                                            </div>
                                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => startEditDetail(d)}
                                                                    className="glass rounded-lg p-1.5 hover:bg-primary/20 transition-colors"
                                                                >
                                                                    <Pencil className="h-3 w-3 text-primary" />
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleDeleteDetail(d.id)}
                                                                    className="glass rounded-lg p-1.5 hover:bg-red-500/20 transition-all"
                                                                >
                                                                    <Trash2 className="h-3 w-3 text-red-400" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-xs text-muted-foreground text-center py-2">Tafsilotlar yo'q</p>
                                    )}

                                    {/* Add new detail */}
                                    <div className="glass-subtle rounded-xl p-3 space-y-2">
                                        <p className="text-xs text-muted-foreground font-medium">Yangi tafsilot qo'shish</p>
                                        <div className="grid grid-cols-3 gap-2">
                                            <textarea
                                                rows={2}
                                                value={newDetail.name_uz}
                                                onChange={(e) => setNewDetail(d => ({ ...d, name_uz: e.target.value }))}
                                                placeholder="UZ"
                                                className="glass rounded-lg px-2 py-2 text-xs outline-none focus:ring-1 focus:ring-primary/50 resize-none"
                                            />
                                            <textarea
                                                rows={2}
                                                value={newDetail.name_ru}
                                                onChange={(e) => setNewDetail(d => ({ ...d, name_ru: e.target.value }))}
                                                placeholder="RU"
                                                className="glass rounded-lg px-2 py-2 text-xs outline-none focus:ring-1 focus:ring-primary/50 resize-none"
                                            />
                                            <textarea
                                                rows={2}
                                                value={newDetail.name_eng}
                                                onChange={(e) => setNewDetail(d => ({ ...d, name_eng: e.target.value }))}
                                                placeholder="EN"
                                                className="glass rounded-lg px-2 py-2 text-xs outline-none focus:ring-1 focus:ring-primary/50 resize-none"
                                            />
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => handleAddDetail(product!.id as number)}
                                            disabled={savingDetail || !newDetail.name_uz || !newDetail.name_ru || !newDetail.name_eng}
                                            className="w-full rounded-lg py-2 text-xs font-semibold flex items-center justify-center gap-1.5 disabled:opacity-50"
                                            style={{ background: "linear-gradient(135deg, hsl(199,89%,48%), hsl(280,60%,55%))", color: "hsl(225,25%,8%)" }}
                                        >
                                            {savingDetail ? <Spinner /> : <Plus className="h-3 w-3" />}
                                            Tafsilot qo'shish
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
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
                                    <Spinner />
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