"use client";

import React from "react"

import { Activity, Signal, Lock } from "lucide-react";
import { motion } from "framer-motion";

export function MarketStatusBar() {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center justify-between rounded-xl border border-border/50 bg-card/30 px-5 py-3 backdrop-blur-md"
    >
      <StatusItem
        icon={<Activity className="h-3.5 w-3.5" />}
        label="System Status"
        value="Online"
        color="success"
      />
      <Divider />
      <StatusItem
        icon={<Signal className="h-3.5 w-3.5" />}
        label="Active Makers"
        value="3"
        color="primary"
      />
      <Divider />
      <StatusItem
        icon={<Lock className="h-3.5 w-3.5" />}
        label="ZK Privacy"
        value="Enabled"
        color="success"
      />
    </motion.div>
  );
}

function StatusItem({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: "success" | "primary";
}) {
  const dotClass =
    color === "success" ? "bg-success" : "bg-primary";
  const textClass =
    color === "success" ? "text-success" : "text-primary";

  return (
    <div className="flex items-center gap-3">
      <div className={`${textClass}`}>{icon}</div>
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">{label}:</span>
        <span className="flex items-center gap-1.5">
          <span
            className={`h-1.5 w-1.5 rounded-full ${dotClass} animate-pulse-glow`}
          />
          <span className={`text-xs font-medium ${textClass}`}>{value}</span>
        </span>
      </div>
    </div>
  );
}

function Divider() {
  return <div className="h-4 w-px bg-border/50" />;
}
