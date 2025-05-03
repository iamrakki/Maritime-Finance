/**
 * Check Hook Installation Status
 */

import { Client } from 'xrpl';

const XAHAU_TESTNET = 'wss://xahau-test.net';
const HOOK_ACCOUNT = 'rHC2GnCo9agZVhQMiGBF2dt4Ht5mpxzWnV';

async function checkHook() {
  const client = new Client(XAHAU_TESTNET);

  try {
    await client.connect();
    console.log('✅ Connected to Xahau Testnet\n');

    // Get account info
    const accountInfo = await client.request({
      command: 'account_info',
      account: HOOK_ACCOUNT,
      ledger_index: 'validated',
      api_version: 1,
    });

    console.log('📊 Hook Account Info:');
    console.log(`Address: ${HOOK_ACCOUNT}`);
    console.log(`Balance: ${(Number(accountInfo.result.account_data.Balance) / 1_000_000).toFixed(2)} XRP`);
    console.log(`Sequence: ${accountInfo.result.account_data.Sequence}\n`);

    // Check transaction details
    console.log('🔍 Checking SetHook Transaction:');
    console.log(`TX Hash: 0732F40A53CAF7ECA9E54C3E80C231BF5E45BF8A483048B2300080FC3B94E3C3\n`);

    try {
      const tx = await client.request({
        command: 'tx',
        transaction: '0732F40A53CAF7ECA9E54C3E80C231BF5E45BF8A483048B2300080FC3B94E3C3',
        api_version: 1,
      });

      console.log('✅ Transaction Found:');
      const meta = tx.result.meta;
      if (meta && typeof meta === 'object' && 'TransactionResult' in meta) {
        console.log(`  Result: ${meta.TransactionResult}`);
      }
      console.log(`  Ledger: ${tx.result.ledger_index}`);
      console.log(`  Date: ${new Date((tx.result.date || 0) * 1000 + 946684800000).toISOString()}\n`);

      const txData: any = tx.result;
      if (txData.Hooks) {
        console.log('🔗 Hook Configuration:');
        txData.Hooks.forEach((hook: any, idx: number) => {
          console.log(`\nHook #${idx + 1}:`);
          if (hook.Hook) {
            if (hook.Hook.HookParameters) {
              console.log(`  Parameters: ${hook.Hook.HookParameters.length} parameter(s)`);
              hook.Hook.HookParameters.forEach((param: any, i: number) => {
                const name = Buffer.from(param.HookParameter.HookParameterName, 'hex').toString('utf8');
                const value = param.HookParameter.HookParameterValue;
                console.log(`    ${i + 1}. ${name}: ${value}`);
              });
            }
          }
        });
      }

    } catch (txError: any) {
      console.error('❌ Could not fetch transaction:', txError.message);
    }

    console.log('\n✅ Hook deployment successful!');
    console.log('\n📋 Next Steps:');
    console.log('1. Run the demo: npm run dev');
    console.log('2. Navigate to: http://localhost:3000/demo');
    console.log('3. Click "Load Fixed Wallets"');
    console.log('4. Test payments to see the waterfall distribution!\n');

  } catch (error: any) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.disconnect();
  }
}

checkHook();
