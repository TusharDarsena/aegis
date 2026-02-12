/**
 * Browser Wallet Types
 * Types for Midnight browser wallet integration via dApp connector
 */

// Address and Balance types for browser wallet
export type DustAddress = string;
export type DustBalance = bigint;
export type ShieldedAddress = string;
export type ShieldedBalance = bigint;
export type UnshieldedAddress = string;

export interface UnshieldedBalanceDappConnector {
  tokenId: string;
  amount: bigint;
}

// Network configuration
export interface NetworkConfig {
  networkId: string;
  indexerUri: string;
  indexerWsUri: string;
  nodeUri: string;
  proofServerUri: string;
}

// Known Midnight networks
export const MIDNIGHT_NETWORKS: Record<string, NetworkConfig> = {
  'testnet': {
    networkId: 'testnet',
    indexerUri: 'https://indexer.testnet.midnight.network/api/v3/graphql',
    indexerWsUri: 'wss://indexer.testnet.midnight.network/api/v3/graphql/ws',
    nodeUri: 'https://node.testnet.midnight.network',
    proofServerUri: 'https://proof-server.testnet.midnight.network',
  },
  'devnet': {
    networkId: 'devnet',
    indexerUri: 'http://localhost:8088/api/v3/graphql',
    indexerWsUri: 'ws://localhost:8088/api/v3/graphql/ws',
    nodeUri: 'http://localhost:9944',
    proofServerUri: 'http://localhost:6300',
  },
  // "Undeployed" in Lace Midnight Preview = local devnet
  'undeployed': {
    networkId: 'undeployed',
    indexerUri: 'http://localhost:8088/api/v3/graphql',
    indexerWsUri: 'ws://localhost:8088/api/v3/graphql/ws',
    nodeUri: 'http://localhost:9944',
    proofServerUri: 'http://localhost:6300',
  },
};

// Known wallet RDNS identifiers
export const KNOWN_WALLET_RDNS = {
  LACE: 'io.lace',
  LACE_WALLET: 'io.lace.wallet', 
  LACE_MIDNIGHT: 'midnight',
} as const;

// Storage keys for wallet persistence
export const WALLET_STORAGE_KEYS = {
  RDNS: 'midnight-wallet-rdns',
  NETWORK_ID: 'midnight-wallet-network-id',
} as const;
