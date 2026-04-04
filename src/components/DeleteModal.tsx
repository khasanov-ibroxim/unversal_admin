import { AlertTriangle } from "lucide-react";
import { useLang } from "@/context/LangContext";

interface Props {
    open: boolean;
    title: string;
    itemName: string;
    onConfirm: () => void;
    onClose: () => void;
}

export function DeleteModal({ open, title, itemName, onConfirm, onClose }: Props) {
    const { tr } = useLang();
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative glass-strong rounded-2xl w-full max-w-sm p-6 text-center">
                <div className="h-14 w-14 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
                    <AlertTriangle className="h-7 w-7 text-red-400" />
                </div>
                <h3 className="text-lg font-bold mb-2">{title}</h3>
                <p className="text-sm text-muted-foreground mb-6">
                    {tr.deleteConfirm}{" "}
                    <span className="text-foreground font-medium">"{itemName}"</span>?
                </p>
                <div className="flex gap-3">
                    <button onClick={onClose}
                            className="flex-1 glass rounded-xl py-2.5 text-sm font-medium hover:bg-muted/20 transition-colors">
                        {tr.no}
                    </button>
                    <button onClick={() => { onConfirm(); onClose(); }}
                            className="flex-1 rounded-xl py-2.5 text-sm font-semibold bg-red-500 hover:bg-red-600 text-white transition-colors">
                        {tr.yes}
                    </button>
                </div>
            </div>
        </div>
    );
}