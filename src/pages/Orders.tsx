import { AdminLayout } from "@/components/AdminLayout";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { Search, Filter, Eye, ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

const orders = [
  { id: "#ORD-7841", customer: "Aziz Karimov", date: "2024-03-28", total: "14 500 000", items: 2, status: "delivered", payment: "Naqd" },
  { id: "#ORD-7840", customer: "Nilufar Rahimova", date: "2024-03-28", total: "3 200 000", items: 1, status: "pending", payment: "Karta" },
  { id: "#ORD-7839", customer: "Sherzod Toshmatov", date: "2024-03-27", total: "28 000 000", items: 1, status: "processing", payment: "Karta" },
  { id: "#ORD-7838", customer: "Madina Yusupova", date: "2024-03-27", total: "5 600 000", items: 3, status: "delivered", payment: "Naqd" },
  { id: "#ORD-7837", customer: "Bobur Aliyev", date: "2024-03-26", total: "9 200 000", items: 1, status: "cancelled", payment: "Karta" },
  { id: "#ORD-7836", customer: "Gulnora Mirzo", date: "2024-03-26", total: "2 500 000", items: 2, status: "delivered", payment: "Naqd" },
  { id: "#ORD-7835", customer: "Jasur Xolmatov", date: "2024-03-25", total: "18 500 000", items: 1, status: "processing", payment: "Karta" },
  { id: "#ORD-7834", customer: "Dilfuza Qodirova", date: "2024-03-25", total: "7 800 000", items: 4, status: "pending", payment: "Naqd" },
];

const statusMap: Record<string, { label: string; className: string }> = {
  delivered: { label: "Yetkazilgan", className: "bg-green-500/20 text-green-400 border-green-500/30" },
  pending: { label: "Kutilmoqda", className: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" },
  processing: { label: "Jarayonda", className: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  cancelled: { label: "Bekor qilingan", className: "bg-red-500/20 text-red-400 border-red-500/30" },
};

const Orders = () => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = orders.filter((o) => {
    const matchSearch = o.customer.toLowerCase().includes(search.toLowerCase()) || o.id.includes(search);
    const matchStatus = statusFilter === "all" || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <AdminLayout title="Buyurtmalar">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex items-center glass rounded-lg px-3 py-2 gap-2 w-full sm:w-72">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buyurtma yoki mijoz qidirish..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent border-none outline-none text-sm text-foreground placeholder:text-muted-foreground w-full"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {["all", "pending", "processing", "delivered", "cancelled"].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`glass rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                  statusFilter === s ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {s === "all" ? "Barchasi" : statusMap[s].label}
              </button>
            ))}
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-xl overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/30">
                  <th className="text-left text-xs font-medium text-muted-foreground py-3 px-4">ID</th>
                  <th className="text-left text-xs font-medium text-muted-foreground py-3 px-4">Mijoz</th>
                  <th className="text-left text-xs font-medium text-muted-foreground py-3 px-4 hidden md:table-cell">Sana</th>
                  <th className="text-left text-xs font-medium text-muted-foreground py-3 px-4 hidden sm:table-cell">Buyumlar</th>
                  <th className="text-left text-xs font-medium text-muted-foreground py-3 px-4">Summa</th>
                  <th className="text-left text-xs font-medium text-muted-foreground py-3 px-4 hidden md:table-cell">To'lov</th>
                  <th className="text-left text-xs font-medium text-muted-foreground py-3 px-4">Status</th>
                  <th className="text-right text-xs font-medium text-muted-foreground py-3 px-4"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((order, i) => (
                  <motion.tr
                    key={order.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.05 }}
                    className="border-b border-border/10 hover:bg-muted/5 transition-colors"
                  >
                    <td className="py-3 px-4 text-sm font-mono text-primary">{order.id}</td>
                    <td className="py-3 px-4 text-sm font-medium">{order.customer}</td>
                    <td className="py-3 px-4 text-sm text-muted-foreground hidden md:table-cell">{order.date}</td>
                    <td className="py-3 px-4 text-sm text-muted-foreground hidden sm:table-cell">{order.items} ta</td>
                    <td className="py-3 px-4 text-sm font-semibold">{order.total} so'm</td>
                    <td className="py-3 px-4 text-sm text-muted-foreground hidden md:table-cell">{order.payment}</td>
                    <td className="py-3 px-4">
                      <Badge className={statusMap[order.status].className}>
                        {statusMap[order.status].label}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button className="glass rounded-lg p-2 hover:bg-primary/20 transition-colors">
                        <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between px-4 py-3 border-t border-border/20">
            <span className="text-xs text-muted-foreground">{filtered.length} ta buyurtma</span>
            <div className="flex gap-1">
              <button className="glass rounded-lg p-2 hover:bg-muted/30 transition-colors">
                <ChevronLeft className="h-4 w-4 text-muted-foreground" />
              </button>
              <button className="glass rounded-lg px-3 py-1.5 bg-primary/20 text-primary text-xs font-medium">1</button>
              <button className="glass rounded-lg p-2 hover:bg-muted/30 transition-colors">
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AdminLayout>
  );
};

export default Orders;
