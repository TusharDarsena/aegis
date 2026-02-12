"use client";

import { useState, useEffect, useCallback } from "react";
import {
  ArrowDownUp,
  Loader2,
  ShieldCheck,
  X,
  CheckCircle2,
  Lock,
  Ban,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { Quote } from "@/hooks/use-aegis-data";

const TOKENS = ["BTC", "ETH", "USDC"];

interface SwapWidgetProps {
  quote: Quote | null;
  isLoading: boolean;
  isSwapping: boolean;
  swapSuccess: boolean;
  onRequestQuote: (
    payToken: string,
    payAmount: string,
    receiveToken: string
  ) => void;
  onSignAndSwap: () => void;
  onCancelQuote: () => void;
  onDismissSuccess: () => void;
}

export function SwapWidget({
  quote,
  isLoading,
  isSwapping,
  swapSuccess,
  onRequestQuote,
  onSignAndSwap,
  onCancelQuote,
  onDismissSuccess,
}: SwapWidgetProps) {
  const [payToken, setPayToken] = useState("BTC");
  const [receiveToken, setReceiveToken] = useState("USDC");
  const [payAmount, setPayAmount] = useState("");
  const [timeLeft, setTimeLeft] = useState(30);

  // Countdown timer when quote is active
  useEffect(() => {
    if (!quote) {
      setTimeLeft(30);
      return;
    }
    const interval = setInterval(() => {
      const remaining = Math.max(
        0,
        Math.floor((quote.expiry - Date.now()) / 1000)
      );
      setTimeLeft(remaining);
      if (remaining <= 0) {
        onCancelQuote();
      }
    }, 100);
    return () => clearInterval(interval);
  }, [quote, onCancelQuote]);

  const handleSwapTokens = useCallback(() => {
    setPayToken(receiveToken);
    setReceiveToken(payToken);
  }, [payToken, receiveToken]);

  const handleRequestQuote = useCallback(() => {
    if (!payAmount || parseFloat(payAmount) <= 0) return;
    onRequestQuote(payToken, payAmount, receiveToken);
  }, [payToken, payAmount, receiveToken, onRequestQuote]);

  const canRequest = payAmount && parseFloat(payAmount) > 0 && !isLoading;

  return (
    <motion.div
      layout
      className="relative mx-auto w-full max-w-md overflow-hidden rounded-2xl border border-border/50 bg-card/50 backdrop-blur-xl glow-blue"
    >
      {/* ZK Proof Overlay */}
      <AnimatePresence>
        {isSwapping && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-4 rounded-2xl bg-background/90 backdrop-blur-md"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
              <ShieldCheck className="h-12 w-12 text-primary" />
            </motion.div>
            <p className="font-mono text-sm text-primary">
              Verifying ZK Proof...
            </p>
            <div className="h-1 w-48 overflow-hidden rounded-full bg-secondary">
              <motion.div
                className="h-full bg-primary"
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: 2.5, ease: "easeInOut" }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success Overlay */}
      <AnimatePresence>
        {swapSuccess && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-4 rounded-2xl bg-background/95 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.1 }}
            >
              <CheckCircle2 className="h-16 w-16 text-success" />
            </motion.div>
            <div className="text-center">
              <p className="text-lg font-semibold text-foreground">
                Swap Executed
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Settlement confirmed on-chain
              </p>
            </div>
            <button
              onClick={onDismissSuccess}
              className="mt-2 rounded-lg bg-success/10 px-6 py-2 text-sm font-medium text-success transition-colors hover:bg-success/20"
              type="button"
            >
              Done
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="border-b border-border/50 px-6 py-4">
        <h2 className="text-base font-semibold text-foreground">
          Whisper Room
        </h2>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Private OTC Swap via Request for Quote
        </p>
      </div>

      {/* Swap Form */}
      <div className="p-6">
        {/* You Pay */}
        <div className="rounded-xl border border-border/50 bg-secondary/50 p-4">
          <label className="text-xs font-medium text-muted-foreground">
            You Pay
          </label>
          <div className="mt-2 flex items-center gap-3">
            <TokenSelector
              value={payToken}
              onChange={setPayToken}
              exclude={receiveToken}
            />
            <input
              type="number"
              value={payAmount}
              onChange={(e) => setPayAmount(e.target.value)}
              placeholder="0.00"
              className="w-full bg-transparent text-right font-mono text-2xl font-semibold text-foreground outline-none placeholder:text-muted-foreground/40"
            />
          </div>
        </div>

        {/* Swap Direction Button */}
        <div className="relative z-10 -my-3 flex justify-center">
          <button
            onClick={handleSwapTokens}
            className="rounded-xl border border-border bg-secondary p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            type="button"
            aria-label="Swap token direction"
          >
            <ArrowDownUp className="h-4 w-4" />
          </button>
        </div>

        {/* You Receive */}
        <div className="rounded-xl border border-border/50 bg-secondary/50 p-4">
          <label className="text-xs font-medium text-muted-foreground">
            You Receive
          </label>
          <div className="mt-2 flex items-center gap-3">
            <TokenSelector
              value={receiveToken}
              onChange={setReceiveToken}
              exclude={payToken}
            />
            <div className="w-full text-right font-mono text-2xl font-semibold">
              {quote ? (
                <motion.span
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-success"
                >
                  {Number(quote.signer.amount).toLocaleString()}
                </motion.span>
              ) : (
                <span className="text-muted-foreground/40">{"---"}</span>
              )}
            </div>
          </div>
        </div>

        {/* Quote Details */}
        <AnimatePresence>
          {quote && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="mt-4 rounded-xl border border-border/50 bg-secondary/30 p-4">
                {/* Countdown Bar */}
                <div className="mb-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">
                      Quote expires in
                    </span>
                    <span
                      className={`font-mono font-medium ${timeLeft <= 10 ? "text-destructive" : "text-primary"}`}
                    >
                      {timeLeft}s
                    </span>
                  </div>
                  <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-secondary">
                    <motion.div
                      className={`h-full rounded-full ${timeLeft <= 10 ? "bg-destructive" : "bg-primary"}`}
                      style={{ width: `${(timeLeft / 30) * 100}%` }}
                      transition={{ duration: 0.1 }}
                    />
                  </div>
                </div>

                {/* Price Info */}
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Rate</span>
                  <span className="font-mono text-foreground">
                    {"1 "}
                    {quote.sender.tokenId}
                    {" = "}
                    {(
                      parseFloat(quote.signer.amount) /
                      parseFloat(quote.sender.amount)
                    ).toLocaleString(undefined, { maximumFractionDigits: 6 })}
                    {" "}
                    {quote.signer.tokenId}
                  </span>
                </div>

                {/* Privacy Badge */}
                <div className="mt-3 flex items-center gap-3">
                  <span className="flex items-center gap-1 rounded-full bg-success/10 px-2.5 py-1 text-[10px] font-medium text-success">
                    <Ban className="h-3 w-3" />
                    No Slippage
                  </span>
                  <span className="flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-medium text-primary">
                    <Lock className="h-3 w-3" />
                    Zero Knowledge
                  </span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action Buttons */}
        <div className="mt-4">
          {!quote ? (
            <button
              onClick={handleRequestQuote}
              disabled={!canRequest}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-sm font-semibold text-primary-foreground transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
              type="button"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Finding best price...</span>
                </>
              ) : (
                "Request Quote"
              )}
            </button>
          ) : (
            <div className="flex gap-3">
              <button
                onClick={onCancelQuote}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-border py-3.5 text-sm font-medium text-muted-foreground transition-colors hover:border-destructive/50 hover:text-destructive"
                type="button"
              >
                <X className="h-4 w-4" />
                Cancel
              </button>
              <button
                onClick={onSignAndSwap}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-success py-3.5 text-sm font-semibold text-success-foreground transition-all hover:brightness-110 glow-green"
                type="button"
              >
                <ShieldCheck className="h-4 w-4" />
                {"Sign & Swap"}
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function TokenSelector({
  value,
  onChange,
  exclude,
}: {
  value: string;
  onChange: (v: string) => void;
  exclude: string;
}) {
  const available = TOKENS.filter((t) => t !== exclude);

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="appearance-none rounded-lg border border-border/50 bg-secondary px-3 py-2 font-mono text-sm font-semibold text-foreground outline-none transition-colors hover:bg-accent focus:ring-1 focus:ring-primary"
    >
      {available.map((token) => (
        <option key={token} value={token}>
          {token}
        </option>
      ))}
    </select>
  );
}
