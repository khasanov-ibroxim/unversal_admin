import { AdminLayout } from "@/components/AdminLayout";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { Plus, Edit, Trash2, FolderOpen, Search, ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";
import { useStore, StoreCategory } from "@/context/StoreContext";
import { useLang } from "@/context/LangContext";
import { CategoryModal } from "@/components/CategoryModal";
import { DeleteModal } from "@/components/DeleteModal";
import { useAppToast } from "@/hooks/use-app-toast";

export default function Categories() {
    const { categories, products, deleteCategory } = useStore();
    const { tr, lang } = useLang();
    const { success } = useAppToast();

    const [search, setSearch] = useState("");
    const [modalOpen, setModalOpen] = useState(false);
    const [editCat, setEditCat] = useState<StoreCategory | null>(null);
    const [deleteCat, setDeleteCat] = useState<StoreCategory | null>(null);
    const [expandedRoots, setExpandedRoots] = useState<Set<string>>(new Set());

    const rootCategories = categories.filter((c) => !c.parentId);
    const subCategories = (parentId: string) => categories.filter((c) => c.parentId === parentId);
    const productCount = (id: string) => products.filter((p) => p.categoryId === id).length;

    const allFiltered = categories.filter((c) => {
        const name = lang === "RU" ? c.nameRu : c.nameEn;
        return name.toLowerCase().includes(search.toLowerCase());
    });

    const displayRoots = search
        ? allFiltered.filter((c) => !c.parentId)
        : rootCategories;

    const displaySubs = (parentId: string) =>
        search
            ? allFiltered.filter((c) => c.parentId === parentId)
            : subCategories(parentId);

    const toggleExpand = (id: string) => {
        setExpandedRoots((prev) => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    const openAdd = (parentId?: string) => {
        setEditCat(parentId ? { id: "", nameEn: "", nameRu: "", descriptionEn: "", descriptionRu: "", icon: "📁", parentId, status: "active" } : null);
        setModalOpen(true);
    };
    const openEdit = (c: StoreCategory) => { setEditCat(c); setModalOpen(true); };

    const handleDelete = () => {
        if (deleteCat) {
            // also delete subcategories
            const subs = subCategories(deleteCat.id);
            subs.forEach((s) => deleteCategory(s.id));
            deleteCategory(deleteCat.id);
            success(tr.categoryDeleted);
            setDeleteCat(null);
        }
    };

    const getCatName = (c: StoreCategory) => lang === "RU" ? c.nameRu : c.nameEn;
    const getCatDesc = (c: StoreCategory) => lang === "RU" ? c.descriptionRu : c.descriptionEn;

    return (
        <AdminLayout title={tr.categories}>
            <div className="space-y-6">
                {/* Toolbar */}
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center glass rounded-lg px-3 py-2 gap-2 w-64">
                        <Search className="h-4 w-4 text-muted-foreground" />
                        <input
                            placeholder={tr.searchCategory}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="bg-transparent outline-none text-sm w-full placeholder:text-muted-foreground"
                        />
                    </div>
                    <button
                        onClick={() => openAdd()}
                        className="glass rounded-lg px-4 py-2.5 flex items-center gap-2 hover:bg-primary/20 transition-colors text-sm font-medium"
                    >
                        <Plus className="h-4 w-4" />
                        {tr.newCategory}
                    </button>
                </div>

                {/* Category tree */}
                <div className="space-y-3">
                    {displayRoots.map((root, i) => {
                        const subs = displaySubs(root.id);
                        const isExpanded = expandedRoots.has(root.id) || !!search;
                        const rootProductCount = productCount(root.id);

                        return (
                            <motion.div
                                key={root.id}
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                            >
                                {/* Root category card */}
                                <div className="glass rounded-xl overflow-hidden">
                                    <div className="flex items-center gap-4 p-4 hover:bg-muted/10 transition-colors group">
                                        <button
                                            onClick={() => toggleExpand(root.id)}
                                            className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                                        >
                                            {subs.length > 0 ? (
                                                isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />
                                            ) : (
                                                <span className="w-4 block" />
                                            )}
                                        </button>
                                        <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-2xl shrink-0">
                                            {root.icon}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-semibold text-foreground">{getCatName(root)}</h3>
                                                <Badge
                                                    variant="outline"
                                                    className={root.status === "active"
                                                        ? "bg-green-500/20 text-green-400 border-green-500/30 text-[10px]"
                                                        : "bg-muted/50 text-muted-foreground text-[10px]"}
                                                >
                                                    {root.status === "active" ? tr.active : tr.inactive}
                                                </Badge>
                                            </div>
                                            <p className="text-xs text-muted-foreground line-clamp-1">{getCatDesc(root)}</p>
                                        </div>
                                        <div className="hidden md:flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <FolderOpen className="h-3.5 w-3.5" />
                          {subs.length} sub
                      </span>
                                            {rootProductCount > 0 && (
                                                <span className="flex items-center gap-1">
                          <span>{rootProductCount} {tr.productsCount}</span>
                        </span>
                                            )}
                                        </div>
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => openAdd(root.id)}
                                                className="glass rounded-lg p-2 hover:bg-primary/20 transition-colors"
                                                title="Add subcategory"
                                            >
                                                <Plus className="h-3.5 w-3.5 text-primary" />
                                            </button>
                                            <button
                                                onClick={() => openEdit(root)}
                                                className="glass rounded-lg p-2 hover:bg-primary/20 transition-colors"
                                            >
                                                <Edit className="h-3.5 w-3.5 text-muted-foreground" />
                                            </button>
                                            <button
                                                onClick={() => setDeleteCat(root)}
                                                className="glass rounded-lg p-2 hover:bg-red-500/20 transition-colors"
                                            >
                                                <Trash2 className="h-3.5 w-3.5 text-red-400" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Subcategories */}
                                    {isExpanded && subs.length > 0 && (
                                        <div className="border-t border-border/30 bg-muted/5">
                                            {subs.map((sub) => (
                                                <div
                                                    key={sub.id}
                                                    className="flex items-center gap-4 px-4 py-3 hover:bg-muted/10 transition-colors group border-b border-border/20 last:border-0 pl-12"
                                                >
                                                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-base shrink-0">
                                                        {sub.icon}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2">
                                                            <p className="text-sm font-medium">{getCatName(sub)}</p>
                                                            <Badge
                                                                variant="outline"
                                                                className={sub.status === "active"
                                                                    ? "bg-green-500/20 text-green-400 border-green-500/30 text-[10px]"
                                                                    : "bg-muted/50 text-muted-foreground text-[10px]"}
                                                            >
                                                                {sub.status === "active" ? tr.active : tr.inactive}
                                                            </Badge>
                                                        </div>
                                                        <p className="text-xs text-muted-foreground line-clamp-1">{getCatDesc(sub)}</p>
                                                    </div>
                                                    <span className="text-xs text-muted-foreground hidden md:block">
                            {productCount(sub.id)} {tr.productsCount}
                          </span>
                                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button
                                                            onClick={() => openEdit(sub)}
                                                            className="glass rounded-lg p-1.5 hover:bg-primary/20 transition-colors"
                                                        >
                                                            <Edit className="h-3 w-3 text-muted-foreground" />
                                                        </button>
                                                        <button
                                                            onClick={() => setDeleteCat(sub)}
                                                            className="glass rounded-lg p-1.5 hover:bg-red-500/20 transition-colors"
                                                        >
                                                            <Trash2 className="h-3 w-3 text-red-400" />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        );
                    })}

                    {displayRoots.length === 0 && (
                        <div className="glass rounded-2xl p-12 text-center">
                            <FolderOpen className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-40" />
                            <p className="text-muted-foreground">{tr.noResults}</p>
                        </div>
                    )}
                </div>
            </div>

            <CategoryModal open={modalOpen} onClose={() => setModalOpen(false)} category={editCat} />
            <DeleteModal
                open={!!deleteCat}
                title={tr.deleteCategory}
                itemName={deleteCat ? getCatName(deleteCat) : ""}
                onConfirm={handleDelete}
                onClose={() => setDeleteCat(null)}
            />
        </AdminLayout>
    );
}