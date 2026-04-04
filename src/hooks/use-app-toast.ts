import { toast as baseToast } from "@/hooks/use-toast";

export function useAppToast() {
    const success = (title: string) =>
        baseToast({ title, variant: "default" });

    const error = (title: string) =>
        baseToast({ title, variant: "destructive" });

    return { success, error };
}