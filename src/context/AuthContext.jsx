import { createContext, useContext, useState, useEffect } from "react";
import { setCredentials, clearCredentials } from "@/api/client";

const AuthContext = createContext(null);

const CREDS_KEY = "admin_credentials";
const USER_KEY = "admin_user";

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    // App ochilganda saqlangan credentials ni tiklash
    useEffect(() => {
        try {
            const storedCreds = localStorage.getItem(CREDS_KEY);
            const storedUser = localStorage.getItem(USER_KEY);

            if (storedCreds && storedUser) {
                const creds = JSON.parse(storedCreds);
                const userData = JSON.parse(storedUser);
                // apiFetch header uchun credentials ni yuklaymiz
                setCredentials(creds.username, creds.password);
                setUser(userData);
            }
        } catch {
            localStorage.removeItem(CREDS_KEY);
            localStorage.removeItem(USER_KEY);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const login = (userData, username, password) => {
        // credentials ni apiFetch uchun xotiraga saqlaymiz
        setCredentials(username, password);
        // ikkalasini ham localStorage ga yozamiz
        localStorage.setItem(CREDS_KEY, JSON.stringify({ username, password }));
        localStorage.setItem(USER_KEY, JSON.stringify(userData));
        setUser(userData);
    };

    const logout = () => {
        clearCredentials();
        localStorage.removeItem(CREDS_KEY);
        localStorage.removeItem(USER_KEY);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used within AuthProvider");
    return ctx;
}