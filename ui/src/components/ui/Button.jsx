import React from "react";
export function Button({ children, className="", variant="primary", ...props }){
  const base = "inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm";
  const styles = variant==="outline"
    ? "border bg-white hover:bg-gray-50"
    : "bg-black text-white hover:bg-gray-800";
  return <button className={`${base} ${styles} ${className}`} {...props}>{children}</button>;
}
