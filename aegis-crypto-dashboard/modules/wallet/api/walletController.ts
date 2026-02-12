/**
 * Midnight Browser Wallet Controller
 * 
 * Handles connection to Midnight wallets (like Lace) via the dApp Connector API.
 * Wallets inject themselves into window.midnight object.
 */

import type {
  ConnectedAPI,
  InitialAPI,
} from '@midnight-ntwrk/dapp-connector-api';
import type {
  DustAddress,
  DustBalance,
  ShieldedAddress,
  ShieldedBalance,
  UnshieldedAddress,
  UnshieldedBalanceDappConnector,
} from './common-types';
import { WALLET_STORAGE_KEYS } from './common-types';

// The dapp-connector-api already declares window.midnight
// We only need to extend Window for cardano fallback support
declare global {
  interface Window {
    cardano?: Record<string, { midnight?: InitialAPI }>;
  }
}

// Type guard to check if value is an InitialAPI
function isInitialAPI(value: unknown): value is InitialAPI {
  return (
    typeof value === 'object' &&
    value !== null &&
    'connect' in value &&
    typeof (value as { connect: unknown }).connect === 'function'
  );
}

/**
 * MidnightBrowserWallet - Manages browser wallet connections
 */
export class MidnightBrowserWallet {
  // Connection state
  public initialAPI?: InitialAPI;
  public connectedAPI?: ConnectedAPI;

  // Addresses
  public dustAddress?: DustAddress;
  public shieldedAddresses?: ShieldedAddress;
  public unshieldedAddress?: UnshieldedAddress;

  // Balances
  public dustBalance?: DustBalance;
  public dustBalanceCap?: DustBalance;
  public shieldedBalances?: ShieldedBalance;
  public unshieldedBalances?: UnshieldedBalanceDappConnector;

  // Proof server status
  public proofServerOnline: boolean = false;

  private rdns: string;
  private networkID: string;

  private constructor(rdns: string, networkID: string) {
    this.rdns = rdns;
    this.networkID = networkID;
  }

  /**
   * Get all available wallets from window.midnight (and fallbacks)
   */
  static getAvailableWallets(): (InitialAPI & { key: string })[] {
    if (typeof window === 'undefined') {
      console.log('[MidnightBrowserWallet] SSR - no window');
      return [];
    }

    const wallets: (InitialAPI & { key: string })[] = [];

    // Check window.midnight
    if (window.midnight && typeof window.midnight === 'object') {
      // Check if midnight itself is the API directly
      if (isInitialAPI(window.midnight)) {
        console.log('[MidnightBrowserWallet] window.midnight is the API directly');
        wallets.push({
          ...window.midnight,
          key: 'midnight',
        });
      } else {
        // It's a keyed object of wallets
        const midnightObj = window.midnight as Record<string, unknown>;
        const midnightKeys = Object.keys(midnightObj);
        console.log('[MidnightBrowserWallet] window.midnight keys:', midnightKeys);
        
        for (const key of midnightKeys) {
          const api = midnightObj[key];
          if (isInitialAPI(api)) {
            wallets.push({ ...api, key });
          }
        }
      }
    } else {
      console.log('[MidnightBrowserWallet] window.midnight not found or not object:', window.midnight);
    }

    // Also check window.cardano.*.midnight (Lace injects here too)
    if (window.cardano && typeof window.cardano === 'object') {
      console.log('[MidnightBrowserWallet] window.cardano keys:', Object.keys(window.cardano));
      
      for (const [walletName, walletObj] of Object.entries(window.cardano)) {
        if (walletObj && typeof walletObj === 'object' && 'midnight' in walletObj) {
          const midnightAPI = walletObj.midnight;
          if (isInitialAPI(midnightAPI)) {
            const key = `cardano.${walletName}.midnight`;
            console.log('[MidnightBrowserWallet] Found Midnight API in cardano:', key);
            wallets.push({ ...midnightAPI, key });
          }
        }
      }
    }
    
    console.log('[MidnightBrowserWallet] Total wallets found:', wallets.length, wallets.map(w => w.key));
    return wallets;
  }

  /**
   * Get stored connection info from localStorage
   */
  static getStoredConnection(): { rdns: string | null; networkID: string | null } {
    if (typeof window === 'undefined') {
      return { rdns: null, networkID: null };
    }

    return {
      rdns: localStorage.getItem(WALLET_STORAGE_KEYS.RDNS),
      networkID: localStorage.getItem(WALLET_STORAGE_KEYS.NETWORK_ID),
    };
  }

  /**
   * Connect to a specific wallet by key (from getAvailableWallets)
   */
  static async connectToWallet(rdns: string, networkID: string): Promise<MidnightBrowserWallet> {
    if (typeof window === 'undefined') {
      throw new Error('Wallet connection is only available in browser');
    }
    
    let walletAPI: InitialAPI | undefined;

    // Handle different injection paths based on key format
    if (rdns === 'midnight' && window.midnight) {
      // window.midnight is the API directly
      if (isInitialAPI(window.midnight)) {
        walletAPI = window.midnight;
      }
    } else if (rdns.startsWith('cardano.') && window.cardano) {
      // e.g., "cardano.lace.midnight"
      const parts = rdns.split('.');
      const walletName = parts[1]; // "lace"
      const cardanoWallet = window.cardano[walletName];
      if (cardanoWallet && 'midnight' in cardanoWallet && isInitialAPI(cardanoWallet.midnight)) {
        walletAPI = cardanoWallet.midnight;
      }
    } else if (window.midnight && typeof window.midnight === 'object') {
      // Standard keyed access in window.midnight
      const midnightObj = window.midnight as Record<string, unknown>;
      const candidate = midnightObj[rdns];
      if (isInitialAPI(candidate)) {
        walletAPI = candidate;
      }
    }

    if (!walletAPI) {
      // Try to list available wallets for debugging
      const availableWallets = this.getAvailableWallets();
      const availableMsg = availableWallets.length > 0 
        ? `Available: ${availableWallets.map(w => w.key).join(', ')}` 
        : 'No wallets detected';
      throw new Error(`Wallet "${rdns}" not found. ${availableMsg}`);
    }

    const wallet = new MidnightBrowserWallet(rdns, networkID);
    wallet.initialAPI = walletAPI;

    try {
      // Request connection to the wallet using connect() method
      console.log('[MidnightBrowserWallet] Connecting to wallet...', rdns, 'network:', networkID);
      const connected = await walletAPI.connect(networkID);
      
      wallet.connectedAPI = connected;
      
      // Get wallet state
      await wallet.refresh();

      // Store connection info for auto-reconnect
      localStorage.setItem(WALLET_STORAGE_KEYS.RDNS, rdns);
      localStorage.setItem(WALLET_STORAGE_KEYS.NETWORK_ID, networkID);

      console.log('[MidnightBrowserWallet] Connected successfully');
      return wallet;
    } catch (error) {
      console.error('[MidnightBrowserWallet] Connection failed:', error);
      throw error;
    }
  }

  /**
   * Refresh wallet state (addresses, balances)
   */
  async refresh(): Promise<void> {
    if (!this.connectedAPI) {
      throw new Error('Wallet not connected');
    }

    try {
      // Get addresses using the proper API methods
      const dustAddressResult = await this.connectedAPI.getDustAddress();
      this.dustAddress = dustAddressResult.dustAddress;

      const shieldedResult = await this.connectedAPI.getShieldedAddresses();
      this.shieldedAddresses = shieldedResult.shieldedAddress;

      const unshieldedResult = await this.connectedAPI.getUnshieldedAddress();
      this.unshieldedAddress = unshieldedResult.unshieldedAddress;

      // Get balances
      const dustBalanceResult = await this.connectedAPI.getDustBalance();
      this.dustBalance = dustBalanceResult.balance;
      this.dustBalanceCap = dustBalanceResult.cap;

      const shieldedBalances = await this.connectedAPI.getShieldedBalances();
      // Store first balance or undefined
      const shieldedKeys = Object.keys(shieldedBalances);
      this.shieldedBalances = shieldedKeys.length > 0 ? shieldedBalances[shieldedKeys[0]] : undefined;

      console.log('[MidnightBrowserWallet] Wallet state refreshed');
    } catch (error) {
      console.error('[MidnightBrowserWallet] Refresh failed:', error);
      throw error;
    }
  }

  /**
   * Disconnect from wallet
   */
  disconnect(): void {
    // Clear stored connection
    localStorage.removeItem(WALLET_STORAGE_KEYS.RDNS);
    localStorage.removeItem(WALLET_STORAGE_KEYS.NETWORK_ID);

    // Reset state
    this.connectedAPI = undefined;
    this.dustAddress = undefined;
    this.dustBalance = undefined;
    this.shieldedAddresses = undefined;
    this.shieldedBalances = undefined;
    this.unshieldedAddress = undefined;
    this.unshieldedBalances = undefined;
    this.proofServerOnline = false;

    console.log('[MidnightBrowserWallet] Disconnected');
  }

  /**
   * Get the connected wallet address (formatted for display)
   */
  getDisplayAddress(): string {
    if (!this.dustAddress) return '';
    const addr = this.dustAddress;
    if (addr.length <= 12) return addr;
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  }

  /**
   * Get DUST balance formatted for display
   */
  getDisplayBalance(): string {
    if (this.dustBalance === undefined) return '0';
    // DUST has 8 decimal places
    const value = Number(this.dustBalance) / 1e8;
    return value.toLocaleString(undefined, { 
      minimumFractionDigits: 2,
      maximumFractionDigits: 4 
    });
  }
}
