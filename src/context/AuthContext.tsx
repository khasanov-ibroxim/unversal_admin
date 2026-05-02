import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { setCredentials, clearCredentials, panelApi } from "@/api";

interface AuthUser {
    username: string;
    name: string;
    role: "admin" | "operator" | "super_admin";
    id?: number;
}

interface AuthContextType {
    user: AuthUser | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (username: string, password: string) => Promise<void>;
    logout: () => void;
}

const STORAGE_KEY = "admin_credentials";

function saveToStorage(username: string, password: string) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ username, password }));
}

function loadFromStorage(): { username: string; password: string } | null {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
}

function removeFromStorage() {
    localStorage.removeItem(STORAGE_KEY);
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const stored = loadFromStorage();
        if (stored) {
            setCredentials(stored.username, stored.password);
            panelApi
                .getMe()
                .then((me) => {
                    setUser({
                        username: me.username,
                        name: me.username,
                        role: me.status as "admin" | "operator",
                        id: me.id,
                    });
                })
                .catch(() => {
                    clearCredentials();
                    removeFromStorage();
                })
                .finally(() => setIsLoading(false));
        } else {
            setIsLoading(false);
        }
    }, []);

    const login = useCallback(async (username: string, password: string) => {
        setCredentials(username, password);

        try {
            const me = await panelApi.getMe();
            const authUser: AuthUser = {
                username: me.username,
                name: me.username,
                role: me.status as "admin" | "operator",
                id: me.id,
            };
            saveToStorage(username, password);
            setUser(authUser);
        } catch (err) {
            clearCredentials();
            throw err;
        }
    }, []);

    const logout = useCallback(() => {
        clearCredentials();
        removeFromStorage();
        setUser(null);
    }, []);

    return (
        <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used within AuthProvider");
    return ctx;
}