import { AdminLayout } from "@/components/AdminLayout";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { Package, Search, Plus, Edit, Trash2, Eye } from "lucide-react";
import { useState } from "react";

const products = [
  { id: 1, name: "iPhone 15 Pro Max", category: "Telefonlar", price: "14 500 000", stock: 45, status: "active", image: "📱" },
  { id: 2, name: "Samsung Galaxy S24 Ultra", category: "Telefonlar", price: "12 800 000", stock: 32, status: "active", image: "📱" },
  { id: 3, name: "MacBook Pro 16\"", category: "Noutbuklar", price: "28 000 000", stock: 12, status: "active", image: "💻" },
  { id: 4, name: "AirPods Pro 2", category: "Aksessuarlar", price: "2 500 000", stock: 0, status: "inactive", image: "🎧" },
  { id: 5, name: "iPad Air M2", category: "Planshetlar", price: "9 200 000", stock: 18, status: "active", image: "📟" },
  { id: 6, name: "Sony WH-1000XM5", category: "Aksessuarlar", price: "3 800 000", stock: 25, status: "active", image: "🎧" },
  { id: 7, name: "Dell XPS 15", category: "Noutbuklar", price: "18 500 000", stock: 8, status: "active", image: "💻" },
  { id: 8, name: "Apple Watch Ultra 2", category: "Aksessuarlar", price: "11 200 000", stock: 0, status: "inactive", image: "⌚" },
];

const Products = () => {
  const [search, setSearch] = useState("");
  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout title="Mahsulotlar">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex items-center glass rounded-lg px-3 py-2 gap-2 w-full sm:w-72">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Mahsulot qidirish..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent border-none outline-none text-sm text-foreground placeholder:text-muted-foreground w-full"
            />
          </div>
          <button className="glass rounded-lg px-4 py-2.5 flex items-center gap-2 hover:bg-primary/20 transition-colors text-sm font-medium">
            <Plus className="h-4 w-4" />
            Yangi mahsulot
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((product, i) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass rounded-xl p-4 hover:bg-muted/10 transition-colors group"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center text-2xl">
                  {product.image}
                </div>
                <Badge
                  variant={product.status === "active" ? "default" : "secondary"}
                  className={product.status === "active" ? "bg-green-500/20 text-green-400 border-green-500/30" : "bg-muted/50 text-muted-foreground"}
                >
                  {product.status === "active" ? "Faol" : "Nofaol"}
                </Badge>
              </div>
              <h3 className="font-semibold text-sm text-foreground mb-1 line-clamp-1">{product.name}</h3>
              <p className="text-xs text-muted-foreground mb-2">{product.category}</p>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-bold text-primary">{product.price} so'm</span>
                <span className={`text-xs ${product.stock > 0 ? "text-muted-foreground" : "text-red-400"}`}>
                  {product.stock > 0 ? `${product.stock} dona` : "Tugagan"}
                </span>
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button className="glass rounded-lg p-2 hover:bg-primary/20 transition-colors flex-1 flex items-center justify-center">
                  <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
                <button className="glass rounded-lg p-2 hover:bg-primary/20 transition-colors flex-1 flex items-center justify-center">
                  <Edit className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
                <button className="glass rounded-lg p-2 hover:bg-red-500/20 transition-colors flex-1 flex items-center justify-center">
                  <Trash2 className="h-3.5 w-3.5 text-red-400" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
};

export default Products;
