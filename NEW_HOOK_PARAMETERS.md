# New Hook Parameters for Deployment - UPDATED

## ✅ Seed Algorithm Fixed - All Ed25519

All wallets now use Ed25519 algorithm for consistency and compatibility. The previous secp256k1 seeds were causing address mismatches.

## Hex Addresses for Hook Application

Use these hex addresses when applying for your new hook:

### Investor (Ed25519)
- **Address**: `rNY8AoJuZu1CjqBxLqALnceMX7gKEqEwwZ`
- **Hex**: `949CE1FEB184193BF516F2ACA5E5335BBAE9EDC9`
- **Seed**: `sEd7ZguPnUhwWXMzJJVTGfbMQ2Yjauc`
- **Status**: ✅ Funded (1000 XRP from Xahau Testnet)

### Shipowner (Ed25519)
- **Address**: `rDoSSCmbrNCmj4dYtUUmWAV8opaLmM8ZmG`
- **Hex**: `8C69E1CC7B5F498FB71D07200F87602DA2644B60`
- **Seed**: `sEd7YwJTAUCyrQiaNcGpVUhukrPZM38`
- **Status**: ✅ Funded (1000 XRP from Xahau Testnet)

### Platform (Ed25519 - Unchanged)
- **Address**: `rHC2GnCo9agZVhQMiGBF2dt4Ht5mpxzWnV`
- **Seed**: `sEdTk3FMu1ojhchiss2KXY8Uw71DMce`

### Charterer (Ed25519 - Unchanged)
- **Address**: `rBucHbYrQkKNdWGqaLcS4gKELhkzrMCKKN`
- **Seed**: `sEdTYETVj89Vt8415esLEvqhRyXw516`

### Investor Target
- **Value**: `000000001DCD6500` (500 XRP = 500,000,000 drops)

---

## What Was Fixed

### Problem
The previous Investor and Shipowner wallets used **secp256k1** algorithm (`ss...` and `she...` seeds), which generated different addresses than expected when using `Wallet.fromSeed()`.

**Old seeds (INCORRECT):**
- Investor: `ss9qxCbKDozRbbCD7YremLM6LD9mp` → Generated `rBanRz4UvBRP7uwcT3V99un6zmWMe9T44A` ❌
- Shipowner: `sheBHmpmqFJqB68HKDEKoLMmnLWat` → Generated `rmeA6qnzoYBK88pUL8eNJDJWsEeDDJYpw` ❌

### Solution
Generated new **Ed25519** wallets for both Investor and Shipowner. All 4 wallets now use the same algorithm for consistency.

**New seeds (CORRECT):**
- Investor: `sEd7ZguPnUhwWXMzJJVTGfbMQ2Yjauc` → Generates `rNY8AoJuZu1CjqBxLqALnceMX7gKEqEwwZ` ✅
- Shipowner: `sEd7YwJTAUCyrQiaNcGpVUhukrPZM38` → Generates `rDoSSCmbrNCmj4dYtUUmWAV8opaLmM8ZmG` ✅

---

## Updated Files

### Configuration Files
1. **[src/lib/waterfall/realWallets.ts](src/lib/waterfall/realWallets.ts:22-28)** - Updated with new Ed25519 seeds and addresses
2. **[src/app/dashboard/simulator/page.tsx](src/app/dashboard/simulator/page.tsx:42-43)** - Updated hardcoded secrets
3. **[scripts/verifyNewHook.ts](scripts/verifyNewHook.ts:12-15)** - Updated addresses and hex values
4. **[scripts/checkBalances.ts](scripts/checkBalances.ts:11-12)** - Updated addresses

---

## Verification

Run the balance check script to verify all wallets are funded:

```bash
npx tsx scripts/checkBalances.ts
```

Expected output:
```
✅ platform    (rHC2GnCo9agZVhQMiGBF2dt4Ht5mpxzWnV): [balance] XRP
✅ investor    (rNY8AoJuZu1CjqBxLqALnceMX7gKEqEwwZ): 1000.00 XRP
✅ shipowner   (rDoSSCmbrNCmj4dYtUUmWAV8opaLmM8ZmG): 1000.00 XRP
✅ charterer   (rBucHbYrQkKNdWGqaLcS4gKELhkzrMCKKN): [balance] XRP
```

---

## Next Steps

1. **Apply for new hook** using the hex addresses above:
   - Investor Hex: `949CE1FEB184193BF516F2ACA5E5335BBAE9EDC9`
   - Shipowner Hex: `8C69E1CC7B5F498FB71D07200F87602DA2644B60`

2. **Test the simulator** at `/dashboard/simulator`
   - Wallets are pre-filled with the new Ed25519 seeds
   - All addresses should now display correctly

3. **Update hook deployment** with new parameters once approved
