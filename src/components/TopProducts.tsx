import { motion } from "framer-motion";
import { Package } from "lucide-react";

const products = [
  { name: "iPhone 15 Pro Max", sales: 324, revenue: "4.05 mlrd" },
  { name: "Samsung Galaxy S24 Ultra", sales: 256, revenue: "2.51 mlrd" },
  { name: "MacBook Pro M3", sales: 189, revenue: "5.67 mlrd" },
  { name: "AirPods Pro 2", sales: 412, revenue: "1.32 mlrd" },
  { name: "iPad Air M2", sales: 198, revenue: "2.77 mlrd" },
];

export function TopProducts() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6, duration: 0.4 }}
      className="glass rounded-2xl p-5 md:p-6"
    >
      <h3 className="text-base font-semibold mb-5">Top mahsulotlar</h3>
      <div className="space-y-4">
        {products.map((product, i) => (
          <div key={i} className="flex items-center gap-3 group">
            <div className="glass-subtle rounded-xl p-2.5 group-hover:bg-primary/10 transition-colors shrink-0">
              <Package className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{product.name}</p>
              <p className="text-xs text-muted-foreground">{product.sales} ta sotildi</p>
            </div>
            <p className="text-sm font-semibold text-primary shrink-0">{product.revenue}</p>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
