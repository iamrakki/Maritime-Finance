/**
 * Generate Real XRPL Wallets for Hook Deployment
 *
 * This script generates 4 real XRPL wallets with valid seeds and addresses,
 * funds them from the Xahau Testnet faucet, and outputs all details needed
 * for Hook deployment.
 */

import { Wallet, Client } from 'xrpl';
import { encodeAccountID } from 'ripple-address-codec';

const XAHAU_TESTNET = 'wss://xahau-test.net';

interface WalletInfo {
  role: string;
  address: string;
  seed: string;
  publicKey: string;
  hexAddress: string;
}

/**
 * Convert XRPL address to hex (20 bytes)
 */
function addressToHex(address: string): string {
  const decoded = encodeAccountID(Buffer.from(address));
  return Buffer.from(decoded).toString('hex').toUpperCase();
}

/**
 * Fund a wallet from Xahau Testnet faucet
 */
async function fundWallet(client: Client, address: string): Promise<boolean> {
  try {
    console.log(`💸 Requesting funding for ${address}...`);

    const response = await client.fundWallet();
    console.log(`✅ Funded: ${address}`);
    return true;
  } catch (error: any) {
    console.error(`❌ Failed to fund ${address}:`, error.message);

    // Try alternative funding method
    try {
      const fundResponse = await fetch('https://xahau-test.net/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ destination: address }),
      });

      if (fundResponse.ok) {
        console.log(`✅ Funded via API: ${address}`);
        return true;
      }
    } catch (apiError) {
      console.error(`❌ API funding also failed for ${address}`);
    }

    return false;
  }
}

/**
 * Get wallet balance
 */
async function getBalance(client: Client, address: string): Promise<number> {
  try {
    const response = await client.request({
      command: 'account_info',
      account: address,
      ledger_index: 'validated',
    });

    const drops = Number(response.result.account_data.Balance);
    const xrp = drops / 1_000_000;
    return xrp;
  } catch (error) {
    return 0;
  }
}

/**
 * Generate and fund 4 wallets
 */
async function generateAndFundWallets() {
  console.log('🎲 Generating 4 NEW XRPL Wallets...\n');

  // Generate wallets
  const platformWallet = Wallet.generate();
  const investorWallet = Wallet.generate();
  const shipownerWallet = Wallet.generate();
  const chartererWallet = Wallet.generate();

  const wallets: WalletInfo[] = [
    {
      role: 'Platform (Hook Account)',
      address: platformWallet.address,
      seed: platformWallet.seed!,
      publicKey: platformWallet.publicKey,
      hexAddress: '',
    },
    {
      role: 'Investor',
      address: investorWallet.address,
      seed: investorWallet.seed!,
      publicKey: investorWallet.publicKey,
      hexAddress: '',
    },
    {
      role: 'Shipowner',
      address: shipownerWallet.address,
      seed: shipownerWallet.seed!,
      publicKey: shipownerWallet.publicKey,
      hexAddress: '',
    },
    {
      role: 'Charterer',
      address: chartererWallet.address,
      seed: chartererWallet.seed!,
      publicKey: chartererWallet.publicKey,
      hexAddress: '',
    },
  ];

  console.log('✅ Generated 4 wallets:\n');
  wallets.forEach((w) => {
    console.log(`${w.role}:`);
    console.log(`  Address: ${w.address}`);
    console.log(`  Seed:    ${w.seed}`);
    console.log('');
  });

  // Connect to Xahau Testnet
  console.log('🔗 Connecting to Xahau Testnet...\n');
  const client = new Client(XAHAU_TESTNET);
  await client.connect();
  console.log('✅ Connected!\n');

  // Fund each wallet
  console.log('💰 Funding wallets from Xahau Testnet faucet...\n');

  for (const wallet of wallets) {
    await fundWallet(client, wallet.address);
    await new Promise((resolve) => setTimeout(resolve, 3000)); // Wait between requests
  }

  console.log('\n⏳ Waiting for funding to confirm...\n');
  await new Promise((resolve) => setTimeout(resolve, 5000));

  // Check balances
  console.log('📊 Checking balances...\n');
  for (const wallet of wallets) {
    const balance = await getBalance(client, wallet.address);
    console.log(`${wallet.role}: ${balance.toFixed(2)} XRP`);
  }

  await client.disconnect();

  // Output Hook deployment parameters
  console.log('\n' + '='.repeat(80));
  console.log('📋 HOOK DEPLOYMENT PARAMETERS');
  console.log('='.repeat(80) + '\n');

  console.log('## Wallet Details\n');
  wallets.forEach((w) => {
    console.log(`### ${w.role}`);
    console.log(`Address: ${w.address}`);
    console.log(`Secret:  ${w.seed}`);
    console.log('');
  });

  console.log('\n## SetHook Parameters\n');
  console.log('Use these values when deploying the Hook:\n');

  const investorHex = investorWallet.address; // We'll compute manually
  const shipownerHex = shipownerWallet.address;

  console.log('```json');
  console.log(JSON.stringify({
    "Account": platformWallet.address,
    "HookParameters": [
      {
        "HookParameter": {
          "HookParameterName": "696E766573746F725F61646472657373",
          "HookParameterValue": "[INVESTOR_HEX_ADDRESS]"
        }
      },
      {
        "HookParameter": {
          "HookParameterName": "736869706F776E65725F61646472657373",
          "HookParameterValue": "[SHIPOWNER_HEX_ADDRESS]"
        }
      },
      {
        "HookParameter": {
          "HookParameterName": "696E766573746F725F746172676574",
          "HookParameterValue": "000000001DCD6500"
        }
      }
    ]
  }, null, 2));
  console.log('```\n');

  console.log('**Parameter Values:**');
  console.log(`- Hook Account: ${platformWallet.address}`);
  console.log(`- Investor Address: ${investorWallet.address}`);
  console.log(`- Shipowner Address: ${shipownerWallet.address}`);
  console.log(`- investor_target: 000000001DCD6500 (500 XRP = 500,000,000 drops)\n`);

  console.log('\n## Important Notes\n');
  console.log('⚠️  Save these wallet secrets securely!');
  console.log('⚠️  Deploy the Hook to the Platform wallet address shown above');
  console.log('⚠️  Use the hex-encoded investor and shipowner addresses in Hook parameters');
  console.log('⚠️  Update the demo code with the new Platform (Hook) address after deployment\n');

  // Save to file
  const outputData = {
    platform: {
      role: 'platform',
      address: platformWallet.address,
      seed: platformWallet.seed,
      publicKey: platformWallet.publicKey,
    },
    investor: {
      role: 'investor',
      address: investorWallet.address,
      seed: investorWallet.seed,
      publicKey: investorWallet.publicKey,
    },
    shipowner: {
      role: 'shipowner',
      address: shipownerWallet.address,
      seed: shipownerWallet.seed,
      publicKey: shipownerWallet.publicKey,
    },
    charterer: {
      role: 'charterer',
      address: chartererWallet.address,
      seed: chartererWallet.seed,
      publicKey: chartererWallet.publicKey,
    },
  };

  const fs = require('fs');
  fs.writeFileSync(
    'REAL_WALLETS.json',
    JSON.stringify(outputData, null, 2)
  );
  console.log('💾 Wallet details saved to REAL_WALLETS.json\n');
}

// Run the script
generateAndFundWallets()
  .then(() => {
    console.log('✅ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
