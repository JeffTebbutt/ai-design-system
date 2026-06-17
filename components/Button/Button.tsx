import { ReactNode } from "react";

type ButtonProps = {
  children: ReactNode;
};

export function Button({ children }: ButtonProps) {
  return (
    <button className="px-large h-7xl min-w-9xl rounded-full bg-surface-primary text-on-surface-primary hover:bg-surface-primary-weak">
      {children}
    </button>
  );
}
