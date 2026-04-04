import { AdminLayout } from "@/components/AdminLayout";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { Search, Plus, Edit, Trash2, Eye, Package, X, ImagePlus } from "lucide-react";
import { useState } from "react";
import { useStore, StoreProduct } from "@/context/StoreContext";
import { useLang } from "@/context/LangContext";
import { ProductModal } from "@/components/ProductModal";
import { DeleteModal } from "@/components/DeleteModal";
import { useAppToast } from "@/hooks/use-app-toast";

// Placeholder gradient for products without images
function ProductImage({ images, name }: { images: string[]; name: string }) {
    if (images && images.length > 0) {
        return (
            <img src={images[0]} alt={name}
                 className="w-full h-full object-cover" />
        );
    }
    return (
        <div className="w-full h-full flex items-center justify-center bg-primary/10">
            <ImagePlus className="h-6 w-6 text-primary/40" />
        </div>
    );
}

export default function Products() {
    const { products, categories, deleteProduct } = useStore();
    const { tr, lang } = useLang();
    const { success } = useAppToast();

    const [search, setSearch] = useState("");
    const [filterCat, setFilterCat] = useState("");
    const [filterStatus, setFilterStatus] = useState("");
    const [modalOpen, setModalOpen] = useState(false);
    const [editProduct, setEditProduct] = useState<StoreProduct | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<StoreProduct | null>(null);
    const [viewProduct, setViewProduct] = useState<StoreProduct | null>(null);
    const [viewImgIdx, setViewImgIdx] = useState(0);

    const getCategoryName = (id: string) => {
        const cat = categories.find((c) => c.id === id);
        if (!cat) return "—";
        return lang === "RU" ? cat.nameRu : cat.nameEn;
    };

    const filtered = products.filter((p) => {
        const name = lang === "RU" ? p.nameRu : p.nameEn;
        const matchSearch = name.toLowerCase().includes(search.toLowerCase());
        const matchCat = !filterCat || p.categoryId === filterCat;
        const matchStatus = !filterStatus || p.status === filterStatus;
        return matchSearch && matchCat && matchStatus;
    });

    const handleDelete = () => {
        if (deleteTarget) {
            deleteProduct(deleteTarget.id);
            success(tr.productDeleted);
            setDeleteTarget(null);
        }
    };

    const openAdd = () => { setEditProduct(null); setModalOpen(true); };
    const openEdit = (p: StoreProduct) => { setEditProduct(p); setModalOpen(true); };

    const openView = (p: StoreProduct) => {
        setViewProduct(p);
        setViewImgIdx(0);
    };

    return (
        <AdminLayout title={tr.products}>
            <div className="space-y-6">
                {/* Toolbar */}
                <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
                    <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                        <div className="flex items-center glass rounded-lg px-3 py-2 gap-2 w-full sm:w-64">
                            <Search className="h-4 w-4 text-muted-foreground shrink-0" />
                            <input placeholder={tr.searchProduct} value={search}
                                   onChange={(e) => setSearch(e.target.value)}
                                   className="bg-transparent border-none outline-none text-sm text-foreground placeholder:text-muted-foreground w-full" />
                        </div>
                        <select value={filterCat} onChange={(e) => setFilterCat(e.target.value)}
                                className="glass rounded-lg px-3 py-2 text-sm outline-none bg-transparent bg-black">
                            <option value="">{tr.selectCategory}</option>
                            {categories.map((c) => (
                                <option key={c.id} value={c.id}>
                                    {c.icon} {lang === "RU" ? c.nameRu : c.nameEn}
                                </option>
                            ))}
                        </select>
                        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
                                className="glass rounded-lg px-3 py-2 text-sm outline-none bg-black">
                            <option value="">{tr.allStatuses}</option>
                            <option value="active">{tr.active}</option>
                            <option value="inactive">{tr.inactive}</option>
                        </select>
                    </div>
                    <button onClick={openAdd}
                            className="glass rounded-lg px-4 py-2.5 flex items-center gap-2 hover:bg-primary/20 transition-colors text-sm font-medium shrink-0">
                        <Plus className="h-4 w-4" />
                        {tr.newProduct}
                    </button>
                </div>

                {/* Grid */}
                {filtered.length === 0 ? (
                    <div className="glass rounded-2xl p-12 text-center">
                        <Package className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-40" />
                        <p className="text-muted-foreground">{tr.noResults}</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {filtered.map((product, i) => (
                            <motion.div key={product.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.04 }}
                                        className="glass rounded-xl overflow-hidden hover:bg-muted/10 transition-colors group"
                            >
                                {/* Image thumbnail */}
                                <div className="relative h-44 w-full overflow-hidden bg-muted/20">
                                    <ProductImage images={product.images} name={product.nameEn} />
                                    {/* Badge overlays */}
                                    <div className="absolute top-2 left-2 flex flex-col gap-1">
                                        {product.isNew && (
                                            <span className="text-[10px] font-bold bg-primary text-primary-foreground rounded px-1.5 py-0.5 leading-4">NEW</span>
                                        )}
                                        {product.isSale && (
                                            <span className="text-[10px] font-bold bg-red-500 text-white rounded px-1.5 py-0.5 leading-4">SALE</span>
                                        )}
                                    </div>
                                    <div className="absolute top-2 right-2">
                                        <Badge variant="outline"
                                               className={product.status === "active"
                                                   ? "bg-green-500/90 text-white border-0 text-[10px] backdrop-blur-sm"
                                                   : "bg-black/60 text-white border-0 text-[10px] backdrop-blur-sm"}>
                                            {product.status === "active" ? tr.active : tr.inactive}
                                        </Badge>
                                    </div>
                                    {/* Image count indicator */}
                                    {product.images.length > 1 && (
                                        <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-sm rounded px-1.5 py-0.5 text-[10px] text-white font-medium">
                                            +{product.images.length - 1}
                                        </div>
                                    )}
                                </div>

                                {/* Info */}
                                <div className="p-4">
                                    <h3 className="font-semibold text-sm text-foreground mb-0.5 line-clamp-1">
                                        {lang === "RU" ? product.nameRu : product.nameEn}
                                    </h3>
                                    <p className="text-xs text-muted-foreground mb-2">{getCategoryName(product.categoryId)}</p>

                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-sm font-bold text-primary">${product.price}</span>
                                        <span className={`text-xs ${product.stock > 0 ? "text-muted-foreground" : "text-red-400"}`}>
                      {product.stock > 0 ? `${product.stock} ${tr.pcs}` : tr.outOfStock}
                    </span>
                                    </div>

                                    {/* Color swatches */}
                                    {product.colors.length > 0 && (
                                        <div className="flex gap-1 mb-3">
                                            {product.colors.slice(0, 5).map((c, i) => (
                                                <div key={i} title={lang === "RU" ? c.nameRu : c.nameEn}
                                                     className="h-4 w-4 rounded-full border border-white/20 shrink-0"
                                                     style={{ background: c.hex }} />
                                            ))}
                                            {product.colors.length > 5 && (
                                                <span className="text-[10px] text-muted-foreground self-center">+{product.colors.length - 5}</span>
                                            )}
                                        </div>
                                    )}

                                    {/* Sizes preview */}
                                    {product.sizes.length > 0 && (
                                        <div className="flex gap-1 mb-3 flex-wrap">
                                            {product.sizes.slice(0, 5).map((s) => (
                                                <span key={s} className="text-[10px] glass rounded px-1.5 py-0.5 text-muted-foreground">{s}</span>
                                            ))}
                                            {product.sizes.length > 5 && (
                                                <span className="text-[10px] text-muted-foreground self-center">+{product.sizes.length - 5}</span>
                                            )}
                                        </div>
                                    )}

                                    {/* Actions */}
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => openView(product)}
                                                className="glass rounded-lg p-2 hover:bg-primary/20 transition-colors flex-1 flex items-center justify-center" title={tr.view}>
                                            <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                                        </button>
                                        <button onClick={() => openEdit(product)}
                                                className="glass rounded-lg p-2 hover:bg-primary/20 transition-colors flex-1 flex items-center justify-center" title={tr.edit}>
                                            <Edit className="h-3.5 w-3.5 text-muted-foreground" />
                                        </button>
                                        <button onClick={() => setDeleteTarget(product)}
                                                className="glass rounded-lg p-2 hover:bg-red-500/20 transition-colors flex-1 flex items-center justify-center" title={tr.delete}>
                                            <Trash2 className="h-3.5 w-3.5 text-red-400" />
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>

            {/* ── View Modal ── */}
            {viewProduct && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setViewProduct(null)} />
                    <div className="relative glass-strong rounded-2xl w-full max-w-xl max-h-[92vh] overflow-y-auto">
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-border/30">
                            <div>
                                <h2 className="text-lg font-bold">{lang === "RU" ? viewProduct.nameRu : viewProduct.nameEn}</h2>
                                <p className="text-xs text-muted-foreground">{getCategoryName(viewProduct.categoryId)}</p>
                            </div>
                            <button onClick={() => setViewProduct(null)} className="glass rounded-lg p-2 hover:bg-red-500/20 transition-colors">
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        <div className="p-6 space-y-5">
                            {/* Image gallery */}
                            {viewProduct.images.length > 0 ? (
                                <div className="space-y-2">
                                    <div className="aspect-[4/3] rounded-xl overflow-hidden bg-muted/20">
                                        <img src={viewProduct.images[viewImgIdx]} alt=""
                                             className="w-full h-full object-cover" />
                                    </div>
                                    {viewProduct.images.length > 1 && (
                                        <div className="flex gap-2 overflow-x-auto pb-1">
                                            {viewProduct.images.map((src, i) => (
                                                <button key={i} type="button" onClick={() => setViewImgIdx(i)}
                                                        className={`h-14 w-14 shrink-0 rounded-lg overflow-hidden border-2 transition-all ${i === viewImgIdx ? "border-primary" : "border-border/30 opacity-60 hover:opacity-100"}`}>
                                                    <img src={src} alt="" className="w-full h-full object-cover" />
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="aspect-[4/3] rounded-xl overflow-hidden bg-muted/20 flex items-center justify-center">
                                    <ImagePlus className="h-12 w-12 text-muted-foreground/30" />
                                </div>
                            )}

                            {/* Description */}
                            <p className="text-sm text-muted-foreground">
                                {lang === "RU" ? viewProduct.descriptionRu : viewProduct.descriptionEn}
                            </p>

                            {/* Price / Stock */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="glass-subtle rounded-xl p-3">
                                    <p className="text-xs text-muted-foreground">{tr.price}</p>
                                    <p className="text-lg font-bold text-primary">${viewProduct.price}</p>
                                </div>
                                <div className="glass-subtle rounded-xl p-3">
                                    <p className="text-xs text-muted-foreground">{tr.stock}</p>
                                    <p className="text-lg font-bold">{viewProduct.stock} {tr.pcs}</p>
                                </div>
                            </div>

                            {/* Colors */}
                            {viewProduct.colors.length > 0 && (
                                <div>
                                    <p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wide">{tr.colors}</p>
                                    <div className="flex flex-wrap gap-2">
                                        {viewProduct.colors.map((c, i) => (
                                            <div key={i} className="flex items-center gap-1.5 glass rounded-lg px-2.5 py-1.5">
                                                <div className="h-4 w-4 rounded-full border border-white/20" style={{ background: c.hex }} />
                                                <span className="text-xs font-medium">{lang === "RU" ? c.nameRu : c.nameEn}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Sizes */}
                            {viewProduct.sizes.length > 0 && (
                                <div>
                                    <p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wide">{tr.sizes}</p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {viewProduct.sizes.map((s) => (
                                            <span key={s} className="glass rounded-lg px-2.5 py-1 text-xs font-medium">{s}</span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Details */}
                            {viewProduct.details.length > 0 && (
                                <div>
                                    <p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wide">{tr.details}</p>
                                    <ul className="space-y-1.5">
                                        {viewProduct.details.map((d, i) => (
                                            <li key={i} className="text-sm glass-subtle rounded-lg px-3 py-2">
                                                {lang === "RU" ? d.ru : d.en}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex gap-2 pt-1">
                                <button onClick={() => { setViewProduct(null); openEdit(viewProduct); }}
                                        className="flex-1 glass rounded-xl py-2.5 text-sm font-medium hover:bg-primary/20 transition-colors flex items-center justify-center gap-2">
                                    <Edit className="h-4 w-4" /> {tr.edit}
                                </button>
                                <button onClick={() => setViewProduct(null)}
                                        className="flex-1 glass rounded-xl py-2.5 text-sm font-medium hover:bg-muted/20 transition-colors">
                                    {tr.close}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <ProductModal open={modalOpen} onClose={() => setModalOpen(false)} product={editProduct} />
            <DeleteModal
                open={!!deleteTarget}
                title={tr.deleteProduct}
                itemName={deleteTarget ? (lang === "RU" ? deleteTarget.nameRu : deleteTarget.nameEn) : ""}
                onConfirm={handleDelete}
                onClose={() => setDeleteTarget(null)}
            />
        </AdminLayout>
    );
}