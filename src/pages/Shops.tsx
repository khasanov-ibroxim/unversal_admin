import { AdminLayout } from "@/components/AdminLayout";
import { motion } from "framer-motion";
import { Store } from "lucide-react";
const Shops = () => (
  <AdminLayout title="Do'konlar">
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass rounded-2xl p-10 flex flex-col items-center justify-center gap-4 text-center min-h-[400px]">
      <Store className="h-12 w-12 text-primary opacity-50" />
      <h2 className="text-xl font-semibold">Do'konlar</h2>
      <p className="text-sm text-muted-foreground">Bu sahifa tez orada tayyor bo'ladi</p>
    </motion.div>
  </AdminLayout>
);
export default Shops;
