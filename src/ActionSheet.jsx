import React from "react";

// A bottom sheet (mobile) / centered card (wider screens) listing actions
// for whatever the user long-pressed or tapped the menu control on.
export default function ActionSheet({ open, title, subtitle, actions, onClose }) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center sm:justify-center"
      style={{ background: "rgba(38,49,58,0.4)" }}
      onClick={onClose}
    >
      <div
        className="wm-card w-full sm:w-96 sm:rounded-sm rounded-t-2xl p-2"
        style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className="px-3 pt-3 pb-2 border-b wm-hairline mb-1">
            <div className="text-sm font-medium">{title}</div>
            {subtitle && (
              <div className="text-xs mt-0.5" style={{ color: "#6b6355" }}>
                {subtitle}
              </div>
            )}
          </div>
        )}
        <div className="py-1">
          {actions.map((a, i) =>
            a.divider ? (
              <div key={i} className="my-1 border-t wm-hairline" />
            ) : (
              <button
                key={i}
                disabled={a.disabled}
                onClick={() => {
                  a.onClick();
                  onClose();
                }}
                className="w-full text-left px-3 py-2.5 rounded-sm text-sm flex items-center gap-2.5 disabled:opacity-35"
                style={{ color: a.danger ? "#A2452F" : "#26313A" }}
              >
                {a.icon}
                <span className="flex-1">{a.label}</span>
              </button>
            )
          )}
        </div>
        <button
          onClick={onClose}
          className="w-full text-center px-3 py-2.5 mt-1 border-t wm-hairline text-sm"
          style={{ color: "#6b6355" }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
