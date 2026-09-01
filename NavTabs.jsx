import React from "react";
import { Compass, Plus, MoreVertical } from "./icons.jsx";
import { useLongPress } from "./hooks.js";

function CategoryTab({ category, active, onSelect, onMenu }) {
  const lp = useLongPress(onMenu, onSelect);
  return (
    <div className="relative group">
      <button
        {...lp}
        className={`text-xs pl-3 pr-6 py-1.5 rounded-full flex items-center gap-1.5 select-none ${active ? "wm-tab-active" : "wm-tab"}`}
      >
        <span className="w-2 h-2 rounded-full inline-block" style={{ background: category.color }} />
        {category.name}
      </button>
      <button
        onClick={onMenu}
        className="absolute right-1.5 top-1/2 -translate-y-1/2 opacity-60 hover:opacity-100"
        style={{ color: active ? "#F7F4EC" : "#26313A" }}
        title="Category options"
      >
        <MoreVertical size={12} />
      </button>
    </div>
  );
}

export default function NavTabs({
  categories, goals, activeView, setActiveView,
  addingCategory, setAddingCategory, newCategoryName, setNewCategoryName, addCategory,
  onCategoryMenu,
}) {
  const hasUnsorted = goals.some((g) => !g.category);
  return (
    <div className="flex flex-wrap items-center gap-2 mb-6">
      <button
        onClick={() => setActiveView("overview")}
        className={`text-xs px-3 py-1.5 rounded-full flex items-center gap-1.5 ${activeView === "overview" ? "wm-tab-active" : "wm-tab"}`}
      >
        <Compass size={12} /> Overview
      </button>
      {categories.map((c) => (
        <CategoryTab
          key={c.id}
          category={c}
          active={activeView === c.id}
          onSelect={() => setActiveView(c.id)}
          onMenu={() => onCategoryMenu(c.id)}
        />
      ))}
      {hasUnsorted && (
        <button
          onClick={() => setActiveView("unsorted")}
          className={`text-xs px-3 py-1.5 rounded-full flex items-center gap-1.5 ${activeView === "unsorted" ? "wm-tab-active" : "wm-tab"}`}
        >
          <span className="w-2 h-2 rounded-full inline-block" style={{ background: "#C9C2AF" }} />
          Unsorted
        </button>
      )}
      {addingCategory ? (
        <div className="flex items-center gap-1">
          <input
            autoFocus
            className="wm-input rounded-full px-3 py-1 text-xs w-32"
            placeholder="Category name"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") addCategory(newCategoryName);
              if (e.key === "Escape") { setAddingCategory(false); setNewCategoryName(""); }
            }}
          />
          <button onClick={() => addCategory(newCategoryName)} className="wm-btn rounded-full px-2.5 py-1 text-xs">
            Add
          </button>
        </div>
      ) : (
        <button onClick={() => setAddingCategory(true)} className="wm-btn-ghost w-6 h-6 rounded-full flex items-center justify-center" title="Add category">
          <Plus size={13} />
        </button>
      )}
    </div>
  );
}
