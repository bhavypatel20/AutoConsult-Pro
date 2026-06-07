"use client";

import { useState, useEffect } from "react";
import { UserButton } from "@clerk/nextjs";

export default function SafeUserButton() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div 
        style={{ 
          width: "28px", 
          height: "28px", 
          borderRadius: "50%", 
          background: "rgba(255,255,255,0.1)" 
        }} 
      />
    );
  }

  return <UserButton />;
}
