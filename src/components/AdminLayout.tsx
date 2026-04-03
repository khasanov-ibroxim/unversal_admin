import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/AdminSidebar";
import { Bell, User, Globe } from "lucide-react";
import { useState } from "react";

interface AdminLayoutProps {
  children: React.ReactNode;
  title?: string;
}

export function AdminLayout({ children, title }: AdminLayoutProps) {
  const [lang, setLang] = useState<"EN" | "RU">("EN");

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AdminSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-16 flex items-center justify-between px-4 md:px-6 glass-subtle sticky top-0 z-10">
            <div className="flex items-center gap-3">
              <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
              {title && <h1 className="text-lg font-semibold hidden sm:block">{title}</h1>}
            </div>
            <div className="flex items-center gap-2">
              <div className="hidden md:flex items-center glass rounded-lg overflow-hidden">
                <button
                  onClick={() => setLang("EN")}
                  className={`px-3 py-2 text-sm font-medium transition-colors ${
                    lang === "EN"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  EN
                </button>
                <button
                  onClick={() => setLang("RU")}
                  className={`px-3 py-2 text-sm font-medium transition-colors ${
                    lang === "RU"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  RU
                </button>
              </div>
              <button
                onClick={() => setLang(lang === "EN" ? "RU" : "EN")}
                className="md:hidden glass rounded-lg p-2.5 hover:bg-muted/30 transition-colors flex items-center gap-1"
              >
                <Globe className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs font-medium">{lang}</span>
              </button>
              <button className="glass rounded-lg p-2.5 hover:bg-muted/30 transition-colors relative">
                <Bell className="h-4 w-4 text-muted-foreground" />
                <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-[10px] font-bold flex items-center justify-center text-primary-foreground">
                  3
                </span>
              </button>
              <button className="glass rounded-lg p-2 hover:bg-muted/30 transition-colors flex items-center gap-2">
                <div className="h-7 w-7 rounded-full bg-primary/20 flex items-center justify-center">
                  <User className="h-4 w-4 text-primary" />
                </div>
                <span className="text-sm font-medium hidden md:block">Admin</span>
              </button>
            </div>
          </header>
          <main className="flex-1 p-4 md:p-6 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
