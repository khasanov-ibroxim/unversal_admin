import { AdminLayout } from "@/components/AdminLayout";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { Search, Plus, Edit, Trash2, Eye, Package, X, ImagePlus, RefreshCw, AlertCircle, Filter, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { useState, useEffect } from "react";
import { useStore } from "@/context/StoreContext";
import { useLang } from "@/context/LangContext";
import { ProductModal } from "@/components/ProductModal";
import { DeleteModal } from "@/components/DeleteModal";
import { useAppToast } from "@/hooks/use-app-toast";
import type { ApiProduct } from "@/api";
import { BASE_URL } from "@/api";

function ProductImage({ product }: { product: ApiProduct }) {
    if (product.product_photos && product.product_photos.length > 0){
        const photoUrl = product.product_photos[0].photo_url || product.product_photos[0].photo;

        if (photoUrl) {
            const src = photoUrl.startsWith("http") ? photoUrl : `${BASE_URL}/${photoUrl}`;
            return <img src={src} alt={product.name_eng} className="w-full h-full object-cover" />;
        }
    }

    return (
        <div className="w-full h-full flex items-center justify-center bg-primary/10">
            <ImagePlus className="h-6 w-6 text-primary/40" />
        </div>
    );
}

export default function Products() {
    const { products, categories, collections, deleteProduct, productsLoading, productsError, refreshProducts } = useStore();
    const { tr, lang } = useLang();
    const { success, error: toastError } = useAppToast();

    const [search, setSearch] = useState("");
    const [filterCat, setFilterCat] = useState("");
    const [filterCollection, setFilterCollection] = useState("");
    const [filterStatus, setFilterStatus] = useState("");
    const [filterMinPrice, setFilterMinPrice] = useState("");
    const [filterMaxPrice, setFilterMaxPrice] = useState("");
    const [showAdvancedFilter, setShowAdvancedFilter] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(12);
    const [modalOpen, setModalOpen] = useState(false);
    const [editProduct, setEditProduct] = useState<ApiProduct | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<ApiProduct | null>(null);
    const [viewProduct, setViewProduct] = useState<ApiProduct | null>(null);

    const getCategoryName = (id: number) => {
        const cat = categories.find((c) => c.id === id);
        if (!cat) return "—";
        return lang === "RU" ? cat.name_ru : cat.name_eng;
    };

    const getProductName = (p: ApiProduct) => lang === "RU" ? p.name_ru : p.name_eng;
    const getProductDesc = (p: ApiProduct) => lang === "RU" ? p.description_ru : p.description_eng;

    const filtered = products.filter((p) => {
        const name = getProductName(p);
        const matchSearch = name.toLowerCase().includes(search.toLowerCase());
        const matchCat = !filterCat || String(p.category_id) === filterCat;
        const matchCollection = !filterCollection || String(p.collection_id) === filterCollection;
        const matchStatus =
            !filterStatus ||
            (filterStatus === "active" && p.is_active) ||
            (filterStatus === "inactive" && !p.is_active);

        let matchMinPrice = true;
        let matchMaxPrice = true;
        if (filterMinPrice) {
            matchMinPrice = p.price >= parseInt(filterMinPrice);
        }
        if (filterMaxPrice) {
            matchMaxPrice = p.price <= parseInt(filterMaxPrice);
        }

        return matchSearch && matchCat && matchCollection && matchStatus && matchMinPrice && matchMaxPrice;
    }).sort((a, b) => (b.id || 0) - (a.id || 0));

    // ── Pagination ────────────────────────────────────────────────────────────
    const totalPages = Math.ceil(filtered.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedProducts = filtered.slice(startIndex, endIndex);

    // Reset to page 1 when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [search, filterCat, filterCollection, filterStatus, filterMinPrice, filterMaxPrice]);

    const handleDelete = async () => {
        if (!deleteTarget) return;
        try {
            await deleteProduct(deleteTarget.id as number);
            success(tr.productDeleted);
        } catch (e: unknown) {
            toastError(e instanceof Error ? e.message : "O'chirishda xatolik");
        } finally {
            setDeleteTarget(null);
        }
    };

    const openAdd = () => { setEditProduct(null); setModalOpen(true); };
    const openEdit = (p: ApiProduct) => { setEditProduct(p); setModalOpen(true); };

    return (
        <AdminLayout title={tr.products}>
            <div className="space-y-6">
                {/* Toolbar */}
                <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
                    <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                        <div className="flex items-center glass rounded-lg px-3 py-2 gap-2 w-full sm:w-64">
                            <Search className="h-4 w-4 text-muted-foreground shrink-0" />
                            <input
                                placeholder={tr.searchProduct}
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="bg-transparent border-none outline-none text-sm text-foreground placeholder:text-muted-foreground w-full"
                            />
                        </div>
                        <select
                            value={filterCat}
                            onChange={(e) => setFilterCat(e.target.value)}
                            className="glass rounded-lg px-3 py-2 text-sm outline-none bg-black"
                        >
                            <option value="">{tr.selectCategory}</option>
                            {categories.map((c) => (
                                <option key={c.id} value={String(c.id)}>
                                    {lang === "RU" ? c.name_ru : c.name_eng}
                                </option>
                            ))}
                        </select>
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="glass rounded-lg px-3 py-2 text-sm outline-none bg-black"
                        >
                            <option value="">{tr.allStatuses}</option>
                            <option value="active">{tr.active}</option>
                            <option value="inactive">{tr.inactive}</option>
                        </select>
                    </div>
                    <div className="flex gap-2 shrink-0">
                        <button
                            onClick={() => setShowAdvancedFilter(!showAdvancedFilter)}
                            className={`glass rounded-lg p-2.5 hover:bg-muted/20 transition-colors ${showAdvancedFilter ? "bg-primary/20" : ""}`}
                            title="Kengaytirilgan filter"
                        >
                            <Filter className="h-4 w-4 text-muted-foreground" />
                        </button>
                        <button
                            onClick={refreshProducts}
                            className="glass rounded-lg p-2.5 hover:bg-muted/20 transition-colors"
                            title="Yangilash"
                        >
                            <RefreshCw className={`h-4 w-4 text-muted-foreground ${productsLoading ? "animate-spin" : ""}`} />
                        </button>
                        <button
                            onClick={openAdd}
                            className="glass rounded-lg px-4 py-2.5 flex items-center gap-2 hover:bg-primary/20 transition-colors text-sm font-medium"
                        >
                            <Plus className="h-4 w-4" />
                            {tr.newProduct}
                        </button>
                    </div>
                </div>

                {/* ── Advanced Filter Panel ── */}
                {showAdvancedFilter && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="glass rounded-xl p-4 space-y-3"
                    >
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-sm font-semibold flex items-center gap-2">
                                <Filter className="h-4 w-4" />
                                Kengaytirilgan filter
                            </h3>
                            <button
                                onClick={() => {
                                    setFilterCollection("");
                                    setFilterMinPrice("");
                                    setFilterMaxPrice("");
                                    setFilterCat("");
                                    setFilterStatus("");
                                    setSearch("");
                                }}
                                className="text-xs text-muted-foreground hover:text-foreground"
                            >
                                Tozalash
                            </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {/* Collection filter */}
                            <div>
                                <label className="text-xs text-muted-foreground mb-1.5 block">Kolleksiya</label>
                                <select
                                    value={filterCollection}
                                    onChange={(e) => setFilterCollection(e.target.value)}
                                    className="w-full glass rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50 bg-black"
                                >
                                    <option value="">Barchasi</option>
                                    {collections.map((c) => (
                                        <option key={c.id} value={String(c.id)}>
                                            {lang === "RU" ? c.name_ru : c.name_eng}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            {/* Min price */}
                            <div>
                                <label className="text-xs text-muted-foreground mb-1.5 block">Minimal narx</label>
                                <input
                                    type="number"
                                    value={filterMinPrice}
                                    onChange={(e) => setFilterMinPrice(e.target.value)}
                                    placeholder="0"
                                    className="w-full glass rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50"
                                />
                            </div>
                            {/* Max price */}
                            <div>
                                <label className="text-xs text-muted-foreground mb-1.5 block">Maksimal narx</label>
                                <input
                                    type="number"
                                    value={filterMaxPrice}
                                    onChange={(e) => setFilterMaxPrice(e.target.value)}
                                    placeholder="999999999"
                                    className="w-full glass rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50"
                                />
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Error state */}
                {productsError && (
                    <div className="glass rounded-xl p-4 border border-red-500/20 flex items-center gap-3 text-red-400">
                        <AlertCircle className="h-5 w-5 shrink-0" />
                        <span className="text-sm">{productsError}</span>
                        <button onClick={refreshProducts} className="ml-auto text-xs underline">Qayta urinish</button>
                    </div>
                )}

                {/* Loading skeleton */}
                {productsLoading && products.length === 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {Array.from({ length: 8 }).map((_, i) => (
                            <div key={i} className="glass rounded-xl overflow-hidden animate-pulse">
                                <div className="h-44 bg-muted/30" />
                                <div className="p-4 space-y-2">
                                    <div className="h-4 bg-muted/30 rounded w-3/4" />
                                    <div className="h-3 bg-muted/20 rounded w-1/2" />
                                    <div className="h-4 bg-muted/30 rounded w-1/4" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="glass rounded-2xl p-12 text-center">
                        <Package className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-40" />
                        <p className="text-muted-foreground">{tr.noResults}</p>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {paginatedProducts.map((product, i) => (
                            <motion.div
                                key={product.id as number}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.04 }}
                                className="glass rounded-xl overflow-hidden hover:bg-muted/10 transition-colors group"
                            >
                                <div className="relative h-44 w-full overflow-hidden bg-muted/20">
                                    <ProductImage product={product} />
                                    <div className="absolute top-2 right-2">
                                        <Badge
                                            variant="outline"
                                            className={
                                                product.is_active
                                                    ? "bg-green-500/90 text-white border-0 text-[10px] backdrop-blur-sm"
                                                    : "bg-black/60 text-white border-0 text-[10px] backdrop-blur-sm"
                                            }
                                        >
                                            {product.is_active ? tr.active : tr.inactive}
                                        </Badge>
                                    </div>
                                </div>

                                <div className="p-4">
                                    <h3 className="font-semibold text-sm text-foreground mb-0.5 line-clamp-1">
                                        {getProductName(product)}
                                    </h3>
                                    <p className="text-xs text-muted-foreground mb-2">
                                        {getCategoryName(product.category_id as number)}
                                    </p>
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-sm font-bold text-primary">
                                            {product.price?.toLocaleString()} so'm
                                        </span>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => setViewProduct(product)}
                                            className="glass rounded-lg p-2 hover:bg-primary/20 transition-colors flex-1 flex items-center justify-center"
                                            title={tr.view}
                                        >
                                            <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                                        </button>
                                        <button
                                            onClick={() => openEdit(product)}
                                            className="glass rounded-lg p-2 hover:bg-primary/20 transition-colors flex-1 flex items-center justify-center"
                                            title={tr.edit}
                                        >
                                            <Edit className="h-3.5 w-3.5 text-muted-foreground" />
                                        </button>
                                        <button
                                            onClick={() => setDeleteTarget(product)}
                                            className="glass rounded-lg p-2 hover:bg-red-500/20 transition-colors flex-1 flex items-center justify-center"
                                            title={tr.delete}
                                        >
                                            <Trash2 className="h-3.5 w-3.5 text-red-400" />
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Pagination */}
                    {filtered.length > 0 && totalPages > 1 && (
                        <div className="glass rounded-xl p-4 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground">
                                    {startIndex + 1}-{Math.min(endIndex, filtered.length)} / {filtered.length}
                                </span>
                                <select
                                    value={itemsPerPage}
                                    onChange={(e) => {
                                        setItemsPerPage(Number(e.target.value));
                                        setCurrentPage(1);
                                    }}
                                    className="glass rounded-lg px-2 py-1 text-xs outline-none bg-black"
                                >
                                    <option value={12}>12</option>
                                    <option value={20}>20</option>
                                    <option value={40}>40</option>
                                    <option value={60}>60</option>
                                </select>
                            </div>
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => setCurrentPage(1)}
                                    disabled={currentPage === 1}
                                    className="glass rounded-lg p-1.5 hover:bg-muted/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                >
                                    <ChevronsLeft className="h-4 w-4" />
                                </button>
                                <button
                                    onClick={() => setCurrentPage(currentPage - 1)}
                                    disabled={currentPage === 1}
                                    className="glass rounded-lg p-1.5 hover:bg-muted/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </button>
                                <span className="text-xs text-muted-foreground px-3">
                                    {currentPage} / {totalPages}
                                </span>
                                <button
                                    onClick={() => setCurrentPage(currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                    className="glass rounded-lg p-1.5 hover:bg-muted/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </button>
                                <button
                                    onClick={() => setCurrentPage(totalPages)}
                                    disabled={currentPage === totalPages}
                                    className="glass rounded-lg p-1.5 hover:bg-muted/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                >
                                    <ChevronsRight className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    )}
                </>
                )}
            </div>

            {/* View Modal */}
            {viewProduct && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setViewProduct(null)} />
                    <div className="relative glass-strong rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-border/30">
                            <div>
                                <h2 className="text-lg font-bold">{getProductName(viewProduct)}</h2>
                                <p className="text-xs text-muted-foreground">{getCategoryName(viewProduct.category_id as number)}</p>
                            </div>
                            <button onClick={() => setViewProduct(null)} className="glass rounded-lg p-2 hover:bg-red-500/20 transition-colors">
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            {/* Image */}
                            <div className="aspect-[4/3] rounded-xl overflow-hidden bg-muted/20">
                                <ProductImage product={viewProduct} />
                            </div>
                            {/* Description */}
                            <p className="text-sm text-muted-foreground">{getProductDesc(viewProduct)}</p>
                            {/* Price */}
                            <div className="glass-subtle rounded-xl p-3">
                                <p className="text-xs text-muted-foreground">{tr.price}</p>
                                <p className="text-lg font-bold text-primary">{viewProduct.price?.toLocaleString()} so'm</p>
                            </div>
                            {/* All fields */}
                            <div className="space-y-2 text-xs text-muted-foreground">
                                <div className="flex justify-between">
                                    <span>ID</span><span className="text-foreground font-mono">{viewProduct.id as number}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Category ID</span><span className="text-foreground">{viewProduct.category_id as number}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Collection ID</span><span className="text-foreground">{viewProduct.collection_id as number}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Status</span>
                                    <span className={viewProduct.is_active ? "text-green-400" : "text-red-400"}>
                                        {viewProduct.is_active ? tr.active : tr.inactive}
                                    </span>
                                </div>
                            </div>
                            <div className="flex gap-2 pt-1">
                                <button
                                    onClick={() => { setViewProduct(null); openEdit(viewProduct); }}
                                    className="flex-1 glass rounded-xl py-2.5 text-sm font-medium hover:bg-primary/20 transition-colors flex items-center justify-center gap-2"
                                >
                                    <Edit className="h-4 w-4" /> {tr.edit}
                                </button>
                                <button
                                    onClick={() => setViewProduct(null)}
                                    className="flex-1 glass rounded-xl py-2.5 text-sm font-medium hover:bg-muted/20 transition-colors"
                                >
                                    {tr.close}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <ProductModal open={modalOpen} onClose={() => { setModalOpen(false); refreshProducts(); }} product={editProduct} />
            <DeleteModal
                open={!!deleteTarget}
                title={tr.deleteProduct}
                itemName={deleteTarget ? getProductName(deleteTarget) : ""}
                onConfirm={handleDelete}
                onClose={() => setDeleteTarget(null)}
            />
        </AdminLayout>
    );
}
