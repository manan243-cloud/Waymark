import React from "react";

export default function UndoToast({ toast, onUndo }) {
  if (!toast) return null;
  return (
    <div
      className="fixed left-1/2 z-50 wm-card rounded-full px-4 py-2.5 text-sm flex items-center gap-3 shadow-lg"
      style={{ bottom: "max(1.25rem, env(safe-area-inset-bottom))", transform: "translateX(-50%)" }}
    >
      <span>{toast.message}</span>
      <button onClick={onUndo} className="font-medium underline" style={{ color: "#4F6B52" }}>
        Undo
      </button>
    </div>
  );
}
