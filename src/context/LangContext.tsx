import { createContext, useContext, useState, ReactNode } from "react";
import { Lang, t } from "@/i18n/translations";

interface LangContextType {
    lang: Lang;
    setLang: (l: Lang) => void;
    tr: ReturnType<typeof t>;
}

const LangContext = createContext<LangContextType | null>(null);

export function LangProvider({ children }: { children: ReactNode }) {
    const [lang, setLang] = useState<Lang>("EN");
    return (
        <LangContext.Provider value={{ lang, setLang, tr: t(lang) }}>
            {children}
        </LangContext.Provider>
    );
}

export function useLang() {
    const ctx = useContext(LangContext);
    if (!ctx) throw new Error("useLang must be used within LangProvider");
    return ctx;
}