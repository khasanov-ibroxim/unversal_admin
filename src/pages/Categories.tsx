import { AdminLayout } from "@/components/AdminLayout";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { Plus, Edit, Trash2, FolderOpen } from "lucide-react";

const categories = [
  { id: 1, name: "Telefonlar", icon: "📱", products: 156, description: "Smartfonlar va mobil qurilmalar", status: "active" },
  { id: 2, name: "Noutbuklar", icon: "💻", products: 89, description: "Noutbuklar va ultrabuklarlar", status: "active" },
  { id: 3, name: "Planshetlar", icon: "📟", products: 42, description: "Planshetlar va e-reader", status: "active" },
  { id: 4, name: "Aksessuarlar", icon: "🎧", products: 234, description: "Quloqchinlar, chexollar, zaryadka", status: "active" },
  { id: 5, name: "Televizorlar", icon: "📺", products: 67, description: "Smart TV va monitorlar", status: "active" },
  { id: 6, name: "O'yin konsollari", icon: "🎮", products: 28, description: "PlayStation, Xbox, Nintendo", status: "inactive" },
  { id: 7, name: "Maishiy texnika", icon: "🏠", products: 112, description: "Uy uchun texnika va jihozlar", status: "active" },
  { id: 8, name: "Kameralar", icon: "📷", products: 35, description: "Raqamli kameralar va aksessuarlar", status: "inactive" },
];

const Categories = () => {
  return (
    <AdminLayout title="Kategoriyalar">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{categories.length} ta kategoriya</p>
          <button className="glass rounded-lg px-4 py-2.5 flex items-center gap-2 hover:bg-primary/20 transition-colors text-sm font-medium">
            <Plus className="h-4 w-4" />
            Yangi kategoriya
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {categories.map((cat, i) => (
            <motion.div
              key={cat.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              className="glass rounded-xl p-5 hover:bg-muted/10 transition-colors group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center text-3xl">
                  {cat.icon}
                </div>
                <Badge
                  className={cat.status === "active"
                    ? "bg-green-500/20 text-green-400 border-green-500/30"
                    : "bg-muted/50 text-muted-foreground"}
                >
                  {cat.status === "active" ? "Faol" : "Nofaol"}
                </Badge>
              </div>
              <h3 className="font-semibold text-foreground mb-1">{cat.name}</h3>
              <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{cat.description}</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <FolderOpen className="h-3.5 w-3.5" />
                  <span className="text-xs">{cat.products} mahsulot</span>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="glass rounded-lg p-2 hover:bg-primary/20 transition-colors">
                    <Edit className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>
                  <button className="glass rounded-lg p-2 hover:bg-red-500/20 transition-colors">
                    <Trash2 className="h-3.5 w-3.5 text-red-400" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
};

export default Categories;
