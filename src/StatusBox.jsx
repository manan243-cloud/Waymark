import React from "react";
import { Check, X } from "./icons.jsx";

const STYLES = {
  todo: { background: "transparent", border: "1.5px solid #9C9585" },
  doing: { background: "#B8843C33", border: "1.5px solid #B8843C" },
  done: { background: "#4F6B52", border: "1.5px solid #4F6B52" },
  failed: { background: "#A2452F", border: "1.5px solid #A2452F" },
};

const TITLES = {
  todo: "Not started — tap to start",
  doing: "In progress — tap to complete",
  done: "Done — tap to mark failed",
  failed: "Failed — tap to reset",
};

// A tap-to-cycle checkbox-like control representing not started / in
// progress / done / failed.
export default function StatusBox({ status, onClick, size = 18 }) {
  return (
    <button
      onClick={onClick}
      title={TITLES[status]}
      className="rounded-[5px] shrink-0 flex items-center justify-center"
      style={{ width: size, height: size, ...STYLES[status] }}
    >
      {status === "done" && <Check size={size - 5} strokeWidth={3} style={{ color: "#F7F4EC" }} />}
      {status === "failed" && <X size={size - 5} strokeWidth={3} style={{ color: "#F7F4EC" }} />}
    </button>
  );
}
