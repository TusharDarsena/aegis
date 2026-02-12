/**
 * Wallet Context
 * Provides wallet state and connection methods to React components
 */
'use client';

import { createContext, useCallback, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import type {
    ConnectedAPI,
    InitialAPI,
} from '@midnight-ntwrk/dapp-connector-api';
import { MidnightBrowserWallet } from '../api/walletController';
import type {
    DustAddress,
    DustBalance,
    ShieldedAddress,
    ShieldedBalance,
    UnshieldedAddress,
    UnshieldedBalanceDappConnector,
} from '../api/common-types';

export interface WalletContextType {
    // Connection state
    isConnecting: boolean;
    isConnected: boolean;
    error: Error | null;

    // Wallet modal
    open: boolean;
    setOpen: (value: boolean) => void;

    // Wallet APIs
    initialAPI: InitialAPI | undefined;
    connectedAPI: ConnectedAPI | undefined;

    // Addresses & Balances
    dustAddress: DustAddress | undefined;
    dustBalance: DustBalance | undefined;
    shieldedAddresses: ShieldedAddress | undefined;
    shieldedBalances: ShieldedBalance | undefined;
    unshieldedAddress: UnshieldedAddress | undefined;
    unshieldedBalances: UnshieldedBalanceDappConnector | undefined;

    // Proof server
    proofServerOnline: boolean;

    // Display helpers
    displayAddress: string;
    displayBalance: string;

    // Actions
    connect: (rdns: string, networkID: string) => Promise<void>;
    disconnect: () => void;
    refresh: () => Promise<void>;

    // Available wallets (with key for lookup)
    availableWallets: (InitialAPI & { key: string })[];
}

const defaultContext: WalletContextType = {
    isConnecting: false,
    isConnected: false,
    error: null,
    open: false,
    setOpen: () => { },
    initialAPI: undefined,
    connectedAPI: undefined,
    dustAddress: undefined,
    dustBalance: undefined,
    shieldedAddresses: undefined,
    shieldedBalances: undefined,
    unshieldedAddress: undefined,
    unshieldedBalances: undefined,
    proofServerOnline: false,
    displayAddress: '',
    displayBalance: '0',
    connect: async () => { },
    disconnect: () => { },
    refresh: async () => { },
    availableWallets: [] as (InitialAPI & { key: string })[],
};

export const WalletContext = createContext<WalletContextType>(defaultContext);

interface WalletProviderProps {
    children: ReactNode;
}

export function WalletProvider({ children }: WalletProviderProps) {
    const [isConnecting, setIsConnecting] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const [open, setOpen] = useState(false);
    const [wallet, setWallet] = useState<MidnightBrowserWallet | null>(null);
    const [availableWallets, setAvailableWallets] = useState<(InitialAPI & { key: string })[]>([]);

    // Check for available wallets on mount
    useEffect(() => {
        const checkWallets = () => {
            console.log('[WalletContext] Checking for wallets...');
            console.log('[WalletContext] window.midnight:', typeof window !== 'undefined' ? window.midnight : 'SSR');
            
            const wallets = MidnightBrowserWallet.getAvailableWallets();
            console.log('[WalletContext] Found wallets:', wallets.length);
            setAvailableWallets(wallets);
        };

        // Check immediately and after delays (wallets may inject late)
        checkWallets();
        const timeout1 = setTimeout(checkWallets, 500);
        const timeout2 = setTimeout(checkWallets, 1500);
        const timeout3 = setTimeout(checkWallets, 3000);
        
        return () => {
            clearTimeout(timeout1);
            clearTimeout(timeout2);
            clearTimeout(timeout3);
        };
    }, []);

    const connect = useCallback(async (rdns: string, networkID: string) => {
        console.log('[WalletContext] connect called with rdns:', rdns, 'networkID:', networkID);
        setIsConnecting(true);
        setError(null);

        try {
            console.log('[WalletContext] Calling MidnightBrowserWallet.connectToWallet...');
            const walletInstance = await MidnightBrowserWallet.connectToWallet(rdns, networkID);
            console.log('[WalletContext] Connected successfully:', walletInstance);
            setWallet(walletInstance);
            setOpen(false);
        } catch (err) {
            console.error('[WalletContext] Connection error:', err);
            setError(err instanceof Error ? err : new Error('Failed to connect'));
        } finally {
            console.log('[WalletContext] Connection attempt finished');
            setIsConnecting(false);
        }
    }, []);

    const disconnect = useCallback(() => {
        wallet?.disconnect();
        setWallet(null);
        setError(null);
    }, [wallet]);

    const refresh = useCallback(async () => {
        await wallet?.refresh();
        // Force re-render by creating new wallet reference
        if (wallet) {
            setWallet(Object.assign(Object.create(Object.getPrototypeOf(wallet)), wallet));
        }
    }, [wallet]);

    // Auto-reconnect on mount
    useEffect(() => {
        const { rdns, networkID } = MidnightBrowserWallet.getStoredConnection();
        if (rdns && networkID) {
            connect(rdns, networkID);
        }
    }, [connect]);

    const value: WalletContextType = {
        isConnecting,
        isConnected: !!wallet?.connectedAPI,
        error,
        open,
        setOpen,
        initialAPI: wallet?.initialAPI,
        connectedAPI: wallet?.connectedAPI,
        dustAddress: wallet?.dustAddress,
        dustBalance: wallet?.dustBalance,
        shieldedAddresses: wallet?.shieldedAddresses,
        shieldedBalances: wallet?.shieldedBalances,
        unshieldedAddress: wallet?.unshieldedAddress,
        unshieldedBalances: wallet?.unshieldedBalances,
        proofServerOnline: wallet?.proofServerOnline ?? false,
        displayAddress: wallet?.getDisplayAddress() ?? '',
        displayBalance: wallet?.getDisplayBalance() ?? '0',
        connect,
        disconnect,
        refresh,
        availableWallets,
    };

    return (
        <WalletContext.Provider value={value}>
            {children}
        </WalletContext.Provider>
    );
}
