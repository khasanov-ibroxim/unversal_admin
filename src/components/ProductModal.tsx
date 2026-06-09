import { useEffect, useRef, useState } from "react";
import { X, Check, ImagePlus, Loader2, Plus, Trash2 } from "lucide-react";
import { useStore } from "@/context/StoreContext";
import { useAppToast } from "@/hooks/use-app-toast";
import { BASE_URL, productItemsApi, productPhotosApi, productDetailsApi } from "@/api";
import type { ApiProduct, ClothingType, ApiProductItem, ApiProductPhoto, ApiProductDetail } from "@/api/products";
import { useLang } from "@/context/LangContext";
import { t } from "@/i18n/translations";

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

interface ProductDetailForm {
    name_uz: string;
    name_ru: string;
    name_eng: string;
}

// Regular photo item component
function PhotoItem({
    photo,
    onRemove,
    isFirst
}: {
    photo: { url: string; isExisting: boolean; photoId?: number };
    onRemove: () => void;
    isFirst?: boolean;
}) {
    return (
        <div className="relative group">
            <img
                src={photo.url}
                alt="product"
                className="w-full h-24 object-cover rounded-lg"
            />
            {isFirst && (
                <div className="absolute bottom-1 left-1 bg-primary/90 rounded px-1.5 py-0.5">
                    <span className="text-[10px] font-semibold text-white">ASOSIY</span>
                </div>
            )}
            <button
                type="button"
                onClick={onRemove}
                className="absolute top-1 right-1 bg-red-500/80 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
            >
                <X className="h-3 w-3 text-white" />
            </button>
        </div>
    );
}

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
    const { lang } = useLang();
    const tr = t(lang);

    const [form, setForm] = useState<ProductFormData>(EMPTY_FORM);
    const [saving, setSaving] = useState(false);
    const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
    const [existingPhotos, setExistingPhotos] = useState<ApiProductPhoto[]>([]);
    const [allPhotos, setAllPhotos] = useState<Array<{ id: string; url: string; isExisting: boolean; photoId?: number; file?: File }>>([]);
    const fileRef = useRef<HTMLInputElement>(null);

    const [productItems, setProductItems] = useState<ApiProductItem[]>([]);
    const [newItem, setNewItem] = useState<ProductItemForm>({ color_id: "", size_id: "", total_count: "" });
    const [showItemForm, setShowItemForm] = useState(false);
    const [loadingItems, setLoadingItems] = useState(false);
    const [pendingItems, setPendingItems] = useState<ProductItemForm[]>([]);
    const [showColorDropdown, setShowColorDropdown] = useState(false);
    const [editingItem, setEditingItem] = useState<{ id: number; color_id: number; size_id: number; total_count: number } | null>(null);

    // Product Details states
    const [productDetails, setProductDetails] = useState<ApiProductDetail[]>([]);
    const [newDetail, setNewDetail] = useState<ProductDetailForm>({ name_uz: "", name_ru: "", name_eng: "" });
    const [showDetailForm, setShowDetailForm] = useState(false);
    const [loadingDetails, setLoadingDetails] = useState(false);
    const [pendingDetails, setPendingDetails] = useState<ProductDetailForm[]>([]);
    const [editingDetail, setEditingDetail] = useState<{ id: number; name_uz: string; name_ru: string; name_eng: string } | null>(null);

    const CLOTHING_OPTIONS: { value: ClothingType; label: string; emoji: string }[] = [
        { value: "erkak",  label: tr.male,  emoji: "👔" },
        { value: "ayol",   label: tr.female,   emoji: "👗" },
        { value: "unisex", label: tr.unisex, emoji: "🧥" },
    ];

    // Populate form when editing
    useEffect(() => {
        if (!open) {
            // Modal yopilganda barcha state'larni tozalash
            setForm(EMPTY_FORM);
            setPhotoPreviews([]);
            setExistingPhotos([]);
            setAllPhotos([]);
            setProductItems([]);
            setPendingItems([]);
            setProductDetails([]);
            setPendingDetails([]);
            setShowItemForm(false);
            setShowDetailForm(false);
            return;
        }

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
                photos:          [], // Yangi rasmlar uchun bo'sh array
            });
            setPhotoPreviews([]); // Yangi preview'larni tozalash
            loadProductPhotos(product.id);
            loadProductItems(product.id);
            loadProductDetails(product.id);
            setPendingItems([]);
            setPendingDetails([]);
        } else {
            setForm(EMPTY_FORM);
            setPhotoPreviews([]);
            setExistingPhotos([]);
            setAllPhotos([]);
            setProductItems([]);
            setPendingItems([]);
            setProductDetails([]);
            setPendingDetails([]);
        }
    }, [open, product]);

    const loadProductPhotos = async (productId: number) => {
        try {
            const photos = await productPhotosApi.getAll(productId);
            const photosList = Array.isArray(photos) ? photos : [];
            setExistingPhotos(photosList);

            // Convert to allPhotos format
            const timestamp = new Date().getTime();
            const converted = photosList.map((photo, index) => {
                const photoPath = photo.photo_url || photo.photo || "";
                let fullUrl = photoPath.startsWith("http") ? photoPath : `${BASE_URL}/${photoPath}`;
                // Cache busting: har safar yangi versiyani yuklash uchun
                fullUrl = `${fullUrl}?v=${timestamp}`;
                return {
                    id: `existing-${photo.id}-${index}`,
                    url: fullUrl,
                    isExisting: true,
                    photoId: photo.id,
                };
            });
            setAllPhotos(converted);
        } catch {
            setExistingPhotos([]);
            setAllPhotos([]);
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

    const loadProductDetails = async (productId: number) => {
        setLoadingDetails(true);
        try {
            const details = await productDetailsApi.getByProduct(productId);
            setProductDetails(Array.isArray(details) ? details : []);
        } catch {
            setProductDetails([]);
        } finally {
            setLoadingDetails(false);
        }
    };

    const set = <K extends keyof ProductFormData>(k: K, v: ProductFormData[K]) =>
        setForm(f => ({ ...f, [k]: v }));

    const handlePhotoChange = (files: FileList | null) => {
        if (!files || files.length === 0) return;
        const newFiles = Array.from(files);

        // Add new photos to allPhotos array
        newFiles.forEach((file, index) => {
            const reader = new FileReader();
            reader.onload = e => {
                const url = e.target?.result as string;
                setAllPhotos(prev => [...prev, {
                    id: `new-${Date.now()}-${index}`,
                    url,
                    isExisting: false,
                    file,
                }]);
            };
            reader.readAsDataURL(file);
        });
    };

    const handleRemovePhoto = async (id: string) => {
        const photo = allPhotos.find(p => p.id === id);
        if (!photo) return;

        if (photo.isExisting && photo.photoId) {
            try {
                await productPhotosApi.delete(photo.photoId);
                success(tr.photoDeleted);
            } catch (e: unknown) {
                toastError(e instanceof Error ? e.message : tr.errorOccurred);
                return;
            }
        }

        setAllPhotos(prev => prev.filter(p => p.id !== id));
    };

    const handleAddItem = async () => {
        if (!newItem.color_id || !newItem.size_id || !newItem.total_count) {
            toastError(tr.fillColorSizeQuantity);
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
                success(tr.variantAdded);
                setNewItem({ color_id: "", size_id: "", total_count: "" });
                setShowItemForm(false);
                await loadProductItems(product.id);
            } catch (e: unknown) {
                toastError(e instanceof Error ? e.message : tr.errorOccurred);
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
            success(tr.variantDeleted);
            setProductItems(prev => prev.filter(i => i.id !== itemId));
        } catch (e: unknown) {
            toastError(e instanceof Error ? e.message : tr.errorOccurred);
        }
    };

    const handleEditItem = (item: ApiProductItem) => {
        setEditingItem({
            id: item.id,
            color_id: item.color_id,
            size_id: item.size_id,
            total_count: item.total_count,
        });
    };

    const handleUpdateItem = async () => {
        if (!editingItem) return;
        try {
            await productItemsApi.update(editingItem.id, {
                color_id: editingItem.color_id,
                size_id: editingItem.size_id,
                total_count: editingItem.total_count,
            });
            success(tr.variantUpdated || "Variant yangilandi");
            setEditingItem(null);
            if (product?.id) {
                await loadProductItems(product.id);
            }
        } catch (e: unknown) {
            toastError(e instanceof Error ? e.message : tr.errorOccurred);
        }
    };

    const handleDeletePendingItem = (index: number) => {
        setPendingItems(prev => prev.filter((_, i) => i !== index));
    };

    // Product Details handlers
    const handleAddDetail = async () => {
        if (!newDetail.name_uz || !newDetail.name_ru || !newDetail.name_eng) {
            toastError(tr.fillAllFields);
            return;
        }

        if (product?.id) {
            try {
                await productDetailsApi.create({
                    product_id: product.id,
                    name_uz: newDetail.name_uz,
                    name_ru: newDetail.name_ru,
                    name_eng: newDetail.name_eng,
                });
                success(tr.detailAdded || "Detail qo'shildi");
                setNewDetail({ name_uz: "", name_ru: "", name_eng: "" });
                setShowDetailForm(false);
                await loadProductDetails(product.id);
            } catch (e: unknown) {
                toastError(e instanceof Error ? e.message : tr.errorOccurred);
            }
        } else {
            setPendingDetails(prev => [...prev, { ...newDetail }]);
            setNewDetail({ name_uz: "", name_ru: "", name_eng: "" });
            setShowDetailForm(false);
        }
    };

    const handleDeleteDetail = async (detailId: number) => {
        try {
            await productDetailsApi.delete(detailId);
            success(tr.detailDeleted || "Detail o'chirildi");
            setProductDetails(prev => prev.filter(d => d.id !== detailId));
        } catch (e: unknown) {
            toastError(e instanceof Error ? e.message : tr.errorOccurred);
        }
    };

    const handleEditDetail = (detail: ApiProductDetail) => {
        setEditingDetail({
            id: detail.id,
            name_uz: detail.name_uz,
            name_ru: detail.name_ru,
            name_eng: detail.name_eng,
        });
    };

    const handleUpdateDetail = async () => {
        if (!editingDetail) return;
        try {
            await productDetailsApi.update(editingDetail.id, {
                name_uz: editingDetail.name_uz,
                name_ru: editingDetail.name_ru,
                name_eng: editingDetail.name_eng,
            });
            success(tr.detailUpdated || "Detail yangilandi");
            setEditingDetail(null);
            if (product?.id) {
                await loadProductDetails(product.id);
            }
        } catch (e: unknown) {
            toastError(e instanceof Error ? e.message : tr.errorOccurred);
        }
    };

    const handleDeletePendingDetail = (index: number) => {
        setPendingDetails(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async () => {
        if (
            !form.category_id || !form.collection_id ||
            !form.name_uz || !form.name_ru || !form.name_eng ||
            !form.description_uz || !form.description_ru || !form.description_eng ||
            form.price === ""
        ) {
            toastError(tr.fillAllFields);
            return;
        }

        // Check if variants exist (mandatory)
        const hasVariants = product ? productItems.length > 0 : pendingItems.length > 0;
        if (!hasVariants) {
            toastError(tr.variantRequired || "Kamida bitta variant qo'shing (rang, o'lcham, miqdor)");
            return;
        }

        setSaving(true);
        try {
            const newPhotos = allPhotos.filter(p => !p.isExisting && p.file);

            if (product) {
                // EDIT MODE: Mahsulotni yangilash
                const updateData = {
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
                };

                await updateProduct(product.id as number, updateData);

                // Yangi rasmlarni qo'shish
                if (newPhotos.length > 0) {
                    for (const photo of newPhotos) {
                        try {
                            await productPhotosApi.create(product.id, photo.file!);
                        } catch (e: unknown) {
                            console.error("Rasm qo'shishda xatolik:", e);
                            toastError(e instanceof Error ? e.message : tr.errorOccurred);
                        }
                    }
                }

                success(tr.productUpdated);
            } else {
                // CREATE MODE: Yangi mahsulot yaratish
                const firstPhoto = newPhotos[0]?.file;
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
                    photo:           firstPhoto,
                };

                const result = await addProduct(data);

                if (result?.id) {
                    // Qo'shimcha rasmlarni yuborish (birinchi rasm allaqachon yuborilgan)
                    if (newPhotos.length > 1) {
                        for (let i = 1; i < newPhotos.length; i++) {
                            try {
                                await productPhotosApi.create(result.id, newPhotos[i].file!);
                            } catch (e: unknown) {
                                console.error("Rasm qo'shishda xatolik:", e);
                            }
                        }
                    }

                    // Pending variantlarni qo'shish
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

                success(tr.productAdded);
            }

            // State'larni tozalash
            setForm(EMPTY_FORM);
            setPhotoPreviews([]);
            setExistingPhotos([]);
            setAllPhotos([]);
            setProductItems([]);
            setPendingItems([]);

            onClose();
        } catch (e: unknown) {
            toastError(e instanceof Error ? e.message : tr.errorOccurred);
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
                        {isEdit ? tr.editProductTitle : tr.newProductTitle}
                    </h2>
                    <button
                        onClick={onClose}
                        className="glass rounded-lg p-2 hover:bg-red-500/20 transition-colors"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <div className="p-6 space-y-5 max-h-[calc(100vh-8rem)] overflow-y-auto overflow-x-visible">
                    {/* ── Photo upload ── */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-xs text-muted-foreground">{tr.photos}</label>
                            <span className="text-[10px] text-muted-foreground">
                                Birinchi rasm asosiy rasm sifatida ko'rsatiladi
                            </span>
                        </div>

                        {/* All photos (simple grid) */}
                        {allPhotos.length > 0 && (
                            <div className="grid grid-cols-4 gap-2 mb-2">
                                {allPhotos.map((photo, index) => (
                                    <PhotoItem
                                        key={photo.id}
                                        photo={photo}
                                        onRemove={() => handleRemovePhoto(photo.id)}
                                        isFirst={index === 0}
                                    />
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
                                <p className="text-xs">{tr.uploadPhoto}</p>
                                <p className="text-[10px] opacity-70">{tr.multiplePhotos}</p>
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
                            <label className="text-xs text-muted-foreground mb-1 block">{tr.categoryRequired}</label>
                            <select
                                value={form.category_id}
                                onChange={e => set("category_id", Number(e.target.value) || "")}
                                className="w-full glass rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50 bg-transparent [&>option]:bg-background [&>option]:text-foreground"
                            >
                                <option value="">{tr.selectOption}</option>
                                {categories.map(c => (
                                    <option key={c.id} value={c.id}>{c.name_uz}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs text-muted-foreground mb-1 block">{tr.collectionRequired}</label>
                            <select
                                value={form.collection_id}
                                onChange={e => set("collection_id", Number(e.target.value) || "")}
                                className="w-full glass rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50 bg-transparent [&>option]:bg-background [&>option]:text-foreground"
                            >
                                <option value="">{tr.selectOption}</option>
                                {collections.map(c => (
                                    <option key={c.id} value={c.id}>{c.name_uz}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* ── Clothing type (gender) ── */}
                    <div>
                        <label className="text-xs text-muted-foreground mb-2 block">
                            {tr.clothingType}
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
                        <label className="text-xs text-muted-foreground mb-2 block">{tr.nameRequired}</label>
                        <div className="grid grid-cols-3 gap-2">
                            {(["name_uz", "name_ru", "name_eng"] as const).map((field, i) => (
                                <div key={field}>
                                    <label className="text-[10px] text-muted-foreground/70 mb-1 block">
                                        {["UZ", "RU", "EN"][i]}
                                    </label>
                                    <input
                                        value={form[field]}
                                        onChange={e => set(field, e.target.value)}
                                        placeholder={[tr.uzbek, tr.russian, tr.english][i]}
                                        className="w-full glass rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* ── Descriptions ── */}
                    <div>
                        <label className="text-xs text-muted-foreground mb-2 block">{tr.descriptionRequired}</label>
                        <div className="space-y-2">
                            {(["description_uz", "description_ru", "description_eng"] as const).map((field, i) => (
                                <div key={field}>
                                    <label className="text-[10px] text-muted-foreground/70 mb-1 block">
                                        {["UZ", "RU", "EN"][i]}
                                    </label>
                                    <textarea
                                        value={form[field]}
                                        onChange={e => set(field, e.target.value)}
                                        placeholder={[tr.uzbekDescription, tr.russianDescription, tr.englishDescription][i]}
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
                            <label className="text-xs text-muted-foreground mb-1 block">{tr.priceRequired}</label>
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
                            {tr.active}
                        </label>
                    </div>

                    {/* ── Product Items (Size/Color variants) ── */}
                    <div className="border-t border-border/30 pt-5 mt-2">
                        <div className="flex items-center justify-between mb-3">
                            <div>
                                <h3 className="text-sm font-semibold">{tr.variants}</h3>
                                <p className="text-xs text-muted-foreground mt-0.5">{tr.variantsDescription}</p>
                            </div>
                            <button
                                onClick={() => setShowItemForm(!showItemForm)}
                                className="glass rounded-lg px-3 py-1.5 flex items-center gap-1.5 hover:bg-primary/20 transition-colors text-xs font-medium"
                            >
                                <Plus className="h-3.5 w-3.5" />
                                {tr.add}
                            </button>
                        </div>

                        {showItemForm && (
                            <div className="glass-subtle rounded-xl p-4 mb-3 space-y-3">
                                <div className="grid grid-cols-3 gap-2">
                                    <div className="relative z-20">
                                        <label className="text-xs text-muted-foreground mb-1 block">{tr.color}</label>
                                        <button
                                            type="button"
                                            onClick={() => setShowColorDropdown(!showColorDropdown)}
                                            className="w-full glass rounded-lg px-2 py-1.5 text-xs outline-none focus:ring-2 focus:ring-primary/50 flex items-center gap-2 text-left"
                                        >
                                            {newItem.color_id ? (
                                                <>
                                                    <div
                                                        className="h-4 w-4 rounded-full shrink-0 border border-white/20"
                                                        style={{ backgroundColor: colors.find(c => c.id === Number(newItem.color_id))?.color_code || "#ccc" }}
                                                    />
                                                    <span className="font-mono">
                                                        {colors.find(c => c.id === Number(newItem.color_id))?.color_code}
                                                    </span>
                                                </>
                                            ) : (
                                                <span className="text-muted-foreground">{tr.selectOption}</span>
                                            )}
                                        </button>
                                        {showColorDropdown && (
                                            <>
                                                {/* Backdrop to close dropdown */}
                                                <div
                                                    className="fixed inset-0 z-[51]"
                                                    onClick={() => setShowColorDropdown(false)}
                                                />
                                                {/* Dropdown menu - opens upward */}
                                                <div className="absolute z-[52] w-full bottom-full mb-1 bg-background rounded-lg border border-border/30 max-h-48 overflow-y-auto shadow-2xl">
                                                    {colors.map(c => (
                                                        <button
                                                            key={c.id}
                                                            type="button"
                                                            onClick={() => {
                                                                setNewItem(prev => ({ ...prev, color_id: c.id }));
                                                                setShowColorDropdown(false);
                                                            }}
                                                            className="w-full flex items-center gap-2 px-2 py-1.5 text-xs hover:bg-muted/20 transition-colors first:rounded-t-lg last:rounded-b-lg"
                                                        >
                                                            <div
                                                                className="h-4 w-4 rounded-full shrink-0 border border-white/20"
                                                                style={{ backgroundColor: c.color_code }}
                                                            />
                                                            <span className="font-mono">{c.color_code}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                    <div>
                                        <label className="text-xs text-muted-foreground mb-1 block">{tr.size}</label>
                                        <select
                                            value={newItem.size_id}
                                            onChange={e => setNewItem(prev => ({ ...prev, size_id: Number(e.target.value) || "" }))}
                                            className="w-full glass rounded-lg px-2 py-1.5 text-xs outline-none focus:ring-2 focus:ring-primary/50 bg-transparent [&>option]:bg-background [&>option]:text-foreground"
                                        >
                                            <option value="">{tr.selectOption}</option>
                                            {sizes.map(s => (
                                                <option key={s.id} value={s.id}>{s.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs text-muted-foreground mb-1 block">{tr.quantity}</label>
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
                                            setShowColorDropdown(false);
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
                                        {tr.add}
                                    </button>
                                </div>
                            </div>
                        )}

                        <div className="space-y-2 max-h-48 overflow-y-auto">
                            {product ? (
                                loadingItems ? (
                                    <div className="text-center py-4 text-xs text-muted-foreground">{tr.loading}</div>
                                ) : productItems.length === 0 ? (
                                    null
                                ) : (
                                    productItems.map(item => {
                                        const color = colors.find(c => c.id === item.color_id);
                                        const size = sizes.find(s => s.id === item.size_id);
                                        const isEditing = editingItem?.id === item.id;

                                        if (isEditing) {
                                            return (
                                                <div key={item.id} className="glass-subtle rounded-lg p-3 space-y-2">
                                                    <div className="grid grid-cols-3 gap-2">
                                                        <select
                                                            value={editingItem.color_id}
                                                            onChange={e => setEditingItem(prev => prev ? {...prev, color_id: Number(e.target.value)} : null)}
                                                            className="glass rounded-lg px-2 py-1.5 text-xs outline-none focus:ring-2 focus:ring-primary/50 bg-transparent [&>option]:bg-background [&>option]:text-foreground"
                                                        >
                                                            {colors.map(c => (
                                                                <option key={c.id} value={c.id}>{c.color_code}</option>
                                                            ))}
                                                        </select>
                                                        <select
                                                            value={editingItem.size_id}
                                                            onChange={e => setEditingItem(prev => prev ? {...prev, size_id: Number(e.target.value)} : null)}
                                                            className="glass rounded-lg px-2 py-1.5 text-xs outline-none focus:ring-2 focus:ring-primary/50 bg-transparent [&>option]:bg-background [&>option]:text-foreground"
                                                        >
                                                            {sizes.map(s => (
                                                                <option key={s.id} value={s.id}>{s.name}</option>
                                                            ))}
                                                        </select>
                                                        <input
                                                            type="number"
                                                            min={0}
                                                            value={editingItem.total_count}
                                                            onChange={e => setEditingItem(prev => prev ? {...prev, total_count: Number(e.target.value)} : null)}
                                                            className="glass rounded-lg px-2 py-1.5 text-xs outline-none focus:ring-2 focus:ring-primary/50"
                                                        />
                                                    </div>
                                                    <div className="flex gap-2 justify-end">
                                                        <button
                                                            onClick={() => setEditingItem(null)}
                                                            className="glass rounded-lg px-2 py-1 text-xs hover:bg-muted/20"
                                                        >
                                                            <X className="h-3 w-3" />
                                                        </button>
                                                        <button
                                                            onClick={handleUpdateItem}
                                                            className="glass rounded-lg px-2 py-1 text-xs hover:bg-primary/20"
                                                        >
                                                            <Check className="h-3 w-3 text-primary" />
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        }

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
                                                    onClick={() => handleEditItem(item)}
                                                    className="opacity-0 group-hover:opacity-100 glass rounded-lg p-1 hover:bg-primary/20 transition-all"
                                                    title="Edit"
                                                >
                                                    <Check className="h-3 w-3 text-primary" />
                                                </button>
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
                            {tr.cancel}
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
                            {isEdit ? tr.save : tr.add}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}