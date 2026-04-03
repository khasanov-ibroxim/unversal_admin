import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";

const orders = [
  { id: "#12841", customer: "Aziz Karimov", product: "iPhone 15 Pro", amount: "12,500,000", status: "delivered" },
  { id: "#12842", customer: "Nilufar Rahimova", product: "Samsung Galaxy S24", amount: "9,800,000", status: "processing" },
  { id: "#12843", customer: "Jasur Toshmatov", product: "MacBook Air M3", amount: "18,200,000", status: "shipped" },
  { id: "#12844", customer: "Dilorom Ergasheva", product: "AirPods Pro 2", amount: "3,200,000", status: "pending" },
  { id: "#12845", customer: "Bobur Aliyev", product: "iPad Pro 12.9", amount: "15,600,000", status: "delivered" },
  { id: "#12846", customer: "Sevara Nazarova", product: "Apple Watch Ultra", amount: "8,400,000", status: "processing" },
];

const statusMap: Record<string, { label: string; className: string }> = {
  delivered: { label: "Yetkazildi", className: "bg-success/15 text-success border-success/20" },
  processing: { label: "Jarayonda", className: "bg-primary/15 text-primary border-primary/20" },
  shipped: { label: "Jo'natildi", className: "bg-warning/15 text-warning border-warning/20" },
  pending: { label: "Kutilmoqda", className: "bg-muted text-muted-foreground border-muted" },
};

export function RecentOrders() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4, duration: 0.4 }}
      className="glass rounded-2xl p-5 md:p-6"
    >
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-base font-semibold">So'nggi buyurtmalar</h3>
        <button className="text-xs text-primary hover:underline font-medium">Barchasini ko'rish</button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-muted-foreground text-xs uppercase tracking-wider">
              <th className="text-left pb-3 font-medium">ID</th>
              <th className="text-left pb-3 font-medium">Mijoz</th>
              <th className="text-left pb-3 font-medium hidden md:table-cell">Mahsulot</th>
              <th className="text-right pb-3 font-medium">Summa</th>
              <th className="text-right pb-3 font-medium">Holat</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order, i) => (
              <tr key={order.id} className="border-t border-border/50 hover:bg-muted/10 transition-colors">
                <td className="py-3 font-medium text-primary">{order.id}</td>
                <td className="py-3">{order.customer}</td>
                <td className="py-3 text-muted-foreground hidden md:table-cell">{order.product}</td>
                <td className="py-3 text-right font-medium">{order.amount} so'm</td>
                <td className="py-3 text-right">
                  <Badge variant="outline" className={statusMap[order.status].className}>
                    {statusMap[order.status].label}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}
