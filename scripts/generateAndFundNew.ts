/**
 * Generate NEW Wallets and Fund from Faucet
 */

import { Client, Wallet } from 'xrpl';

const XAHAU_TESTNET = 'wss://xahau-test.net';
const FAUCET_URL = 'https://hooks-testnet-v3.xrpl-labs.com/newcreds';

interface FaucetResponse {
  address: string;
  secret: string;
  xrp: number;
  hash: string;
  code: string;
}

async function generateAndFund() {
  console.log('🎲 Generating and Funding 4 NEW Wallets from Xahau Testnet Faucet...\n');

  const roles = ['Platform (Hook)', 'Investor', 'Shipowner', 'Charterer'];
  const wallets: { [key: string]: FaucetResponse } = {};

  // Generate 4 wallets from faucet
  for (const role of roles) {
    console.log(`💰 Requesting wallet for ${role}...`);

    try {
      const response = await fetch(FAUCET_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}), // Empty body = generate new wallet
      });

      const data: FaucetResponse = await response.json();

      if (data.code === 'tesSUCCESS') {
        wallets[role] = data;
        console.log(`✅ ${role}: ${data.address}`);
        console.log(`   Secret: ${data.secret}`);
        console.log(`   Balance: ${data.xrp} XRP`);
        console.log(`   Funding TX: ${data.hash}\n`);
      } else {
        console.error(`❌ Failed to fund ${role}: ${data.code}\n`);
      }

      // Wait between requests to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 2000));
    } catch (error: any) {
      console.error(`❌ Error requesting ${role}: ${error.message}\n`);
    }
  }

  // Verify balances
  console.log('\n⏳ Waiting for transactions to confirm...');
  await new Promise((resolve) => setTimeout(resolve, 5000));

  console.log('\n📊 Verifying balances...\n');

  const client = new Client(XAHAU_TESTNET);
  await client.connect();

  for (const [role, wallet] of Object.entries(wallets)) {
    try {
      const response = await client.request({
        command: 'account_info',
        account: wallet.address,
        ledger_index: 'validated',
        api_version: 1,
      });

      const balance = Number(response.result.account_data.Balance) / 1_000_000;
      console.log(`✅ ${role.padEnd(20)}: ${balance.toFixed(2)} XRP`);
    } catch (error: any) {
      console.log(`⚠️  ${role.padEnd(20)}: Pending...`);
    }
  }

  await client.disconnect();

  // Save to file
  const fs = require('fs');

  const output = {
    platform: {
      role: 'platform',
      address: wallets['Platform (Hook)']?.address || '',
      seed: wallets['Platform (Hook)']?.secret || '',
    },
    investor: {
      role: 'investor',
      address: wallets['Investor']?.address || '',
      seed: wallets['Investor']?.secret || '',
    },
    shipowner: {
      role: 'shipowner',
      address: wallets['Shipowner']?.address || '',
      seed: wallets['Shipowner']?.secret || '',
    },
    charterer: {
      role: 'charterer',
      address: wallets['Charterer']?.address || '',
      seed: wallets['Charterer']?.secret || '',
    },
  };

  fs.writeFileSync('FUNDED_WALLETS.json', JSON.stringify(output, null, 2));
  console.log('\n💾 Wallet details saved to FUNDED_WALLETS.json');

  // Generate hex addresses
  const { decodeAccountID } = await import('ripple-address-codec');

  const investorHex = Buffer.from(decodeAccountID(output.investor.address)).toString('hex').toUpperCase();
  const shipownerHex = Buffer.from(decodeAccountID(output.shipowner.address)).toString('hex').toUpperCase();

  console.log('\n' + '='.repeat(80));
  console.log('📋 SETHOOK PARAMETERS FOR REDEPLOYMENT');
  console.log('='.repeat(80) + '\n');

  console.log('Hook Account:', output.platform.address);
  console.log('Investor Hex:', investorHex);
  console.log('Shipowner Hex:', shipownerHex);
  console.log('Investor Target: 000000001DCD6500 (500 XRP)\n');

  console.log('Complete SetHook JSON:\n');
  console.log(JSON.stringify({
    "TransactionType": "SetHook",
    "Account": output.platform.address,
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

  console.log('\n✅ All wallets generated and funded!');
  console.log('📝 Next steps:');
  console.log('   1. Use the Hook Account and parameters above to redeploy your Hook');
  console.log('   2. Share the new Hook address after deployment');
  console.log('   3. I\'ll update the demo code with these new wallets\n');
}

generateAndFund();
