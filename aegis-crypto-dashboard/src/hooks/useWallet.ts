/**
 * useWallet Hook
 * 
 * Provides access to Midnight wallet connection and state.
 * Replaces mock implementation with real dapp-connector-api integration.
 */

import { useContext } from 'react';
import { WalletContext } from '../modules/wallet/contexts/WalletContext';
import type { WalletContextType } from '../modules/wallet/contexts/WalletContext';

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
