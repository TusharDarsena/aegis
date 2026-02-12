// Order types aligned with Midnight blockchain semantics

export interface Party {
  wallet: string;
  tokenId: string;
  amount: bigint;
}

export interface Order {
  nonce: bigint;
  expiry: number;
  signer: Party; // The Maker
  sender: Party; // The Taker
}

export interface SignedOrder extends Order {
  proof: Uint8Array;
  orderHash: string;
}

export enum OrderState {
  OPEN = 'OPEN',
  FILLED = 'FILLED',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED',
}

export interface OrderWithState extends SignedOrder {
  state: OrderState;
  createdAt: number;
  updatedAt: number;
}

export interface QuoteResponse {
  order: OrderWithState;
  quoteExpiry: number;
}

// WebSocket message types
export interface WSMessage {
  type: 'orderBook' | 'quoteReceived' | 'orderFilled' | 'error';
  data?: any;
  message?: string;
}