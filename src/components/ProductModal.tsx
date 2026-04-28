import { useState, useEffect } from "react";
import { X, ChevronDown, ChevronUp, Plus, Trash2, ImagePlus, Upload } from "lucide-react";
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

    // Product Details
    const [details, setDetails] = useState<ApiProductDetail[]>([]);
    const [detailsLoading, setDetailsLoading] = useState(false);
    const [newDetail, setNewDetail] = useState({ name_uz: "", name_ru: "", name_eng: "" });
    const [savingDetail, setSavingDetail] = useState(false);

    const isEdit = !!product;

    // Load subresources when editing
    useEffect(() => {
        if (!open) return;
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
            // Fetch sub-resources
            const pid = product.id as number;
            setPhotosLoading(true);
            productPhotosApi.getAll(pid)
                .then((data) => setExistingPhotos(Array.isArray(data) ? data : []))
                .catch(() => {})
                .finally(() => setPhotosLoading(false));

            setItemsLoading(true);
            productItemsApi.getAll(pid)
                .then((data) => setItems(Array.isArray(data) ? data : []))
                .catch(() => {})
                .finally(() => setItemsLoading(false));

            setDetailsLoading(true);
            productDetailsApi.getAll(pid)
                .then((data) => setDetails(Array.isArray(data) ? data : []))
                .catch(() => {})
                .finally(() => setDetailsLoading(false));
        } else {
            setForm(makeEmpty());
            setExistingPhotos([]);
            setItems([]);
            setDetails([]);
        }
        setNewPhotoFiles([]);
        setNewPhotoPreview([]);
        setNewItem({ color_id: "", size_id: "", total_count: 1 });
        setNewDetail({ name_uz: "", name_ru: "", name_eng: "" });
    }, [open, product]);

    if (!open) return null;

    const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
        setForm((f) => ({ ...f, [k]: v }));

    const toggleSection = (s: keyof typeof sections) =>
        setSections((p) => ({ ...p, [s]: !p[s] }));

    // Photo handlers
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

    // Item handlers
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
            setItems(Array.isArray(data) ? data : []);
            setNewItem({ color_id: "", size_id: "", total_count: 1 });
        } catch (e: unknown) {
            toastError(e instanceof Error ? e.message : "Xatolik");
        } finally {
            setSavingItem(false);
        }
    };

    const handleDeleteItem = async (itemId: number, productId: number) => {
        try {
            await productItemsApi.delete(itemId);
            setItems((prev) => prev.filter((it) => it.id !== itemId));
        } catch (e: unknown) {
            toastError(e instanceof Error ? e.message : "Xatolik");
        }
    };

    // Detail handlers
    const handleAddDetail = async (productId: number) => {
        if (!newDetail.name_uz || !newDetail.name_ru || !newDetail.name_eng) return;
        setSavingDetail(true);
        try {
            await productDetailsApi.create({ product_id: productId, ...newDetail });
            const data = await productDetailsApi.getAll(productId);
            setDetails(Array.isArray(data) ? data : []);
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
        } catch (e: unknown) {
            toastError(e instanceof Error ? e.message : "Xatolik");
        }
    };

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

            // Upload new photos
            for (const file of newPhotoFiles) {
                try {
                    await productPhotosApi.create(productId, file);
                } catch {}
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
        return url.startsWith("http") ? url : `${BASE_URL}${url}`;
    };

    const getColorName = (id: number) => {
        const c = colors.find((x) => x.id === id);
        return c ? (lang === "RU" ? c.name_ru : c.name_eng) : `#${id}`;
    };

    const getSizeName = (id: number) => {
        const s = sizes.find((x) => x.id === id);
        return s ? s.name : `#${id}`;
    };

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
                            {/* Existing photos */}
                            {photosLoading ? (
                                <div className="flex gap-2 mb-3">
                                    {[1,2,3].map(i => <div key={i} className="h-20 w-20 rounded-lg bg-muted/30 animate-pulse" />)}
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

                            {/* New photos preview */}
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

                            {/* Upload area */}
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
                                    {/* Existing items */}
                                    {itemsLoading ? (
                                        <div className="space-y-2">
                                            {[1,2].map(i => <div key={i} className="h-10 bg-muted/20 rounded-lg animate-pulse" />)}
                                        </div>
                                    ) : items.length > 0 && (
                                        <div className="space-y-2">
                                            {items.map((item) => (
                                                <div key={item.id} className="flex items-center gap-3 glass-subtle rounded-lg px-3 py-2 group">
                                                    <span className="text-xs glass rounded-full px-2 py-0.5 text-primary">{getColorName(item.color_id)}</span>
                                                    <span className="text-xs glass rounded-full px-2 py-0.5">{getSizeName(item.size_id)}</span>
                                                    <span className="text-xs text-muted-foreground ml-auto">{item.total_count} dona</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDeleteItem(item.id, product!.id as number)}
                                                        className="opacity-0 group-hover:opacity-100 glass rounded-lg p-1.5 hover:bg-red-500/20 transition-all"
                                                    >
                                                        <Trash2 className="h-3 w-3 text-red-400" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Add new item */}
                                    <div className="glass-subtle rounded-xl p-3 space-y-2">
                                        <p className="text-xs text-muted-foreground font-medium">Yangi variant qo'shish</p>
                                        <div className="grid grid-cols-3 gap-2">
                                            <select
                                                value={newItem.color_id}
                                                onChange={(e) => setNewItem(n => ({ ...n, color_id: e.target.value }))}
                                                className="glass rounded-lg px-2 py-2 text-xs outline-none bg-black"
                                            >
                                                <option value="">Rang</option>
                                                {colors.map((c) => (
                                                    <option key={c.id} value={c.id}>
                                                        {lang === "RU" ? c.name_ru : c.name_eng}
                                                    </option>
                                                ))}
                                            </select>
                                            <select
                                                value={newItem.size_id}
                                                onChange={(e) => setNewItem(n => ({ ...n, size_id: e.target.value }))}
                                                className="glass rounded-lg px-2 py-2 text-xs outline-none bg-black"
                                            >
                                                <option value="">O'lcham</option>
                                                {sizes.map((s) => (
                                                    <option key={s.id} value={s.id}>{s.name}</option>
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
                                            {savingItem ? <div className="h-3 w-3 rounded-full border-2 border-current border-t-transparent animate-spin" /> : <Plus className="h-3 w-3" />}
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
                                            {[1,2].map(i => <div key={i} className="h-10 bg-muted/20 rounded-lg animate-pulse" />)}
                                        </div>
                                    ) : details.length > 0 && (
                                        <div className="space-y-2">
                                            {details.map((d) => (
                                                <div key={d.id} className="flex items-center gap-3 glass-subtle rounded-lg px-3 py-2 group">
                                                    <div className="flex-1 grid grid-cols-3 gap-2 text-xs">
                                                        <span>{d.name_uz}</span>
                                                        <span className="text-muted-foreground">{d.name_ru}</span>
                                                        <span className="text-muted-foreground">{d.name_eng}</span>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDeleteDetail(d.id)}
                                                        className="opacity-0 group-hover:opacity-100 glass rounded-lg p-1.5 hover:bg-red-500/20 transition-all"
                                                    >
                                                        <Trash2 className="h-3 w-3 text-red-400" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Add new detail */}
                                    <div className="glass-subtle rounded-xl p-3 space-y-2">
                                        <p className="text-xs text-muted-foreground font-medium">Yangi tafsilot qo'shish</p>
                                        <div className="grid grid-cols-3 gap-2">
                                            <input
                                                value={newDetail.name_uz}
                                                onChange={(e) => setNewDetail(d => ({ ...d, name_uz: e.target.value }))}
                                                placeholder="UZ"
                                                className="glass rounded-lg px-2 py-2 text-xs outline-none focus:ring-1 focus:ring-primary/50"
                                            />
                                            <input
                                                value={newDetail.name_ru}
                                                onChange={(e) => setNewDetail(d => ({ ...d, name_ru: e.target.value }))}
                                                placeholder="RU"
                                                className="glass rounded-lg px-2 py-2 text-xs outline-none focus:ring-1 focus:ring-primary/50"
                                            />
                                            <input
                                                value={newDetail.name_eng}
                                                onChange={(e) => setNewDetail(d => ({ ...d, name_eng: e.target.value }))}
                                                placeholder="EN"
                                                className="glass rounded-lg px-2 py-2 text-xs outline-none focus:ring-1 focus:ring-primary/50"
                                            />
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => handleAddDetail(product!.id as number)}
                                            disabled={savingDetail || !newDetail.name_uz || !newDetail.name_ru || !newDetail.name_eng}
                                            className="w-full rounded-lg py-2 text-xs font-semibold flex items-center justify-center gap-1.5 disabled:opacity-50"
                                            style={{ background: "linear-gradient(135deg, hsl(199,89%,48%), hsl(280,60%,55%))", color: "hsl(225,25%,8%)" }}
                                        >
                                            {savingDetail ? <div className="h-3 w-3 rounded-full border-2 border-current border-t-transparent animate-spin" /> : <Plus className="h-3 w-3" />}
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