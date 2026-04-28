import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { motion } from "framer-motion";
import { Eye, EyeOff, Lock, User, AlertCircle, Sparkles } from "lucide-react";
import { ADMIN_DASHBOARD } from "@/utils/consts";

const Login = () => {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const from = (location.state as { from?: { pathname?: string } })?.from?.pathname || ADMIN_DASHBOARD;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            await login(username, password);
            navigate(from, { replace: true });
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Noma'lum xatolik";
            if (msg.includes("401") || msg.includes("403")) {
                setError("Login yoki parol noto'g'ri");
            } else if (msg.includes("Failed to fetch") || msg.includes("NetworkError")) {
                setError("Server bilan ulanib bo'lmadi. Backend ishlaётganini tekshiring.");
            } else {
                setError(msg || "Kirish amalga oshmadi");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
            {/* Animated background orbs */}
            <div className="absolute inset-0 pointer-events-none">
                <div
                    className="absolute top-[-10%] left-[-5%] w-96 h-96 rounded-full opacity-20"
                    style={{
                        background: "radial-gradient(circle, hsl(199,89%,48%), transparent 70%)",
                        animation: "float1 8s ease-in-out infinite",
                    }}
                />
                <div
                    className="absolute bottom-[-10%] right-[-5%] w-80 h-80 rounded-full opacity-15"
                    style={{
                        background: "radial-gradient(circle, hsl(280,60%,55%), transparent 70%)",
                        animation: "float2 10s ease-in-out infinite",
                    }}
                />
                <div
                    className="absolute top-[40%] right-[20%] w-64 h-64 rounded-full opacity-10"
                    style={{
                        background: "radial-gradient(circle, hsl(170,70%,45%), transparent 70%)",
                        animation: "float1 12s ease-in-out infinite reverse",
                    }}
                />
            </div>

            <style>{`
                @keyframes float1 {
                    0%, 100% { transform: translate(0, 0) scale(1); }
                    50% { transform: translate(20px, -30px) scale(1.05); }
                }
                @keyframes float2 {
                    0%, 100% { transform: translate(0, 0) scale(1); }
                    50% { transform: translate(-25px, 20px) scale(1.08); }
                }
            `}</style>

            <motion.div
                initial={{ opacity: 0, y: 30, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="w-full max-w-md mx-4"
            >
                <div className="glass-strong rounded-3xl p-8 md:p-10">
                    {/* Logo */}
                    <div className="flex flex-col items-center mb-8">
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                            className="h-16 w-16 rounded-2xl bg-primary flex items-center justify-center mb-4 glow-primary"
                        >
                            <Sparkles className="h-8 w-8 text-primary-foreground" />
                        </motion.div>
                        <h1 className="text-2xl font-bold gradient-text">Innove Couture</h1>
                        <p className="text-sm text-muted-foreground mt-1">Admin Panel</p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Username */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-muted-foreground">Login</label>
                            <div className="relative">
                                <div className="absolute left-3 top-1/2 -translate-y-1/2">
                                    <User className="h-4 w-4 text-muted-foreground" />
                                </div>
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    placeholder="username"
                                    required
                                    autoComplete="username"
                                    className="w-full glass rounded-xl pl-10 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/60 outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-muted-foreground">Parol</label>
                            <div className="relative">
                                <div className="absolute left-3 top-1/2 -translate-y-1/2">
                                    <Lock className="h-4 w-4 text-muted-foreground" />
                                </div>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                    autoComplete="current-password"
                                    className="w-full glass rounded-xl pl-10 pr-10 py-3 text-sm text-foreground placeholder:text-muted-foreground/60 outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>

                        {/* Error */}
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -5 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex items-center gap-2 text-red-400 text-sm glass rounded-xl px-4 py-3 border border-red-500/20"
                            >
                                <AlertCircle className="h-4 w-4 shrink-0" />
                                {error}
                            </motion.div>
                        )}

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full rounded-xl py-3 font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-70"
                            style={{
                                background: "linear-gradient(135deg, hsl(199,89%,48%), hsl(280,60%,55%))",
                                color: "hsl(225,25%,8%)",
                                boxShadow: loading ? "none" : "0 4px 20px hsla(199,89%,48%,0.4)",
                            }}
                        >
                            {loading ? (
                                <>
                                    <div className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
                                    Tekshirilmoqda...
                                </>
                            ) : (
                                "Kirish"
                            )}
                        </button>
                    </form>

                    {/* Info hint */}
                    <div className="mt-6 glass-subtle rounded-xl p-4">

                        <p className="text-xs text-muted-foreground text-center mt-1">
                            Credentials: <span className="text-foreground/70">.env dagi ADMIN_USERNAME / ADMIN_PASS</span>
                        </p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default Login;
