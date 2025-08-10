import React from "react";
export default function AlgorithmChips({ selected=[], onToggle=()=>{} }){
  const items = [
    { id:"Elasticity", label:"Elasticity (stock/demand aware)" },
    { id:"Anchor",     label:"Anchor (catalog baseline)" },
    { id:"Promo",      label:"Promo (gentle discount)" },
  ];
  return (
    <div className="flex flex-wrap gap-2">
      {items.map(it=>{
        const active = selected.includes(it.id);
        return (
          <button key={it.id}
            className={`text-xs rounded-full px-3 py-1 border ${active?"bg-black text-white":"bg-white hover:bg-gray-50"}`}
            onClick={()=>onToggle(it.id)}>
            {it.label}
          </button>
        );
      })}
    </div>
  );
}
