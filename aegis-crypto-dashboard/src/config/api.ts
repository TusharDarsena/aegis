// Configuration for connecting to Aegis RFQ server
// Note: These are also available via environment variables:
//   NEXT_PUBLIC_API_BASE - REST API base URL
//   NEXT_PUBLIC_WS_BASE  - WebSocket base URL

export const API_CONFIG = {
  baseURL: process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3001',
  wsURL: process.env.NEXT_PUBLIC_WS_BASE || 'ws://localhost:3001',
};

export type QuoteResponse = {
  success: boolean;
  order?: {
    orderHash: string;
    nonce: string;
    expiry: number;
    signer: { wallet: string; tokenId: string; amount: string };
    sender: { wallet: string; tokenId: string; amount: string };
    state: 'OPEN' | 'FILLED' | 'CANCELLED' | 'EXPIRED';
  };
  quoteExpiry?: number;
  error?: string;
};