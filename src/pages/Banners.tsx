import { AdminLayout } from "@/components/AdminLayout";
import { motion } from "framer-motion";
import { ImagePlus, Trash2, RefreshCw, Upload, AlertCircle } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { bannersApi, BASE_URL } from "@/api";
import { useAppToast } from "@/hooks/use-app-toast";
import { DeleteModal } from "@/components/DeleteModal";

interface Banner {
    id: number;
    photo_url?: string;
    photo?: string;
}

export default function Banners() {
    const [banners, setBanners] = useState<Banner[]>([]);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [deleteBanner, setDeleteBanner] = useState<Banner | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const { success, error: toastError } = useAppToast();

    const fetchBanners = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await bannersApi.getAll();
            setBanners((res as any).photos || []);
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : "Bannerlar yuklanmadi");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchBanners(); }, []);

    const handleUpload = async (file: File) => {
        setUploading(true);
        try {
            await bannersApi.create(file);
            success("Banner qo'shildi");
            await fetchBanners();
        } catch (e: unknown) {
            toastError(e instanceof Error ? e.message : "Yuklashda xatolik");
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteBanner) return;
        try {
            await bannersApi.delete(deleteBanner.id);
            success("Banner o'chirildi");
            await fetchBanners();
        } catch (e: unknown) {
            toastError(e instanceof Error ? e.message : "Xatolik");
        } finally {
            setDeleteBanner(null);
        }
    };

    const getPhotoSrc = (b: Banner) => {
        const url = b.photo_url || b.photo;
        if (!url) return null;
        return url.startsWith("http") ? url : `${BASE_URL}${url}`;
    };

    return (
        <AdminLayout title="Bannerlar">
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">{banners.length} ta banner</p>
                    <div className="flex gap-2">
                        <button onClick={fetchBanners} className="glass rounded-lg p-2.5 hover:bg-muted/20 transition-colors">
                            <RefreshCw className={`h-4 w-4 text-muted-foreground ${loading ? "animate-spin" : ""}`} />
                        </button>
                        <button
                            onClick={() => inputRef.current?.click()}
                            disabled={uploading}
                            className="glass rounded-lg px-4 py-2.5 flex items-center gap-2 hover:bg-primary/20 transition-colors text-sm font-medium disabled:opacity-50"
                        >
                            {uploading ? <div className="h-4 w-4 rounded-full border-2 border-primary border-t-transparent animate-spin" /> : <Upload className="h-4 w-4" />}
                            Banner yuklash
                        </button>
                        <input
                            ref={inputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
                        />
                    </div>
                </div>

                {error && (
                    <div className="glass rounded-xl p-4 border border-red-500/20 flex items-center gap-3 text-red-400">
                        <AlertCircle className="h-5 w-5 shrink-0" />
                        <span className="text-sm">{error}</span>
                        <button onClick={fetchBanners} className="ml-auto text-xs underline">Qayta</button>
                    </div>
                )}

                {/* Upload area */}
                <div
                    className="border-2 border-dashed border-border/40 rounded-2xl p-10 flex flex-col items-center gap-3 cursor-pointer hover:border-primary/40 hover:bg-primary/5 transition-all"
                    onClick={() => inputRef.current?.click()}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                        e.preventDefault();
                        const file = e.dataTransfer.files?.[0];
                        if (file) handleUpload(file);
                    }}
                >
                    <ImagePlus className="h-10 w-10 text-muted-foreground/50" />
                    <div className="text-center">
                        <p className="text-sm text-muted-foreground">Banner yuklash uchun bosing yoki sudrab tashlang</p>
                        <p className="text-xs text-muted-foreground/70 mt-1">PNG, JPG, WEBP</p>
                    </div>
                </div>

                {loading && banners.length === 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="glass rounded-xl h-48 animate-pulse" />
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {banners.map((banner, i) => {
                            const src = getPhotoSrc(banner);
                            return (
                                <motion.div
                                    key={banner.id}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: i * 0.06 }}
                                    className="glass rounded-xl overflow-hidden group relative"
                                >
                                    <div className="aspect-[16/6] bg-muted/20">
                                        {src ? (
                                            <img src={src} alt={`Banner ${banner.id}`} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <ImagePlus className="h-8 w-8 text-muted-foreground/40" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-3 flex items-center justify-between">
                                        <span className="text-xs text-muted-foreground font-mono">ID: {banner.id}</span>
                                        <button
                                            onClick={() => setDeleteBanner(banner)}
                                            className="glass rounded-lg p-1.5 hover:bg-red-500/20 transition-colors"
                                        >
                                            <Trash2 className="h-3.5 w-3.5 text-red-400" />
                                        </button>
                                    </div>
                                </motion.div>
                            );
                        })}
                        {banners.length === 0 && !loading && (
                            <div className="col-span-full glass rounded-2xl p-12 text-center">
                                <ImagePlus className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-40" />
                                <p className="text-muted-foreground">Bannerlar yo'q</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <DeleteModal
                open={!!deleteBanner}
                title="Bannerni o'chirish"
                itemName={`Banner #${deleteBanner?.id}`}
                onConfirm={handleDelete}
                onClose={() => setDeleteBanner(null)}
            />
        </AdminLayout>
    );
}