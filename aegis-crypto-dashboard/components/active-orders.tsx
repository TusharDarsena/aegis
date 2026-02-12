"use client";

import { motion } from "framer-motion";
import { Clock, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import type { Order } from "@/hooks/use-aegis-data";
import { cn } from "@/lib/utils";

interface ActiveOrdersProps {
  orders: Order[];
}

const stateConfig = {
  OPEN: {
    label: "Open",
    icon: Clock,
    className: "bg-primary/10 text-primary",
  },
  FILLED: {
    label: "Filled",
    icon: CheckCircle2,
    className: "bg-success/10 text-success",
  },
  CANCELLED: {
    label: "Cancelled",
    icon: XCircle,
    className: "bg-destructive/10 text-destructive",
  },
  EXPIRED: {
    label: "Expired",
    icon: AlertTriangle,
    className: "bg-muted-foreground/10 text-muted-foreground",
  },
};

export function ActiveOrders({ orders }: ActiveOrdersProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="rounded-2xl border border-border/50 bg-card/30 backdrop-blur-md"
    >
      <div className="border-b border-border/50 px-6 py-4">
        <h3 className="text-sm font-semibold text-foreground">
          Recent Activity
        </h3>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Your latest OTC trades
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border/30">
              <th className="px-6 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70">
                Order
              </th>
              <th className="px-6 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70">
                Pair
              </th>
              <th className="px-6 py-3 text-right text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70">
                Amount
              </th>
              <th className="px-6 py-3 text-center text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70">
                Status
              </th>
              <th className="px-6 py-3 text-right text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70">
                Time
              </th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order, i) => {
              const config = stateConfig[order.state];
              const Icon = config.icon;
              return (
                <motion.tr
                  key={order.orderHash}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 * i }}
                  className="border-b border-border/20 transition-colors hover:bg-secondary/30"
                >
                  <td className="px-6 py-3.5">
                    <span className="font-mono text-xs text-muted-foreground">
                      {order.orderHash}
                    </span>
                  </td>
                  <td className="px-6 py-3.5">
                    <span className="text-sm font-medium text-foreground">
                      {order.signer.tokenId}
                      <span className="text-muted-foreground/60">
                        {" / "}
                      </span>
                      {order.sender.tokenId}
                    </span>
                  </td>
                  <td className="px-6 py-3.5 text-right">
                    <div className="flex flex-col items-end">
                      <span className="font-mono text-sm text-foreground">
                        {order.signer.amount} {order.signer.tokenId}
                      </span>
                      <span className="font-mono text-xs text-muted-foreground">
                        {order.sender.amount} {order.sender.tokenId}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-3.5 text-center">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium",
                        config.className
                      )}
                    >
                      <Icon className="h-3 w-3" />
                      {config.label}
                    </span>
                  </td>
                  <td className="px-6 py-3.5 text-right">
                    <span className="font-mono text-xs text-muted-foreground">
                      {order.timeAgo}
                    </span>
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}
