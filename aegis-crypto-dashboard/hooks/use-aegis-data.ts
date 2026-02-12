"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useWallet, useWalletAddress, useWalletConnected, useDisplayAddress } from "@/modules/wallet";
import { MIDNIGHT_NETWORKS, WALLET_STORAGE_KEYS } from "@/modules/wallet/api/common-types";

// API Configuration
const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:3001";
const WS_BASE = process.env.NEXT_PUBLIC_WS_BASE || "ws://localhost:3001";

// Default network for Aegis (matches Lace "Undeployed" setting)
const DEFAULT_NETWORK = "undeployed";

export interface QuoteSigner {
  wallet: string;
  tokenId: string;
  amount: string;
}

export interface QuoteSender {
  wallet: string;
  tokenId: string;
  amount: string;
}

export interface Quote {
  orderHash: string;
  expiry: number;
  signer: QuoteSigner;
  sender: QuoteSender;
}

export interface Order {
  orderHash: string;
  state: "OPEN" | "FILLED" | "CANCELLED" | "EXPIRED";
  timeAgo: string;
  signer: { tokenId: string; amount: string };
  sender: { tokenId: string; amount: string };
}

// Transform server order to UI order format
function transformOrder(serverOrder: any): Order {
  const createdAt = serverOrder.createdAt || Date.now();
  const diff = Date.now() - createdAt;
  const minutes = Math.floor(diff / 60000);
  const timeAgo = minutes < 60 
    ? `${minutes}m ago` 
    : `${Math.floor(minutes / 60)}h ago`;

  return {
    orderHash: `${serverOrder.orderHash.slice(0, 6)}...${serverOrder.orderHash.slice(-4)}`,
    state: serverOrder.state,
    timeAgo,
    signer: {
      tokenId: serverOrder.signer?.tokenId || "???",
      amount: serverOrder.signer?.amount?.toString() || "0",
    },
    sender: {
      tokenId: serverOrder.sender?.tokenId || "???",
      amount: serverOrder.sender?.amount?.toString() || "0",
    },
  };
}

export function useAegisData() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSwapping, setIsSwapping] = useState(false);
  const [swapSuccess, setSwapSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [wsConnected, setWsConnected] = useState(false);
  
  // Real wallet integration
  const { connect, disconnect, isConnecting, error: walletError, availableWallets, setOpen } = useWallet();
  const walletConnected = useWalletConnected();
  const walletAddress = useDisplayAddress();
  const fullAddress = useWalletAddress();
  
  const wsRef = useRef<WebSocket | null>(null);
  const currentOrderHashRef = useRef<string | null>(null);

  // WebSocket connection for real-time order book updates
  useEffect(() => {
    let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
    let isCleaningUp = false;

    const connectWebSocket = () => {
      if (isCleaningUp) return;
      
      try {
        const ws = new WebSocket(WS_BASE);
        wsRef.current = ws;

        ws.onopen = () => {
          console.log("🔌 WebSocket connected to RFQ server");
          setWsConnected(true);
        };

        ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            
            if (message.type === "orderBook" && Array.isArray(message.data)) {
              const transformed = message.data.map(transformOrder);
              setOrders(transformed);
            }
            
            if (message.type === "orderFilled" && message.data) {
              // Check if this is our order
              if (message.data.orderHash === currentOrderHashRef.current) {
                setIsSwapping(false);
                setSwapSuccess(true);
                setQuote(null);
                currentOrderHashRef.current = null;
              }
            }
          } catch (err) {
            console.error("WebSocket message parse error:", err);
          }
        };

        ws.onclose = () => {
          setWsConnected(false);
          if (!isCleaningUp) {
            console.log("🔌 WebSocket disconnected, reconnecting in 5s...");
            reconnectTimeout = setTimeout(connectWebSocket, 5000);
          }
        };

        ws.onerror = () => {
          // Silently handle - onclose will trigger reconnect
          setWsConnected(false);
        };
      } catch {
        // Server not running - try again later
        if (!isCleaningUp) {
          reconnectTimeout = setTimeout(connectWebSocket, 5000);
        }
      }
    };

    connectWebSocket();

    return () => {
      isCleaningUp = true;
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      wsRef.current?.close();
    };
  }, []);

  // Request quote from RFQ server
  const requestQuote = useCallback(
    async (payToken: string, payAmount: string, receiveToken: string) => {
      setIsLoading(true);
      setQuote(null);
      setSwapSuccess(false);
      setError(null);

      try {
        // Use real wallet address if connected, otherwise generate mock
        // Midnight addresses are shorter than Ethereum - use appropriate format
        const requesterWallet = walletConnected && fullAddress
          ? fullAddress
          : "mock_" + Date.now().toString(16);

        const response = await fetch(`${API_BASE}/rfq`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            requesterWallet,
            buyTokenId: receiveToken,
            sellTokenId: payToken,
            buyAmount: payAmount,
            sellAmount: payAmount,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to get quote");
        }

        const data = await response.json();
        
        // Transform server response to Quote format
        const newQuote: Quote = {
          orderHash: data.order.orderHash,
          expiry: data.quoteExpiry * 1000, // Convert to milliseconds
          signer: {
            wallet: `${data.order.signer.wallet.slice(0, 6)}...${data.order.signer.wallet.slice(-4)}`,
            tokenId: data.order.signer.tokenId,
            amount: data.order.signer.amount.toString(),
          },
          sender: {
            wallet: `${data.order.sender.wallet.slice(0, 6)}...${data.order.sender.wallet.slice(-4)}`,
            tokenId: data.order.sender.tokenId,
            amount: data.order.sender.amount.toString(),
          },
        };

        currentOrderHashRef.current = data.order.orderHash;
        setQuote(newQuote);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to get quote";
        setError(message);
        console.error("RFQ error:", err);
      } finally {
        setIsLoading(false);
      }
    },
    [walletConnected, fullAddress]
  );

  // Execute swap by filling the order
  const signAndSwap = useCallback(async () => {
    if (!currentOrderHashRef.current) return;
    
    setIsSwapping(true);
    setError(null);

    try {
      const response = await fetch(
        `${API_BASE}/orders/${currentOrderHashRef.current}/fill`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to execute swap");
      }

      // Success will be handled by WebSocket orderFilled event
      // But also handle it here as fallback
      setIsSwapping(false);
      setSwapSuccess(true);
      setQuote(null);
      currentOrderHashRef.current = null;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Swap failed";
      setError(message);
      setIsSwapping(false);
      console.error("Swap error:", err);
    }
  }, []);

  const cancelQuote = useCallback(() => {
    setQuote(null);
    currentOrderHashRef.current = null;
  }, []);

  // Real wallet connection using Midnight dApp connector
  const connectWallet = useCallback(async () => {
    if (walletConnected) {
      await disconnect();
    } else {
      // Debug: Check what's in window.midnight
      if (typeof window !== 'undefined') {
        console.log('[Aegis] window.midnight:', window.midnight);
        console.log('[Aegis] window.midnight keys:', window.midnight ? Object.keys(window.midnight) : 'none');
      }
      
      // Check if any wallets are available
      if (availableWallets.length === 0) {
        // Try to detect wallet directly from window.midnight
        if (typeof window !== 'undefined' && window.midnight) {
          const keys = Object.keys(window.midnight);
          console.log('[Aegis] Direct check - found keys:', keys);
          
          if (keys.length > 0) {
            // Use the first key found
            const rdns = keys[0];
            try {
              await connect(rdns, DEFAULT_NETWORK);
              return;
            } catch (err) {
              console.error("Direct wallet connection failed:", err);
            }
          }
        }
        
        setError("No Midnight wallet detected. Please install and enable Lace Midnight extension.");
        window.open("https://www.lace.io/", "_blank");
        return;
      }
      
      try {
        // Use first available wallet
        const walletToUse = availableWallets[0];
        const rdns = walletToUse?.key;
        console.log('[Aegis] Connecting to wallet:', rdns, 'on network:', DEFAULT_NETWORK);
        await connect(rdns, DEFAULT_NETWORK);
      } catch (err) {
        console.error("Wallet connection failed:", err);
        const errorMessage = walletError?.message || (err instanceof Error ? err.message : "Failed to connect wallet");
        setError(errorMessage);
        setError(errorMessage);
      }
    }
  }, [walletConnected, connect, disconnect, walletError, availableWallets]);

  return {
    orders,
    quote,
    isLoading: isLoading || isConnecting,
    isSwapping,
    swapSuccess,
    walletConnected,
    walletAddress,
    error: error || walletError?.message || null,
    requestQuote,
    signAndSwap,
    cancelQuote,
    connectWallet,
    setSwapSuccess,
  };
}
