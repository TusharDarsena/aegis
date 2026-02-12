"use client";

import { Shield, ArrowLeftRight, Clock, BarChart3, Wallet } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface AegisSidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
  walletConnected: boolean;
  walletAddress: string;
  onConnectWallet: () => void;
}

const navItems = [
  { id: "swap", label: "Swap", icon: ArrowLeftRight },
  { id: "orders", label: "Order History", icon: Clock },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
];

export function AegisSidebar({
  activeView,
  onViewChange,
  walletConnected,
  walletAddress,
  onConnectWallet,
}: AegisSidebarProps) {
  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-border/50 bg-card/80 backdrop-blur-xl">
      {/* Brand */}
      <div className="flex items-center gap-3 border-b border-border/50 px-6 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 glow-blue">
          <Shield className="h-5 w-5 text-primary" />
        </div>
        <span className="text-lg font-semibold tracking-tight text-foreground">
          Aegis
        </span>
        <span className="rounded-full bg-primary/10 px-2 py-0.5 font-mono text-[10px] font-medium text-primary">
          OTC
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4">
        <p className="mb-2 px-3 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/60">
          Terminal
        </p>
        <ul className="flex flex-col gap-1">
          {navItems.map((item) => {
            const isActive = activeView === item.id;
            return (
              <li key={item.id}>
                <button
                  onClick={() => onViewChange(item.id)}
                  className={cn(
                    "relative flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive
                      ? "text-primary-foreground"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  )}
                  type="button"
                >
                  {isActive && (
                    <motion.div
                      layoutId="sidebar-active"
                      className="absolute inset-0 rounded-lg bg-primary"
                      transition={{
                        type: "spring",
                        stiffness: 350,
                        damping: 30,
                      }}
                    />
                  )}
                  <item.icon
                    className={cn(
                      "relative z-10 h-4 w-4",
                      isActive ? "text-primary-foreground" : ""
                    )}
                  />
                  <span className="relative z-10">{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Wallet Connection */}
      <div className="border-t border-border/50 p-4">
        <button
          onClick={onConnectWallet}
          className={cn(
            "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
            walletConnected
              ? "bg-success/10 text-success hover:bg-success/15"
              : "bg-primary/10 text-primary hover:bg-primary/20"
          )}
          type="button"
        >
          <Wallet className="h-4 w-4" />
          {walletConnected ? (
            <span className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-success animate-pulse-glow" />
              <span className="font-mono text-xs">{walletAddress}</span>
            </span>
          ) : (
            "Connect Wallet"
          )}
        </button>
      </div>
    </aside>
  );
}
