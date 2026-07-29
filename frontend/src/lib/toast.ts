export type ToastVariant = "success" | "error" | "info";

export interface ToastItem {
  id: string;
  title: string;
  description?: string;
  variant: ToastVariant;
  duration: number;
}

type Listener = (toasts: ToastItem[]) => void;

let toasts: ToastItem[] = [];
const listeners = new Set<Listener>();

function emit() {
  listeners.forEach((listener) => listener(toasts));
}

function genId(): string {
  return `toast-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  listener(toasts);
  return () => {
    listeners.delete(listener);
  };
}

export function dismissToast(id: string): void {
  toasts = toasts.filter((t) => t.id !== id);
  emit();
}

function push(variant: ToastVariant, title: string, description?: string, duration = 5000): string {
  const id = genId();
  toasts = [...toasts, { id, title, description, variant, duration }];
  emit();
  return id;
}

export const toast = {
  success(title: string, description?: string, duration?: number): string {
    return push("success", title, description, duration);
  },
  error(title: string, description?: string, duration?: number): string {
    return push("error", title, description, duration);
  },
  info(title: string, description?: string, duration?: number): string {
    return push("info", title, description, duration);
  },
  dismiss(id: string): void {
    dismissToast(id);
  },
};