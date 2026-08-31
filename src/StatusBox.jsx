import React from "react";
import { Check } from "./icons.jsx";

const STYLES = {
  todo: { background: "transparent", border: "1.5px solid #9C9585" },
  doing: { background: "#B8843C33", border: "1.5px solid #B8843C" },
  done: { background: "#4F6B52", border: "1.5px solid #4F6B52" },
};

// A tap-to-cycle checkbox-like control representing todo / doing / done.
export default function StatusBox({ status, onClick, size = 18 }) {
  return (
    <button
      onClick={onClick}
      title={status === "todo" ? "Not started — tap to start" : status === "doing" ? "In progress — tap to complete" : "Done — tap to reset"}
      className="rounded-[5px] shrink-0 flex items-center justify-center"
      style={{ width: size, height: size, ...STYLES[status] }}
    >
      {status === "done" && <Check size={size - 5} strokeWidth={3} style={{ color: "#F7F4EC" }} />}
    </button>
  );
}
