"use client";

import React, { useState } from "react";
import { BookDemoModal } from "./book-demo-modal";

interface BookDemoTriggerProps {
  children: React.ReactNode;
  className?: string;
}

export function BookDemoTrigger({ children, className }: BookDemoTriggerProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={className}
      >
        {children}
      </button>
      <BookDemoModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
