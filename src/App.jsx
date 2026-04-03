import { Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
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
            <Suspense fallback={<PageLoader />}>
                <Routes>
                    {/* Public routes (e.g. /login) */}
                    {PUBLIC_ROUTES.map(({ path, Component }) => (
                        <Route key={path} path={path} element={<Component />} />
                    ))}

                    {/* Protected routes — redirects to /login if not authenticated */}
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

                    {/* 404 fallback */}
                    <Route path="*" element={<Navigate to={LOGIN} replace />} />
                </Routes>
            </Suspense>
        </AuthProvider>
    );
}

export default App;