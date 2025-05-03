/**
 * XRPL Waterfall Finance Hook
 *
 * Automatically distributes incoming payments with investor priority:
 * 1. Pay investor first (until principal + interest recovered)
 * 2. Pay shipowner with remainder (after investor fully paid)
 *
 * Hook Parameters:
 * - investor_address: r-address of investor (20 bytes)
 * - shipowner_address: r-address of shipowner (20 bytes)
 * - investor_target: Total recovery target in drops (8 bytes, uint64)
 *
 * Hook State:
 * - investor_recovered: Amount paid to investor so far (8 bytes, uint64)
 */

#include <stdint.h>
#include "hookapi.h"

// Helper: Get payment amount from transaction
int64_t get_payment_amount() {
    uint8_t amount_buffer[48];
    // Cast buffer pointer to uint32_t for Hook API
    int64_t amount_len = otxn_field((uint32_t)amount_buffer, 48, sfAmount);
    if (amount_len != 8) return -1;
    return AMOUNT_TO_DROPS(amount_buffer);
}

// Helper: Read uint64 from hook state
int64_t state_read_uint64(uint8_t* key, uint32_t key_len) {
    uint8_t buf[8];
    int64_t len = state((uint32_t)buf, 8, (uint32_t)key, key_len);
    return (len == 8) ? UINT64_FROM_BUF(buf) : 0;
}

// Helper: Write uint64 to hook state
int32_t state_write_uint64(uint8_t* key, uint32_t key_len, uint64_t value) {
    uint8_t buf[8];
    UINT64_TO_BUF(buf, value);
    return state_set((uint32_t)buf, 8, (uint32_t)key, key_len);
}

// Helper: Send XRP payment
int32_t send_payment(uint8_t* dest_addr, int64_t amount_drops) {
    if (amount_drops <= 0) return 0;

    uint8_t tx_buf[283];
    uint8_t *tx_ptr = tx_buf;

    // TransactionType (XRP Payment)
    *tx_ptr++ = 0x12; *tx_ptr++ = 0x00; *tx_ptr++ = 0x00; *tx_ptr++ = 0x00;

    uint8_t hook_acc[20];
    hook_account((uint32_t)hook_acc, 20);

    // Account
    *tx_ptr++ = 0x81; *tx_ptr++ = 0x14;
    for (int i = 0; i < 20; i++) {
        _g(1, 20);
        *tx_ptr++ = hook_acc[i];
    }

    // Destination
    *tx_ptr++ = 0x83; *tx_ptr++ = 0x14;
    for (int i = 0; i < 20; i++) {
        _g(2, 20);
        *tx_ptr++ = dest_addr[i];
    }

    // Amount
    *tx_ptr++ = 0x61; *tx_ptr++ = 0x00;
    UINT64_TO_BUF(tx_ptr, amount_drops);
    tx_ptr += 8;

    uint8_t emithash[32];
    return emit((uint32_t)emithash, 32, (uint32_t)tx_buf, (uint32_t)(tx_ptr - tx_buf));
}

int64_t hook(uint32_t reserved) {
    // Check if it's a payment
    if (otxn_type() != ttPAYMENT)
        accept(SBUF("Waterfall: Ignoring non-payment"), 0);

    int64_t amount_drops = get_payment_amount();
    if (amount_drops <= 0)
        rollback(SBUF("Waterfall: Invalid amount"), 1);

    uint8_t inv_addr[20], ship_addr[20], target_buf[8];

    // Read Params with proper casts and SBUF for parameter names
    if (hook_param((uint32_t)inv_addr, 20, SBUF("investor_address")) != 20)
        rollback(SBUF("Waterfall: Missing investor"), 2);

    if (hook_param((uint32_t)ship_addr, 20, SBUF("shipowner_address")) != 20)
        rollback(SBUF("Waterfall: Missing shipowner"), 3);

    if (hook_param((uint32_t)target_buf, 8, SBUF("investor_target")) == 8) {
        uint64_t investor_target = UINT64_FROM_BUF(target_buf);
        uint8_t state_key[] = "investor_recovered";
        uint64_t investor_recovered = state_read_uint64(state_key, 18);

        uint64_t to_investor = 0;
        uint64_t to_shipowner = 0;

        if (investor_recovered < investor_target) {
            uint64_t remaining = investor_target - investor_recovered;
            if ((uint64_t)amount_drops >= remaining) {
                to_investor = remaining;
                to_shipowner = amount_drops - remaining;
            } else {
                to_investor = amount_drops;
            }
        } else {
            to_shipowner = amount_drops;
        }

        // Update state
        state_write_uint64(state_key, 18, investor_recovered + to_investor);

        // Execute payments
        if (to_investor > 0) send_payment(inv_addr, (int64_t)to_investor);
        if (to_shipowner > 0) send_payment(ship_addr, (int64_t)to_shipowner);

        accept(SBUF("Waterfall: Success"), 0);
    } else {
        rollback(SBUF("Waterfall: Missing target"), 4);
    }

    return 0;
}
