/**
 * Test CredentialCreate Transaction
 * Tests the full flow without the UI - matches exactly what the API does
 */

const { Client, Wallet } = require('xrpl');
require('dotenv').config({ path: '.env.local' });

// Hex encoding utility - must be UPPERCASE
function toHex(str) {
  return Buffer.from(str, 'utf8').toString('hex').toUpperCase();
}

async function testCredentialCreate() {
  const client = new Client('wss://s.altnet.rippletest.net:51233', {
    connectionTimeout: 15000,
  });

  try {
    console.log('🔗 Connecting to XRPL Testnet...');
    await client.connect();
    console.log('✅ Connected!\n');

    // Load issuer wallet
    const seed = process.env.ISSUER_SEED;
    if (!seed) {
      throw new Error('ISSUER_SEED not found in .env.local');
    }

    const issuerWallet = Wallet.fromSeed(seed);
    console.log('📋 Issuer Address:', issuerWallet.address);

    // Use a test user address (you can change this to a real Crossmark address)
    const testUserAddress = 'rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh'; // Genesis account as placeholder

    console.log('👤 Subject Address:', testUserAddress);
    console.log('');

    // Build CredentialCreate transaction - EXACTLY like the API does
    const credentialType = toHex('KYC');
    const ipfsCid = 'QmTestCid123';
    const ipfsUri = `ipfs://${ipfsCid}`;
    const uriHex = toHex(ipfsUri);

    const companyData = {
      companyName: 'Test Company',
      registrationNumber: '12345',
      country: 'SG',
      email: 'test@test.com',
      verifiedAt: new Date().toISOString(),
      credentialType: 'KYC',
    };
    const dataHex = toHex(JSON.stringify(companyData));

    console.log('🔐 Credential Type: KYC');
    console.log('🔐 Credential Type (hex):', credentialType);
    console.log('📁 URI:', ipfsUri);
    console.log('📁 URI (hex):', uriHex);
    console.log('📄 Data:', JSON.stringify(companyData));
    console.log('📄 Data (hex):', dataHex.substring(0, 50) + '...');
    console.log('');

    const transaction = {
      TransactionType: 'CredentialCreate',
      Account: issuerWallet.address,
      Subject: testUserAddress,
      CredentialType: credentialType,
      URI: uriHex,
      // Note: Data field might not be supported - trying without it first
    };

    console.log('📝 Transaction:', JSON.stringify(transaction, null, 2));
    console.log('');

    // Autofill the transaction
    console.log('⏳ Autofilling transaction...');
    const prepared = await client.autofill(transaction);
    console.log('✅ Autofilled:', {
      Fee: prepared.Fee,
      Sequence: prepared.Sequence,
      LastLedgerSequence: prepared.LastLedgerSequence,
    });
    console.log('');

    // Sign the transaction
    console.log('✍️  Signing transaction...');
    const signed = issuerWallet.sign(prepared);
    console.log('✅ Signed! Hash:', signed.hash);
    console.log('');

    // Submit the transaction
    console.log('📤 Submitting to XRPL...');
    const result = await client.submit(signed.tx_blob);

    console.log('');
    console.log('📊 Submit Result:');
    console.log('   Engine Result:', result.result.engine_result);
    console.log('   Engine Result Message:', result.result.engine_result_message || 'N/A');
    console.log('');

    if (result.result.engine_result === 'tesSUCCESS') {
      console.log('🎉 SUCCESS! Transaction submitted.');
      console.log('');
      console.log('🔗 View on Explorer:');
      console.log(`   https://testnet.xrpl.org/transactions/${signed.hash}`);
    } else {
      console.log('❌ Transaction failed:', result.result.engine_result);
      console.log('Full result:', JSON.stringify(result.result, null, 2));
    }

    await client.disconnect();
    console.log('\n✅ Test complete!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);

    if (client.isConnected()) {
      await client.disconnect();
    }
    process.exit(1);
  }
}

testCredentialCreate();
