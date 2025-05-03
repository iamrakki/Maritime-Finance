/**
 * Convert XRPL addresses to hex format for Hook parameters
 */

import { decodeAccountID } from 'ripple-address-codec';

const wallets = {
  platform: 'rHC2GnCo9agZVhQMiGBF2dt4Ht5mpxzWnV',
  investor: 'rCJjEYgwfwWEmJUQdgERXqdhRdeDfJq9r',
  shipowner: 'rHferWyNi4ZzbTqmSBrZUsQPKmZVGGUJrZ',
  charterer: 'rBucHbYrQkKNdWGqaLcS4gKELhkzrMCKKN',
};

console.log('📋 HEX-ENCODED ADDRESSES FOR HOOK PARAMETERS\n');
console.log('='.repeat(80) + '\n');

Object.entries(wallets).forEach(([role, address]) => {
  const decoded = decodeAccountID(address);
  const hex = Buffer.from(decoded).toString('hex').toUpperCase();

  console.log(`${role.toUpperCase()}:`);
  console.log(`  Address: ${address}`);
  console.log(`  Hex:     ${hex}`);
  console.log('');
});

console.log('\n' + '='.repeat(80));
console.log('📋 COMPLETE SETHOOK PARAMETERS');
console.log('='.repeat(80) + '\n');

const investorHex = Buffer.from(decodeAccountID(wallets.investor)).toString('hex').toUpperCase();
const shipownerHex = Buffer.from(decodeAccountID(wallets.shipowner)).toString('hex').toUpperCase();

console.log('Use these EXACT values in your SetHook transaction:\n');
console.log(JSON.stringify({
  "TransactionType": "SetHook",
  "Account": wallets.platform,
  "Hooks": [
    {
      "Hook": {
        "CreateCode": "<YOUR_COMPILED_WASM_HEX>",
        "HookOn": "0000000000000000",
        "HookNamespace": "0000000000000000000000000000000000000000000000000000000000000000",
        "HookParameters": [
          {
            "HookParameter": {
              "HookParameterName": "696E766573746F725F61646472657373",
              "HookParameterValue": investorHex
            }
          },
          {
            "HookParameter": {
              "HookParameterName": "736869706F776E65725F61646472657373",
              "HookParameterValue": shipownerHex
            }
          },
          {
            "HookParameter": {
              "HookParameterName": "696E766573746F725F746172676574",
              "HookParameterValue": "000000001DCD6500"
            }
          }
        ]
      }
    }
  ]
}, null, 2));

console.log('\n\n📝 QUICK REFERENCE:\n');
console.log(`Platform (Hook Account):  ${wallets.platform}`);
console.log(`Investor Address:         ${wallets.investor}`);
console.log(`Investor Hex:             ${investorHex}`);
console.log(`Shipowner Address:        ${wallets.shipowner}`);
console.log(`Shipowner Hex:            ${shipownerHex}`);
console.log(`Investor Target:          000000001DCD6500 (500 XRP)`);
console.log('');
