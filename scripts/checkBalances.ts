/**
 * Check Real Wallet Balances on Xahau Testnet
 */

import { Client } from 'xrpl';

const XAHAU_TESTNET = 'wss://xahau-test.net';

const wallets = {
  platform: 'rHC2GnCo9agZVhQMiGBF2dt4Ht5mpxzWnV',
  investor: 'rNY8AoJuZu1CjqBxLqALnceMX7gKEqEwwZ',
  shipowner: 'rDoSSCmbrNCmj4dYtUUmWAV8opaLmM8ZmG',
  charterer: 'rBucHbYrQkKNdWGqaLcS4gKELhkzrMCKKN',
};

async function checkBalances() {
  const client = new Client(XAHAU_TESTNET);

  try {
    await client.connect();
    console.log('✅ Connected to Xahau Testnet\n');

    console.log('📊 Checking wallet balances...\n');

    for (const [role, address] of Object.entries(wallets)) {
      try {
        const response = await client.request({
          command: 'account_info',
          account: address,
          ledger_index: 'validated',
          api_version: 1,
        });

        const balance = Number(response.result.account_data.Balance) / 1_000_000;
        console.log(`✅ ${role.padEnd(10)} (${address}): ${balance.toFixed(2)} XRP`);
      } catch (error: any) {
        if (error?.data?.error === 'actNotFound') {
          console.log(`❌ ${role.padEnd(10)} (${address}): NOT FUNDED (account doesn't exist)`);
        } else {
          console.log(`❌ ${role.padEnd(10)} (${address}): Error - ${error.message}`);
        }
      }
    }

    console.log('\n' + '='.repeat(80));
    console.log('📋 FUNDING INSTRUCTIONS');
    console.log('='.repeat(80) + '\n');

    console.log('If wallets show "NOT FUNDED", you need to fund them manually.\n');
    console.log('Option 1: Use Xahau Testnet Faucet (Web)');
    console.log('Visit: https://xahau-test.net\n');

    console.log('Option 2: Use Hooks Testnet Faucet');
    console.log('Visit: https://hooks-testnet-v3.xrpl-labs.com\n');

    console.log('Option 3: Manual API Request');
    Object.entries(wallets).forEach(([role, address]) => {
      console.log(`\ncurl -X POST https://hooks-testnet-v3.xrpl-labs.com/newcreds \\`);
      console.log(`  -H "Content-Type: application/json" \\`);
      console.log(`  -d '{"destination": "${address}"}'`);
    });

  } catch (error: any) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.disconnect();
  }
}

checkBalances();
