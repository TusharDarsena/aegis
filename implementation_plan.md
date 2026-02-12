Aegis is a "Private VIP Trading Room" for big crypto deals, replacing the noisy public stock market. 


# Aegis: Transform Lottery → Private OTC Trading Platform

## Proposed Changes
> **Use the resource contract `AegisSwap.compact` directly.** 


### Server Layer (Agies Whisper Room)

> [!NOTE]
> This is a new layer required by the `useRfq` hook to manage off-chain negotiation.

#### [NEW] [server/server.ts]
Copy `resource/server.ts` to `server/server.ts`.

#### [NEW] [server/services/rfq.ts]
Implement the RFQ matching logic (in-memory order book):
- `submitRfq`: Create quote request
- `submitQuote`: Market maker response
- `getOrder` / `getUserOrders`
- `markOrderFilled`

#### [NEW] [server/types/order.ts](file:///c:/Users/TUSHAR/Desktop/aegis/server/types/order.ts)
Define `Quote`, `Order`, `RFQRequest` interfaces matching `useRfq.ts`.

---

Tests will cover:
1. Initialization — all ledger fields start at zero
2. `create_deal` — sets price/amount/status correctly
3. `accept_deal` — validates price match, transitions status
4. `accept_deal` with wrong price — should throw
5. `settle_deal` — validates both parties committed
6. `cancel_deal` — only works on open deals
7. Full lifecycle: create → accept → settle
8. Edge case: can't create deal when one is active

### Manual Verification

> [!TIP]
> Since this is a Midnight project that requires a local node + proof server + indexer to run e2e, suggest the user verify after we've confirmed the contract tests pass.

1. **Contract compiles**: Run `npm run compact` in contract directory — should produce `src/managed/aegis/` with compiled artifacts
2. **TypeScript builds**: Run `npm run build` in contract directory — should produce `dist/` without errors
3. **User testing**: Deploy to local standalone network and test the CLI interactive flow
