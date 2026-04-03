import { motion } from "framer-motion";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const data = [
  { name: "Yan", value: 4200 },
  { name: "Fev", value: 5800 },
  { name: "Mar", value: 4900 },
  { name: "Apr", value: 7200 },
  { name: "May", value: 6100 },
  { name: "Iyun", value: 8400 },
  { name: "Iyul", value: 7800 },
  { name: "Avg", value: 9200 },
  { name: "Sen", value: 8600 },
  { name: "Okt", value: 10100 },
  { name: "Noy", value: 9400 },
  { name: "Dek", value: 11800 },
];

export function SalesChart() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, duration: 0.4 }}
      className="glass rounded-2xl p-5 md:p-6"
    >
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-base font-semibold">Sotuvlar statistikasi</h3>
        <span className="text-xs text-muted-foreground">2024-yil</span>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(199, 89%, 48%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(199, 89%, 48%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsla(225, 15%, 30%, 0.3)" />
            <XAxis dataKey="name" tick={{ fill: "hsl(215, 20%, 60%)", fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "hsl(215, 20%, 60%)", fontSize: 12 }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{
                background: "hsla(225, 20%, 16%, 0.9)",
                border: "1px solid hsla(225, 15%, 40%, 0.3)",
                borderRadius: "12px",
                backdropFilter: "blur(16px)",
                color: "hsl(210, 40%, 96%)",
              }}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke="hsl(199, 89%, 48%)"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorValue)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
