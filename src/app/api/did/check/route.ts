import { Client } from 'xrpl';

const TESTNET_ENDPOINT = 'wss://s.altnet.rippletest.net:51234';

export async function POST(request: Request) {
  const { address } = await request.json();

  if (!address) {
    return Response.json({ exists: false, error: 'Address not provided' }, { status: 400 });
  }

  const client = new Client(TESTNET_ENDPOINT);
  try {
    await client.connect();
    const response = await client.request({
      command: 'account_objects',
      account: address,
      type: 'did',
      ledger_index: 'validated',
    });

    const didObjects = response.result.account_objects;
    const didExists = didObjects && didObjects.length > 0;

    return Response.json({ exists: didExists });
  } catch (error) {
    console.error('DID check error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown XRPL error';
    // If account not found, it means no DID. This is not an error in our flow.
    if (errorMessage.includes('actNotFound')) {
        return Response.json({ exists: false, error: 'Account not found on ledger.' });
    }
    return Response.json({ exists: false, error: errorMessage }, { status: 500 });
  } finally {
    // Ensure the client is always disconnected
    if (client.isConnected()) {
      await client.disconnect();
    }
  }
}
