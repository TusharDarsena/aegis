/**
 * Wallet Module Exports
 */

// Context & Provider
export { WalletContext, WalletProvider } from './contexts/WalletContext';
export type { WalletContextType } from './contexts/WalletContext';

// Hooks
export { 
    useWallet, 
    useWalletAddress, 
    useWalletConnected,
    useDisplayAddress,
    useDisplayBalance,
} from './hooks/useWallet';

// Types
export type {
    DustAddress,
    DustBalance,
    ShieldedAddress,
    ShieldedBalance,
    UnshieldedAddress,
    UnshieldedBalanceDappConnector,
    NetworkConfig,
} from './api/common-types';

export { MIDNIGHT_NETWORKS, WALLET_STORAGE_KEYS } from './api/common-types';

// Wallet Controller
export { MidnightBrowserWallet } from './api/walletController';
