/**
 * Generate and Fund ONLY Investor and Shipowner Wallets
 * Platform and Charterer already have funds
 */

import { Client } from 'xrpl';
import { decodeAccountID } from 'ripple-address-codec';

const XAHAU_TESTNET = 'wss://xahau-test.net';
const FAUCET_URL = 'https://hooks-testnet-v3.xrpl-labs.com/newcreds';

// Existing funded wallets
const EXISTING = {
  platform: {
    address: 'rHC2GnCo9agZVhQMiGBF2dt4Ht5mpxzWnV',
    seed: 'sEdTk3FMu1ojhchiss2KXY8Uw71DMce',
    balance: 999.61,
  },
  charterer: {
    address: 'rBucHbYrQkKNdWGqaLcS4gKELhkzrMCKKN',
    seed: 'sEdTYETVj89Vt8415esLEvqhRyXw516',
    balance: 1000.00,
  },
};

interface FaucetResponse {
  address: string;
  secret: string;
  xrp: number;
  hash: string;
  code: string;
}

async function fundMissingWallets() {
  console.log('💰 Generating and Funding NEW Investor and Shipowner Wallets...\n');
  console.log('✅ Using existing Platform and Charterer wallets\n');

  const newWallets: { [key: string]: FaucetResponse } = {};

  // Generate Investor wallet
  console.log('📤 Requesting Investor wallet from faucet...');
  try {
    const investorResponse = await fetch(FAUCET_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });

    const investorData: FaucetResponse = await investorResponse.json();

    if (investorData.code === 'tesSUCCESS') {
      newWallets['Investor'] = investorData;
      console.log(`✅ Investor Funded!`);
      console.log(`   Address: ${investorData.address}`);
      console.log(`   Secret:  ${investorData.secret}`);
      console.log(`   Balance: ${investorData.xrp} XRP`);
      console.log(`   TX Hash: ${investorData.hash}\n`);
    } else {
      console.error(`❌ Failed: ${investorData.code}\n`);
    }
  } catch (error: any) {
    console.error(`❌ Error: ${error.message}\n`);
  }

  // Wait between requests
  await new Promise((resolve) => setTimeout(resolve, 3000));

  // Generate Shipowner wallet
  console.log('📤 Requesting Shipowner wallet from faucet...');
  try {
    const shipownerResponse = await fetch(FAUCET_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });

    const shipownerData: FaucetResponse = await shipownerResponse.json();

    if (shipownerData.code === 'tesSUCCESS') {
      newWallets['Shipowner'] = shipownerData;
      console.log(`✅ Shipowner Funded!`);
      console.log(`   Address: ${shipownerData.address}`);
      console.log(`   Secret:  ${shipownerData.secret}`);
      console.log(`   Balance: ${shipownerData.xrp} XRP`);
      console.log(`   TX Hash: ${shipownerData.hash}\n`);
    } else {
      console.error(`❌ Failed: ${shipownerData.code}\n`);
    }
  } catch (error: any) {
    console.error(`❌ Error: ${error.message}\n`);
  }

  // Verify balances
  console.log('⏳ Waiting for confirmations...');
  await new Promise((resolve) => setTimeout(resolve, 5000));

  console.log('\n📊 Verifying all wallet balances...\n');

  const client = new Client(XAHAU_TESTNET);
  await client.connect();

  // Check existing wallets
  console.log('Existing Wallets:');
  for (const [role, wallet] of Object.entries(EXISTING)) {
    try {
      const response = await client.request({
        command: 'account_info',
        account: wallet.address,
        ledger_index: 'validated',
        api_version: 1,
      });

      const balance = Number(response.result.account_data.Balance) / 1_000_000;
      console.log(`  ✅ ${role.padEnd(10)}: ${balance.toFixed(2)} XRP (${wallet.address})`);
    } catch (error) {
      console.log(`  ⚠️  ${role.padEnd(10)}: Error checking balance`);
    }
  }

  // Check new wallets
  console.log('\nNew Wallets:');
  for (const [role, wallet] of Object.entries(newWallets)) {
    try {
      const response = await client.request({
        command: 'account_info',
        account: wallet.address,
        ledger_index: 'validated',
        api_version: 1,
      });

      const balance = Number(response.result.account_data.Balance) / 1_000_000;
      console.log(`  ✅ ${role.padEnd(10)}: ${balance.toFixed(2)} XRP (${wallet.address})`);
    } catch (error) {
      console.log(`  ⚠️  ${role.padEnd(10)}: Pending confirmation...`);
    }
  }

  await client.disconnect();

  // Create final wallet configuration
  const finalConfig = {
    platform: {
      role: 'platform',
      address: EXISTING.platform.address,
      seed: EXISTING.platform.seed,
    },
    investor: {
      role: 'investor',
      address: newWallets['Investor']?.address || '',
      seed: newWallets['Investor']?.secret || '',
    },
    shipowner: {
      role: 'shipowner',
      address: newWallets['Shipowner']?.address || '',
      seed: newWallets['Shipowner']?.secret || '',
    },
    charterer: {
      role: 'charterer',
      address: EXISTING.charterer.address,
      seed: EXISTING.charterer.seed,
    },
  };

  // Save to file
  const fs = require('fs');
  fs.writeFileSync('UPDATED_WALLETS.json', JSON.stringify(finalConfig, null, 2));
  console.log('\n💾 Complete wallet configuration saved to UPDATED_WALLETS.json');

  // Generate hex addresses for SetHook
  const investorHex = Buffer.from(decodeAccountID(finalConfig.investor.address)).toString('hex').toUpperCase();
  const shipownerHex = Buffer.from(decodeAccountID(finalConfig.shipowner.address)).toString('hex').toUpperCase();

  console.log('\n' + '='.repeat(80));
  console.log('📋 SETHOOK PARAMETERS (REDEPLOY WITH THESE)');
  console.log('='.repeat(80) + '\n');

  console.log(`Hook Account (Platform): ${finalConfig.platform.address}`);
  console.log(`Investor Address:        ${finalConfig.investor.address}`);
  console.log(`Investor Hex:            ${investorHex}`);
  console.log(`Shipowner Address:       ${finalConfig.shipowner.address}`);
  console.log(`Shipowner Hex:           ${shipownerHex}`);
  console.log(`Investor Target:         000000001DCD6500 (500 XRP)\n`);

  console.log('Complete SetHook JSON:\n');
  console.log(JSON.stringify({
    "TransactionType": "SetHook",
    "Account": finalConfig.platform.address,
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

  console.log('\n✅ Done! New wallets funded and ready!');
  console.log('\n📝 Next Steps:');
  console.log('   1. Redeploy your Hook using the SetHook parameters above');
  console.log('   2. Reply with the new Hook transaction hash');
  console.log('   3. I\'ll update the demo code with the new wallet addresses\n');
}

fundMissingWallets();
