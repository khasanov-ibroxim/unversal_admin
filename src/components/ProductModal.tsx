import { useEffect, useRef, useState } from "react";
import { X, Check, ImagePlus, Loader2, Plus, Trash2 } from "lucide-react";
import { useStore } from "@/context/StoreContext";
import { useAppToast } from "@/hooks/use-app-toast";
import { BASE_URL, productItemsApi, productPhotosApi } from "@/api";
import type { ApiProduct, ClothingType, ApiProductItem, ApiProductPhoto } from "@/api/products";

// ─── Types ────────────────────────────────────────────────────────────────────
interface ProductFormData {
    category_id: number | "";
    collection_id: number | "";
    name_uz: string;
    name_ru: string;
    name_eng: string;
    description_uz: string;
    description_ru: string;
    description_eng: string;
    price: number | "";
    is_active: boolean;
    clothing_type: ClothingType;
    photos?: File[];
}

interface ProductItemForm {
    color_id: number | "";
    size_id: number | "";
    total_count: number | "";
}

const CLOTHING_OPTIONS: { value: ClothingType; label: string; emoji: string }[] = [
    { value: "erkak",  label: "Erkak",  emoji: "👔" },
    { value: "ayol",   label: "Ayol",   emoji: "👗" },
    { value: "unisex", label: "Unisex", emoji: "🧥" },
];

const EMPTY_FORM: ProductFormData = {
    category_id:     "",
    collection_id:   "",
    name_uz:         "",
    name_ru:         "",
    name_eng:        "",
    description_uz:  "",
    description_ru:  "",
    description_eng: "",
    price:           "",
    is_active:       true,
    clothing_type:   "unisex",
};

// ─── Props ────────────────────────────────────────────────────────────────────
interface ProductModalProps {
    open: boolean;
    onClose: () => void;
    product?: ApiProduct | null;
}

// ─── Component ────────────────────────────────────────────────────────────────
export function ProductModal({ open, onClose, product }: ProductModalProps) {
    const { categories, collections, colors, sizes, addProduct, updateProduct } = useStore();
    const { success, error: toastError } = useAppToast();

    const [form, setForm] = useState<ProductFormData>(EMPTY_FORM);
    const [saving, setSaving] = useState(false);
    const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
    const [existingPhotos, setExistingPhotos] = useState<ApiProductPhoto[]>([]);
    const fileRef = useRef<HTMLInputElement>(null);

    const [productItems, setProductItems] = useState<ApiProductItem[]>([]);
    const [newItem, setNewItem] = useState<ProductItemForm>({ color_id: "", size_id: "", total_count: "" });
    const [showItemForm, setShowItemForm] = useState(false);
    const [loadingItems, setLoadingItems] = useState(false);
    const [pendingItems, setPendingItems] = useState<ProductItemForm[]>([]);

    const usedColorIds = productItems.map(item => item.color_id);
    const usedSizeIds = productItems.map(item => item.size_id);
    const availableColors = product ? colors.filter(c => usedColorIds.includes(c.id)) : colors;
    const availableSizes = product ? sizes.filter(s => usedSizeIds.includes(s.id)) : sizes;
    // Populate form when editing
    useEffect(() => {
        if (!open) return;
        if (product) {
            setForm({
                category_id:     product.category_id,
                collection_id:   product.collection_id,
                name_uz:         product.name_uz,
                name_ru:         product.name_ru,
                name_eng:        product.name_eng,
                description_uz:  product.description_uz,
                description_ru:  product.description_ru,
                description_eng: product.description_eng,
                price:           product.price,
                is_active:       product.is_active,
                clothing_type:   (product.clothing_type as ClothingType) || "unisex",
            });
            loadProductPhotos(product.id);
            loadProductItems(product.id);
            setPendingItems([]);
        } else {
            setForm(EMPTY_FORM);
            setPhotoPreviews([]);
            setExistingPhotos([]);
            setProductItems([]);
            setPendingItems([]);
        }
    }, [open, product]);

    const loadProductPhotos = async (productId: number) => {
        try {
            const photos = await productPhotosApi.getAll(productId);
            setExistingPhotos(Array.isArray(photos) ? photos : []);
        } catch {
            setExistingPhotos([]);
        }
    };

    const loadProductItems = async (productId: number) => {
        setLoadingItems(true);
        try {
            const items = await productItemsApi.getAll(productId);
            const filtered = Array.isArray(items) ? items.filter(item => item.product_id === productId) : [];
            setProductItems(filtered);
        } catch {
            setProductItems([]);
        } finally {
            setLoadingItems(false);
        }
    };

    const set = <K extends keyof ProductFormData>(k: K, v: ProductFormData[K]) =>
        setForm(f => ({ ...f, [k]: v }));

    const handlePhotoChange = (files: FileList | null) => {
        if (!files || files.length === 0) return;
        const newFiles = Array.from(files);
        set("photos", [...(form.photos || []), ...newFiles]);

        newFiles.forEach(file => {
            const reader = new FileReader();
            reader.onload = e => setPhotoPreviews(prev => [...prev, e.target?.result as string]);
            reader.readAsDataURL(file);
        });
    };

    const handleRemoveNewPhoto = (index: number) => {
        setPhotoPreviews(prev => prev.filter((_, i) => i !== index));
        set("photos", form.photos?.filter((_, i) => i !== index));
    };

    const handleRemoveExistingPhoto = async (photoId: number) => {
        try {
            await productPhotosApi.delete(photoId);
            setExistingPhotos(prev => prev.filter(p => p.id !== photoId));
            success("Rasm o'chirildi");
        } catch (e: unknown) {
            toastError(e instanceof Error ? e.message : "Xatolik");
        }
    };

    const handleAddItem = async () => {
        if (!newItem.color_id || !newItem.size_id || !newItem.total_count) {
            toastError("Rang, o'lcham va miqdorni to'ldiring");
            return;
        }

        if (product?.id) {
            try {
                await productItemsApi.create({
                    product_id: product.id,
                    color_id: Number(newItem.color_id),
                    size_id: Number(newItem.size_id),
                    total_count: Number(newItem.total_count),
                });
                success("Variant qo'shildi");
                setNewItem({ color_id: "", size_id: "", total_count: "" });
                setShowItemForm(false);
                await loadProductItems(product.id);
            } catch (e: unknown) {
                toastError(e instanceof Error ? e.message : "Xatolik");
            }
        } else {
            setPendingItems(prev => [...prev, { ...newItem }]);
            setNewItem({ color_id: "", size_id: "", total_count: "" });
            setShowItemForm(false);
        }
    };

    const handleDeleteItem = async (itemId: number) => {
        try {
            await productItemsApi.delete(itemId);
            success("Variant o'chirildi");
            setProductItems(prev => prev.filter(i => i.id !== itemId));
        } catch (e: unknown) {
            toastError(e instanceof Error ? e.message : "Xatolik");
        }
    };

    const handleDeletePendingItem = (index: number) => {
        setPendingItems(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async () => {
        if (
            !form.category_id || !form.collection_id ||
            !form.name_uz || !form.name_ru || !form.name_eng ||
            !form.description_uz || !form.description_ru || !form.description_eng ||
            form.price === ""
        ) {
            toastError("Barcha majburiy maydonlarni to'ldiring");
            return;
        }

        setSaving(true);
        try {
            const data = {
                category_id:     Number(form.category_id),
                collection_id:   Number(form.collection_id),
                name_uz:         form.name_uz,
                name_ru:         form.name_ru,
                name_eng:        form.name_eng,
                description_uz:  form.description_uz,
                description_ru:  form.description_ru,
                description_eng: form.description_eng,
                price:           Number(form.price),
                is_active:       form.is_active,
                clothing_type:   form.clothing_type,
                photo:           form.photos?.[0],
            };

            if (product) {
                await updateProduct(product.id as number, data);

                if (form.photos && form.photos.length > 0) {
                    for (const photo of form.photos) {
                        try {
                            await productPhotosApi.create(product.id, photo);
                        } catch (e: unknown) {
                            console.error("Rasm qo'shishda xatolik:", e);
                        }
                    }
                }

                success("Mahsulot yangilandi");
            } else {
                const result = await addProduct(data);
                success("Mahsulot qo'shildi");

                if (result?.id) {
                    if (form.photos && form.photos.length > 1) {
                        for (let i = 1; i < form.photos.length; i++) {
                            try {
                                await productPhotosApi.create(result.id, form.photos[i]);
                            } catch (e: unknown) {
                                console.error("Rasm qo'shishda xatolik:", e);
                            }
                        }
                    }

                    if (pendingItems.length > 0) {
                        for (const item of pendingItems) {
                            try {
                                await productItemsApi.create({
                                    product_id: result.id,
                                    color_id: Number(item.color_id),
                                    size_id: Number(item.size_id),
                                    total_count: Number(item.total_count),
                                });
                            } catch (e: unknown) {
                                console.error("Variant qo'shishda xatolik:", e);
                            }
                        }
                    }
                }
            }
            onClose();
        } catch (e: unknown) {
            toastError(e instanceof Error ? e.message : "Xatolik yuz berdi");
        } finally {
            setSaving(false);
        }
    };

    if (!open) return null;

    const isEdit = Boolean(product);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />
            <div className="relative glass-strong rounded-2xl w-full max-w-2xl my-8">
                {/* Header */}
                <div className="sticky top-0 z-10 glass-strong flex items-center justify-between px-6 py-4 border-b border-border/30 rounded-t-2xl">
                    <h2 className="text-lg font-bold gradient-text">
                        {isEdit ? "Mahsulotni tahrirlash" : "Yangi mahsulot"}
                    </h2>
                    <button
                        onClick={onClose}
                        className="glass rounded-lg p-2 hover:bg-red-500/20 transition-colors"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <div className="p-6 space-y-5 max-h-[calc(100vh-8rem)] overflow-y-auto">
                    {/* ── Photo upload ── */}
                    <div>
                        <label className="text-xs text-muted-foreground mb-2 block">Rasmlar (bir nechta)</label>

                        {/* Existing photos */}
                        {existingPhotos.length > 0 && (
                            <div className="grid grid-cols-4 gap-2 mb-2">
                                {existingPhotos.map(photo => {
                                    const photoPath = photo.photo || "";
                                    const fullUrl = photoPath.startsWith("http") ? photoPath : `${BASE_URL}/${photoPath}`;
                                    return (
                                        <div key={photo.id} className="relative group">
                                            <img
                                                src={fullUrl}
                                                alt="product"
                                                className="w-full h-24 object-cover rounded-lg"
                                            />
                                            <button
                                                onClick={() => handleRemoveExistingPhoto(photo.id)}
                                                className="absolute top-1 right-1 bg-red-500/80 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <X className="h-3 w-3 text-white" />
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* New photo previews */}
                        {photoPreviews.length > 0 && (
                            <div className="grid grid-cols-4 gap-2 mb-2">
                                {photoPreviews.map((preview, index) => (
                                    <div key={index} className="relative group">
                                        <img
                                            src={preview}
                                            alt="preview"
                                            className="w-full h-24 object-cover rounded-lg"
                                        />
                                        <button
                                            onClick={() => handleRemoveNewPhoto(index)}
                                            className="absolute top-1 right-1 bg-red-500/80 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <X className="h-3 w-3 text-white" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Upload area */}
                        <div
                            className="relative h-32 rounded-xl border-2 border-dashed border-border/40 overflow-hidden cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all flex items-center justify-center"
                            onClick={() => fileRef.current?.click()}
                            onDragOver={e => e.preventDefault()}
                            onDrop={e => {
                                e.preventDefault();
                                handlePhotoChange(e.dataTransfer.files);
                            }}
                        >
                            <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                <ImagePlus className="h-8 w-8 opacity-50" />
                                <p className="text-xs">Rasm yuklash uchun bosing yoki sudrang</p>
                                <p className="text-[10px] opacity-70">Bir nechta rasm tanlash mumkin</p>
                            </div>
                        </div>
                        <input
                            ref={fileRef}
                            type="file"
                            accept="image/*"
                            multiple
                            className="hidden"
                            onChange={e => handlePhotoChange(e.target.files)}
                        />
                    </div>

                    {/* ── Category & Collection ── */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs text-muted-foreground mb-1 block">Kategoriya *</label>
                            <select
                                value={form.category_id}
                                onChange={e => set("category_id", Number(e.target.value) || "")}
                                className="w-full glass rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50 bg-transparent [&>option]:bg-background [&>option]:text-foreground"
                            >
                                <option value="">Tanlang...</option>
                                {categories.map(c => (
                                    <option key={c.id} value={c.id}>{c.name_uz}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs text-muted-foreground mb-1 block">Kolleksiya *</label>
                            <select
                                value={form.collection_id}
                                onChange={e => set("collection_id", Number(e.target.value) || "")}
                                className="w-full glass rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50 bg-transparent [&>option]:bg-background [&>option]:text-foreground"
                            >
                                <option value="">Tanlang...</option>
                                {collections.map(c => (
                                    <option key={c.id} value={c.id}>{c.name_uz}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* ── Clothing type (gender) ── */}
                    <div>
                        <label className="text-xs text-muted-foreground mb-2 block">
                            Kiyim turi (jins) *
                        </label>
                        <div className="flex gap-2">
                            {CLOTHING_OPTIONS.map(opt => (
                                <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() => set("clothing_type", opt.value)}
                                    className={`flex-1 flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium border transition-all ${
                                        form.clothing_type === opt.value
                                            ? opt.value === "erkak"
                                                ? "bg-blue-500/20 border-blue-500/50 text-blue-400"
                                                : opt.value === "ayol"
                                                    ? "bg-pink-500/20 border-pink-500/50 text-pink-400"
                                                    : "bg-yellow-500/20 border-yellow-500/50 text-yellow-400"
                                            : "glass border-border/30 text-muted-foreground hover:border-primary/40"
                                    }`}
                                >
                                    <span>{opt.emoji}</span>
                                    <span>{opt.label}</span>
                                    {form.clothing_type === opt.value && (
                                        <Check className="h-3.5 w-3.5 ml-auto" />
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* ── Names ── */}
                    <div>
                        <label className="text-xs text-muted-foreground mb-2 block">Nomi *</label>
                        <div className="grid grid-cols-3 gap-2">
                            {(["name_uz", "name_ru", "name_eng"] as const).map((field, i) => (
                                <div key={field}>
                                    <label className="text-[10px] text-muted-foreground/70 mb-1 block">
                                        {["UZ", "RU", "EN"][i]}
                                    </label>
                                    <input
                                        value={form[field]}
                                        onChange={e => set(field, e.target.value)}
                                        placeholder={["O'zbek", "Русский", "English"][i]}
                                        className="w-full glass rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* ── Descriptions ── */}
                    <div>
                        <label className="text-xs text-muted-foreground mb-2 block">Tavsif *</label>
                        <div className="space-y-2">
                            {(["description_uz", "description_ru", "description_eng"] as const).map((field, i) => (
                                <div key={field}>
                                    <label className="text-[10px] text-muted-foreground/70 mb-1 block">
                                        {["UZ", "RU", "EN"][i]}
                                    </label>
                                    <textarea
                                        value={form[field]}
                                        onChange={e => set(field, e.target.value)}
                                        placeholder={["O'zbek tavsif", "Описание на русском", "English description"][i]}
                                        rows={2}
                                        className="w-full glass rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* ── Price & Status ── */}
                    <div className="flex items-end gap-4">
                        <div className="flex-1">
                            <label className="text-xs text-muted-foreground mb-1 block">Narxi (so'm) *</label>
                            <input
                                type="number"
                                min={0}
                                value={form.price}
                                onChange={e => set("price", e.target.value === "" ? "" : Number(e.target.value))}
                                placeholder="0"
                                className="w-full glass rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50"
                            />
                        </div>
                        <label className="flex items-center gap-2 text-sm cursor-pointer pb-2">
                            <input
                                type="checkbox"
                                checked={form.is_active}
                                onChange={e => set("is_active", e.target.checked)}
                                className="accent-primary w-4 h-4"
                            />
                            Faol
                        </label>
                    </div>

                    {/* ── Product Items (Size/Color variants) ── */}
                    <div className="border-t border-border/30 pt-5 mt-2">
                        <div className="flex items-center justify-between mb-3">
                            <div>
                                <h3 className="text-sm font-semibold">Variantlar (Rang & O'lcham)</h3>
                                <p className="text-xs text-muted-foreground mt-0.5">Mahsulot uchun rang va o'lcham kombinatsiyalari</p>
                            </div>
                            <button
                                onClick={() => setShowItemForm(!showItemForm)}
                                className="glass rounded-lg px-3 py-1.5 flex items-center gap-1.5 hover:bg-primary/20 transition-colors text-xs font-medium"
                            >
                                <Plus className="h-3.5 w-3.5" />
                                Qo'shish
                            </button>
                        </div>

                        {showItemForm && (
                            <div className="glass-subtle rounded-xl p-4 mb-3 space-y-3">
                                <div className="grid grid-cols-3 gap-2">
                                    <div>
                                        <label className="text-xs text-muted-foreground mb-1 block">Rang</label>
                                        <select
                                            value={newItem.color_id}
                                            onChange={e => setNewItem(prev => ({ ...prev, color_id: Number(e.target.value) || "" }))}
                                            className="w-full glass rounded-lg px-2 py-1.5 text-xs outline-none focus:ring-2 focus:ring-primary/50 bg-transparent [&>option]:bg-background [&>option]:text-foreground"
                                        >
                                            <option value="">Tanlang</option>
                                            {(product && productItems.length > 0 ? availableColors : colors).map(c => (
                                                <option key={c.id} value={c.id}>{c.color_code}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs text-muted-foreground mb-1 block">O'lcham</label>
                                        <select
                                            value={newItem.size_id}
                                            onChange={e => setNewItem(prev => ({ ...prev, size_id: Number(e.target.value) || "" }))}
                                            className="w-full glass rounded-lg px-2 py-1.5 text-xs outline-none focus:ring-2 focus:ring-primary/50 bg-transparent [&>option]:bg-background [&>option]:text-foreground"
                                        >
                                            <option value="">Tanlang</option>
                                            {(product && productItems.length > 0 ? availableSizes : sizes).map(s => (
                                                <option key={s.id} value={s.id}>{s.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs text-muted-foreground mb-1 block">Miqdor</label>
                                        <input
                                            type="number"
                                            min={0}
                                            value={newItem.total_count}
                                            onChange={e => setNewItem(prev => ({ ...prev, total_count: e.target.value === "" ? "" : Number(e.target.value) }))}
                                            placeholder="0"
                                            className="w-full glass rounded-lg px-2 py-1.5 text-xs outline-none focus:ring-2 focus:ring-primary/50"
                                        />
                                    </div>
                                </div>
                                <div className="flex gap-2 justify-end">
                                    <button
                                        onClick={() => {
                                            setShowItemForm(false);
                                            setNewItem({ color_id: "", size_id: "", total_count: "" });
                                        }}
                                        className="glass rounded-lg px-3 py-1.5 text-xs hover:bg-muted/20"
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                    <button
                                        onClick={handleAddItem}
                                        className="rounded-lg px-3 py-1.5 text-xs font-semibold flex items-center gap-1"
                                        style={{
                                            background: "linear-gradient(135deg, hsl(199,89%,48%), hsl(280,60%,55%))",
                                            color: "hsl(225,25%,8%)",
                                        }}
                                    >
                                        <Check className="h-3 w-3" />
                                        Qo'shish
                                    </button>
                                </div>
                            </div>
                        )}

                        <div className="space-y-2 max-h-48 overflow-y-auto">
                            {product ? (
                                loadingItems ? (
                                    <div className="text-center py-4 text-xs text-muted-foreground">Yuklanmoqda...</div>
                                ) : productItems.length === 0 ? (
                                    null
                                ) : (
                                    productItems.map(item => {
                                        const color = colors.find(c => c.id === item.color_id);
                                        const size = sizes.find(s => s.id === item.size_id);
                                        return (
                                            <div
                                                key={item.id}
                                                className="flex items-center gap-2 glass-subtle rounded-lg px-3 py-2 group hover:bg-muted/10"
                                            >
                                                <div
                                                    className="h-5 w-5 rounded-full shrink-0 border border-white/20"
                                                    style={{ backgroundColor: color?.color_code || "#ccc" }}
                                                />
                                                <span className="text-xs font-medium">{size?.name || "?"}</span>
                                                <span className="text-xs text-muted-foreground ml-auto">×{item.total_count}</span>
                                                <button
                                                    onClick={() => handleDeleteItem(item.id)}
                                                    className="opacity-0 group-hover:opacity-100 glass rounded-lg p-1 hover:bg-red-500/20 transition-all"
                                                >
                                                    <Trash2 className="h-3 w-3 text-red-400" />
                                                </button>
                                            </div>
                                        );
                                    })
                                )
                            ) : (
                                pendingItems.length === 0 ? (
                                    null
                                ) : (
                                    pendingItems.map((item, index) => {
                                        const color = colors.find(c => c.id === Number(item.color_id));
                                        const size = sizes.find(s => s.id === Number(item.size_id));
                                        return (
                                            <div
                                                key={index}
                                                className="flex items-center gap-2 glass-subtle rounded-lg px-3 py-2 group hover:bg-muted/10"
                                            >
                                                <div
                                                    className="h-5 w-5 rounded-full shrink-0 border border-white/20"
                                                    style={{ backgroundColor: color?.color_code || "#ccc" }}
                                                />
                                                <span className="text-xs font-medium">{size?.name || "?"}</span>
                                                <span className="text-xs text-muted-foreground ml-auto">×{item.total_count}</span>
                                                <button
                                                    onClick={() => handleDeletePendingItem(index)}
                                                    className="opacity-0 group-hover:opacity-100 glass rounded-lg p-1 hover:bg-red-500/20 transition-all"
                                                >
                                                    <Trash2 className="h-3 w-3 text-red-400" />
                                                </button>
                                            </div>
                                        );
                                    })
                                )
                            )}
                        </div>
                    </div>

                    {/* ── Actions ── */}
                    <div className="flex gap-3 pt-1">
                        <button
                            onClick={onClose}
                            className="flex-1 glass rounded-xl py-2.5 text-sm font-medium hover:bg-muted/20 transition-colors"
                        >
                            Bekor
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={saving}
                            className="flex-1 rounded-xl py-2.5 text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2 transition-all"
                            style={{
                                background: "linear-gradient(135deg, hsl(199,89%,48%), hsl(280,60%,55%))",
                                color: "hsl(225,25%,8%)",
                            }}
                        >
                            {saving
                                ? <Loader2 className="h-4 w-4 animate-spin" />
                                : <Check className="h-4 w-4" />
                            }
                            {isEdit ? "Saqlash" : "Qo'shish"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}