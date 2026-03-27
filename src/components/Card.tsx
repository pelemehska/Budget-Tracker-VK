import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface CardProps {
  children: ReactNode;
  className?: string;
  noPadding?: boolean;
}

export function Card({ children, className, noPadding = false }: CardProps) {
  return (
    <div
      className={cn(
        "bg-card rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] overflow-hidden",
        !noPadding && "p-5 sm:p-6 md:p-7",
        className
      )}
    >
      {children}
    </div>
  );
}
