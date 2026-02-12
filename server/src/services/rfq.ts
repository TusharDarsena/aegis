// RFQ (Request for Quote) service - in-memory implementation for MVP
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { OrderWithState, OrderState, QuoteResponse } from '../types/order.js';

const MOCK_MAKER_WALLET = "0x1111111111111111111111111111111111111111111111111111111111111111";

export class RFQService {
  private orders: Map<string, OrderWithState> = new Map();

  submitRfq(request: any): QuoteResponse {
    // 1. Define Schema - relaxed for various wallet formats
    const rfqSchema = z.object({
      requesterWallet: z.string().min(1).max(256), // Allow various address formats
      buyTokenId: z.string(),
      sellTokenId: z.string(),
      buyAmount: z.any().optional(),
      sellAmount: z.any().optional(),
    });

    // 2. Parse Safely
    const result = rfqSchema.safeParse(request);

    if (!result.success) {
      throw new Error(`Invalid RFQ data: ${JSON.stringify(result.error.format())}`);
    }

    const val = result.data;

    // 3. Mock Logic - Create realistic quote
    const expiry = Math.floor(Date.now() / 1000) + 60; // 60 seconds
    const orderId = uuidv4();
    const now = Date.now();

    // Convert amounts to BigInt (handle string or number input)
    const buyAmount = BigInt(val.buyAmount || 100);
    const sellAmount = BigInt(val.sellAmount || 100);

    // 4. Create Midnight-aligned Order Structure
    const order: OrderWithState = {
      orderHash: orderId,
      nonce: BigInt(now),
      expiry: expiry,
      
      signer: {
        wallet: MOCK_MAKER_WALLET,
        tokenId: val.buyTokenId,
        amount: buyAmount,
      },
      
      sender: {
        wallet: val.requesterWallet,
        tokenId: val.sellTokenId,
        amount: sellAmount,
      },

      proof: new Uint8Array(64).fill(1), // Mock proof
      state: OrderState.OPEN,
      createdAt: now,
      updatedAt: now,
    };

    this.orders.set(orderId, order);

    return {
      order,
      quoteExpiry: expiry
    };
  }

  getOrder(orderId: string): OrderWithState | undefined {
    return this.orders.get(orderId);
  }

  getUserOrders(wallet: string): OrderWithState[] {
    return Array.from(this.orders.values()).filter(o => 
      o.sender.wallet === wallet || o.signer.wallet === wallet
    );
  }

  markOrderFilled(orderId: string): OrderWithState | null {
    const order = this.orders.get(orderId);
    if (!order) return null;

    order.state = OrderState.FILLED;
    order.updatedAt = Date.now();
    this.orders.set(orderId, order);

    return order;
  }

  getAllOrders(): OrderWithState[] {
    return Array.from(this.orders.values());
  }
}