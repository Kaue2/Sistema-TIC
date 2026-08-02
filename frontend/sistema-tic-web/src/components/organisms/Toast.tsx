import { useEffect } from "react";

export type ToastType = "success" | "error";

type ToastProps = {
  message: string;
  type: ToastType;
  onClose: () => void;
};

export function Toast({ message, type, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColor = type === "success" ? "bg-green-100" : "bg-red-100";

  return (
    <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 animate-fade-in">
      <div className={`flex items-center gap-3 rounded-lg px-6 py-3 text-white shadow-lg ${bgColor}`}>
        <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
          {type === "success" ? "check_circle" : "error"}
        </span>
        <span className="text-sm">{message}</span>
        <button type="button" onClick={onClose} className="ml-2 opacity-70 hover:opacity-100">
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>close</span>
        </button>
      </div>
    </div>
  );
}
