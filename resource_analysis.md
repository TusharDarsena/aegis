# Aegis Resource Directory — Analysis & Recommendations


## 🟢 Strengths

### Contract (`AegisSwap.compact`)

1. **Advanced Compact features used correctly**
   - `Counter` type for `swapCount` and `round` — cleaner than manual `Uint<64>` arithmetic
   - `Map<Bytes<32>, Boolean>` for `filledOrders` — enables multi-order tracking (our initial plan was limited to single-deal)
   - `persistentHash` with domain separator (`"aegis:swap:order"`) — proper cryptographic order identification
   - `disclose()` used correctly on public values while keeping identities private

2. **Real witness functions** — `secretKey()`, `getSignerProof()`, `getSenderProof()`, `getKycProof()`, `getOrderData()` demonstrate proper Midnight privacy architecture where private data stays on the user's machine

3. **Replay attack protection** — nonce-based `filledOrders` Map prevents double-execution of orders

4. **Separation of concerns** — Internal circuits (`verifyProof`, `hashOrder`) vs exported circuits (`swap`, `cancel`, `incrementRound`)


## 🔴 Weaknesses & Gaps

### Contract Issues

1. **`verifyProof` is a stub** — accepts any non-zero `Bytes<64>` as valid. This is fine for MVP but means the ZK proofs provide **no actual security** yet
   ```compact
   // MVP: Accept any non-zero proof
   const zeroBytes: Bytes<64> = pad(64, "");
   return proof != zeroBytes;
   ```

2. **No actual token transfer** — the `swap` circuit increments a counter and marks an order as filled, but **doesn't move any assets**. Midnight's Compact can interact with the tNight/tDUST token system, but this contract doesn't use `amount` transfers

3. **`cancel` doesn't verify ownership properly** — it reads `secretKey()` from witness but never uses it to verify the caller is the order creator. The `computedHash == orderHash` check only proves the caller knows the order data, not that they created it

4. **No order expiry mechanism** — unlike the frontend's `QuoteTimer`, the contract has no on-chain expiry. Orders can only be cancelled or filled, never auto-expired

5. **`round.increment` has no access control** — anyone can call `incrementRound()`, which is meant for anonymity rotation but could be griefed



## 🎯 Recommendation: How To Proceed

> [!IMPORTANT]
> **Use the resource `AegisSwap.compact` as the contract** — it's vastly better than my initial simplified plan. Then **adapt the resource React components** to work with the existing Midnight SDK infrastructure.

### Phase 1 — Contract (Use resource contract directly)

```
AegisSwap.compact → contract/src/aegis.compact
```

- Copy `AegisSwap.compact` as-is (it's already Compact 0.20 compatible)
- Write proper `witnesses.ts` that implements the witness functions (`secretKey`, `getSignerProof`, etc.)
- The resource contract uses `Counter` and `Map` which are standard Compact types — should compile with `compact compile`


### Phase 3 — Integrate Resource Components Into Frontend

1. Copy resource `.tsx` files into `aegis-frontend/src/components/`
2. Update imports to use the created infrastructure from Phase 2
3. Replace `App.tsx` to compose: `SwapWidget` + `ActiveOrdersPanel` + `ToastProvider`
4. Wire `useRfq` hook to call the Aegis Midnight contract via the existing `midnight.ts` service layer

### Phase 4 — CLI (Lighter Lift)

Update the CLI to match the new contract circuits (`swap`, `cancel`, `incrementRound`) — this is straightforward since the CLI just calls `callTx.*` methods.



## ⚠️ Key Decision Points for You

2. **The RFQ flow in `SwapWidget` assumes an off-chain quote server** (the `useRfq` hook calls `requestQuote`, `executeSwap`, `cancelOrder`). Do you want:
   - **(A)** A **mock RFQ server** that simulates quote matching (more realistic but more code)
   - **(B)** Direct on-chain interaction only — skip the quote server and let users call `swap()` directly after agreeing off-platform

