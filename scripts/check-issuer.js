/**
 * Check Issuer Wallet Status
 * Verifies the issuer wallet is funded and ready to issue credentials
 */

const { Client, Wallet } = require('xrpl');
require('dotenv').config({ path: '.env.local' });

async function checkIssuer() {
  const client = new Client('wss://s.altnet.rippletest.net:51233');

  try {
    console.log('🔗 Connecting to XRPL Testnet...');
    await client.connect();
    console.log('✅ Connected!\n');

    const seed = process.env.ISSUER_SEED;
    if (!seed) {
      console.error('❌ ISSUER_SEED not found in .env.local');
      process.exit(1);
    }

    const wallet = Wallet.fromSeed(seed);
    console.log('📋 Issuer Wallet Details:');
    console.log(`   Address: ${wallet.address}`);
    console.log(`   Seed: ${seed.substring(0, 8)}...`);
    console.log('');

    // Check account info
    console.log('🔍 Checking account on ledger...');
    try {
      const response = await client.request({
        command: 'account_info',
        account: wallet.address,
        ledger_index: 'validated'
      });

      console.log('✅ Account found on ledger!\n');
      console.log('💰 Account Balance:');
      console.log(`   XRP: ${Number(response.result.account_data.Balance) / 1000000} XRP`);
      console.log(`   Sequence: ${response.result.account_data.Sequence}`);
      console.log('');

      if (Number(response.result.account_data.Balance) < 20000000) {
        console.log('⚠️  Warning: Balance is low. You may need more XRP for transactions.');
        console.log('   Fund at: https://faucet.altnet.rippletest.net/accounts');
      } else {
        console.log('✅ Account has sufficient balance!');
      }

    } catch (error) {
      if (error.data && error.data.error === 'actNotFound') {
        console.log('❌ Account NOT found on ledger!');
        console.log('');
        console.log('🔧 To fix:');
        console.log(`   1. Visit: https://faucet.altnet.rippletest.net/accounts`);
        console.log(`   2. Enter address: ${wallet.address}`);
        console.log(`   3. Click "Generate Testnet Credentials"`);
        console.log('');
      } else {
        throw error;
      }
    }

    await client.disconnect();
    console.log('\n✅ Check complete!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (client.isConnected()) {
      await client.disconnect();
    }
    process.exit(1);
  }
}

checkIssuer();
