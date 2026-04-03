import { createContext, useContext, useState, useEffect } from "react";
import { LOGIN } from "@/utils/consts";
import { useNavigate } from "react-router-dom";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem("admin_user");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const login = (userData) => {
    localStorage.setItem("admin_user", JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem("admin_user");
    setUser(null);
  };

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
