import { Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { LangProvider } from "@/context/LangContext";
import { StoreProvider } from "@/context/StoreContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { PUBLIC_ROUTES, PROTECTED_ROUTES, LOGIN } from "@/utils/consts";

function PageLoader() {
    return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
    );
}

function App() {
    return (
        <AuthProvider>
            <LangProvider>
                <StoreProvider>
                    <Suspense fallback={<PageLoader />}>
                        <Routes>
                            {PUBLIC_ROUTES.map(({ path, Component }) => (
                                <Route key={path} path={path} element={<Component />} />
                            ))}
                            {PROTECTED_ROUTES.map(({ path, Component }) => (
                                <Route
                                    key={path}
                                    path={path}
                                    element={
                                        <ProtectedRoute>
                                            <Component />
                                        </ProtectedRoute>
                                    }
                                />
                            ))}
                            <Route path="*" element={<Navigate to={LOGIN} replace />} />
                        </Routes>
                    </Suspense>
                </StoreProvider>
            </LangProvider>
        </AuthProvider>
    );
}

export default App;