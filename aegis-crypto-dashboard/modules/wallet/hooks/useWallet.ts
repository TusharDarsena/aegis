/**
 * useWallet Hook
 * 
 * Provides access to Midnight wallet connection and state.
 * Uses the dApp Connector API for real wallet integration.
 */
'use client';

import { useContext } from 'react';
import { WalletContext } from '../contexts/WalletContext';
import type { WalletContextType } from '../contexts/WalletContext';

export function useWallet(): WalletContextType {
    const context = useContext(WalletContext);

    if (!context) {
        throw new Error('useWallet must be used within a WalletProvider');
    }

    return context;
}

// Convenience hook for just the address
export function useWalletAddress(): string | null {
    const { dustAddress } = useWallet();
    return dustAddress ?? null;
}

// Convenience hook for connection status
export function useWalletConnected(): boolean {
    const { isConnected } = useWallet();
    return isConnected;
}

// Convenience hook for display address
export function useDisplayAddress(): string {
    const { displayAddress } = useWallet();
    return displayAddress;
}

// Convenience hook for display balance
export function useDisplayBalance(): string {
    const { displayBalance } = useWallet();
    return displayBalance;
}
