/**
 * RFQ API Hook - Interface with Whisper Room server
 * 
 * Enhanced with:
 * - cancelOrder() for soft cancel
 * - getUserOrders() for ActiveOrdersPanel
 * - getMakers() for MakersModal
 * - quoteExpiry exposed in state
 */

import { useState, useCallback } from 'react';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000';

// ============================================================================
// TYPES
// ============================================================================

export interface Quote {
    orderHash: string;
    nonce: string;
    expiry: number;
    signer: {
        wallet: string;
        tokenId: string;
        amount: string;
    };
    sender: {
        wallet: string;
        tokenId: string;
        amount: string;
    };
}

export interface Order {
    orderHash: string;
    state: 'OPEN' | 'FILLED' | 'CANCELLED' | 'EXPIRED';
    nonce: string;
    expiry: number;
    signer: {
        wallet: string;
        tokenId: string;
        amount: string;
    };
    sender: {
        wallet: string;
        tokenId: string;
        amount: string;
    };
    createdAt: number;
    updatedAt: number;
}

export interface Maker {
    id: string;
    name: string;
    pairs: string[];
    online: boolean;
    type: 'automated' | 'manual';
}

export interface RfqState {
    isLoading: boolean;
    quote: Quote | null;
    quoteExpiry: number | null;
    error: string | null;
}

// ============================================================================
// HOOK
// ============================================================================

export function useRfq() {
    const [state, setState] = useState<RfqState>({
        isLoading: false,
        quote: null,
        quoteExpiry: null,
        error: null,
    });

    /**
     * Request a quote from the server
     */
    const requestQuote = useCallback(async (
        buyTokenId: string,
        sellTokenId: string,
        sellAmount: string,
        requesterWallet: string
    ) => {
        setState({ isLoading: true, quote: null, quoteExpiry: null, error: null });

        try {
            const response = await fetch(`${API_BASE}/rfq`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    buyTokenId,
                    sellTokenId,
                    sellAmount,
                    requesterWallet,
                }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || 'No quotes available');
            }

            const data = await response.json();
            const quote: Quote = {
                orderHash: data.order.orderHash,
                nonce: data.order.nonce,
                expiry: data.order.expiry,
                signer: data.order.signer,
                sender: data.order.sender,
            };

            setState({
                isLoading: false,
                quote,
                quoteExpiry: data.quoteExpiry,
                error: null,
            });
            return quote;
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to get quote';
            setState({ isLoading: false, quote: null, quoteExpiry: null, error: message });
            return null;
        }
    }, []);

    /**
     * Execute (fill) a swap order
     */
    const executeSwap = useCallback(async (orderHash: string) => {
        try {
            const response = await fetch(`${API_BASE}/orders/${orderHash}/fill`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
            });

            if (!response.ok) {
                throw new Error('Failed to execute swap');
            }

            // Clear quote after successful swap
            setState(prev => ({ ...prev, quote: null, quoteExpiry: null }));
            return true;
        } catch (err) {
            console.error('Swap error:', err);
            return false;
        }
    }, []);

    /**
     * Cancel an order (soft cancel)
     */
    const cancelOrder = useCallback(async (orderHash: string, wallet: string) => {
        try {
            const response = await fetch(`${API_BASE}/orders/${orderHash}/cancel`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ wallet }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to cancel order');
            }

            // Clear quote if it matches the cancelled order
            setState(prev => {
                if (prev.quote?.orderHash === orderHash) {
                    return { ...prev, quote: null, quoteExpiry: null };
                }
                return prev;
            });

            return true;
        } catch (err) {
            console.error('Cancel error:', err);
            return false;
        }
    }, []);

    /**
     * Get user's orders (for ActiveOrdersPanel)
     */
    const getUserOrders = useCallback(async (wallet: string): Promise<Order[]> => {
        try {
            const response = await fetch(`${API_BASE}/orders?wallet=${encodeURIComponent(wallet)}`);

            if (!response.ok) {
                throw new Error('Failed to fetch orders');
            }

            return await response.json();
        } catch (err) {
            console.error('Get orders error:', err);
            return [];
        }
    }, []);

    /**
     * Get active market makers (for MakersModal)
     */
    const getMakers = useCallback(async (): Promise<{ makers: Maker[]; count: number }> => {
        try {
            const response = await fetch(`${API_BASE}/makers`);

            if (!response.ok) {
                throw new Error('Failed to fetch makers');
            }

            return await response.json();
        } catch (err) {
            console.error('Get makers error:', err);
            return { makers: [], count: 0 };
        }
    }, []);

    /**
     * Clear current quote
     */
    const clearQuote = useCallback(() => {
        setState({ isLoading: false, quote: null, quoteExpiry: null, error: null });
    }, []);

    return {
        ...state,
        requestQuote,
        executeSwap,
        cancelOrder,
        getUserOrders,
        getMakers,
        clearQuote,
    };
}
