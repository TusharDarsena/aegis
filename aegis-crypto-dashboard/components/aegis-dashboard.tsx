"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { AegisSidebar } from "@/components/aegis-sidebar";
import { MarketStatusBar } from "@/components/market-status-bar";
import { SwapWidget } from "@/components/swap-widget";
import { ActiveOrders } from "@/components/active-orders";
import { useAegisData } from "@/hooks/use-aegis-data";
import { BarChart3, Clock } from "lucide-react";

export function AegisDashboard() {
  const [activeView, setActiveView] = useState("swap");
  const {
    orders,
    quote,
    isLoading,
    isSwapping,
    swapSuccess,
    walletConnected,
    walletAddress,
    requestQuote,
    signAndSwap,
    cancelQuote,
    connectWallet,
    setSwapSuccess,
  } = useAegisData();

  return (
    <div className="flex min-h-screen bg-background">
      <AegisSidebar
        activeView={activeView}
        onViewChange={setActiveView}
        walletConnected={walletConnected}
        walletAddress={walletAddress}
        onConnectWallet={connectWallet}
      />

      <main className="ml-64 flex-1">
        <div className="mx-auto max-w-5xl px-8 py-6">
          {/* Status Bar */}
          <MarketStatusBar />

          {/* Views */}
          {activeView === "swap" && (
            <motion.div
              key="swap"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-8 flex flex-col gap-8"
            >
              <SwapWidget
                quote={quote}
                isLoading={isLoading}
                isSwapping={isSwapping}
                swapSuccess={swapSuccess}
                onRequestQuote={requestQuote}
                onSignAndSwap={signAndSwap}
                onCancelQuote={cancelQuote}
                onDismissSuccess={() => setSwapSuccess(false)}
              />
              <ActiveOrders orders={orders} />
            </motion.div>
          )}

          {activeView === "orders" && (
            <motion.div
              key="orders"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-8"
            >
              <div className="mb-6">
                <h1 className="text-xl font-semibold text-foreground">
                  Order History
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Full history of your OTC trades
                </p>
              </div>
              <ActiveOrders orders={orders} />
            </motion.div>
          )}

          {activeView === "analytics" && (
            <motion.div
              key="analytics"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-8"
            >
              <div className="mb-6">
                <h1 className="text-xl font-semibold text-foreground">
                  Analytics
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Trading volume and performance metrics
                </p>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <StatCard
                  label="Total Volume"
                  value="$203,210"
                  change="+12.4%"
                />
                <StatCard
                  label="Trades Completed"
                  value="47"
                  change="+3"
                />
                <StatCard
                  label="Avg. Settlement"
                  value="2.4s"
                  change="-0.3s"
                />
              </div>
              <div className="mt-4 flex items-center justify-center rounded-2xl border border-border/50 bg-card/30 p-16 backdrop-blur-md">
                <div className="flex flex-col items-center gap-3 text-muted-foreground">
                  <BarChart3 className="h-10 w-10 text-muted-foreground/30" />
                  <p className="text-sm">
                    Advanced charts coming soon
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </main>
    </div>
  );
}

function StatCard({
  label,
  value,
  change,
}: {
  label: string;
  value: string;
  change: string;
}) {
  const isPositive = change.startsWith("+") || change.startsWith("-0");
  return (
    <div className="rounded-xl border border-border/50 bg-card/30 p-5 backdrop-blur-md">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-2 font-mono text-2xl font-semibold text-foreground">
        {value}
      </p>
      <p
        className={`mt-1 font-mono text-xs font-medium ${isPositive ? "text-success" : "text-destructive"}`}
      >
        {change}
      </p>
    </div>
  );
}
