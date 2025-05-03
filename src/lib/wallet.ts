/**
 * Crossmark Wallet Integration Utilities
 * Handles wallet connection and address retrieval
 */

export interface CrossmarkSession {
  address: string;
  isConnected: boolean;
}

export interface WalletConnectResult {
  success: boolean;
  address?: string;
  error?: string;
}

/**
 * Connect to Crossmark wallet and retrieve wallet address
 * @returns WalletConnectResult with wallet address or error
 */
export async function connectCrossmarkWallet(): Promise<WalletConnectResult> {
  try {
    // Check if window is available (browser environment)
    if (typeof window === 'undefined') {
      return {
        success: false,
        error: 'Wallet connection is only available in browser environment.',
      };
    }

    // Check if Crossmark extension is available globally
    if (!(window as any).crossmark) {
      return {
        success: false,
        error: 'Crossmark wallet is not installed. Please install the Crossmark browser extension from https://crossmark.io',
      };
    }

    // Dynamically import Crossmark SDK
    const { default: sdk } = await import('@crossmarkio/sdk');

    // Check if Crossmark is available and connect
    const connected = await sdk.async.connect();

    if (!connected) {
      return {
        success: false,
        error: 'Crossmark wallet is not available. Please ensure the extension is enabled.',
      };
    }

    // Sign in to get wallet access and wait for user confirmation
    const signInResult = await sdk.async.signInAndWait();

    if (!signInResult) {
      return {
        success: false,
        error: 'Wallet sign-in was cancelled. Please try again.',
      };
    }

    // Get address from session after sign in
    const address = sdk.session?.address;

    if (!address) {
      return {
        success: false,
        error: 'Failed to retrieve wallet address from Crossmark. Please try again.',
      };
    }

    console.log('Successfully connected to Crossmark wallet:', address);

    return {
      success: true,
      address,
    };
  } catch (error) {
    console.error('Wallet connection error:', error);

    // Provide specific error messages based on error type
    let errorMessage = 'Failed to connect wallet';

    if (error instanceof Error) {
      console.error('Error details:', error.message);

      if (error.message.includes('Crossmark') || error.message.includes('crossmark')) {
        errorMessage = 'Crossmark wallet extension error. Please check if it\'s installed and enabled.';
      } else if (error.message.includes('not installed')) {
        errorMessage = 'Crossmark wallet is not installed. Please install the browser extension.';
      } else if (error.message.includes('rejected') || error.message.includes('denied')) {
        errorMessage = 'Wallet connection was rejected. Please try again.';
      } else if (error.message.includes('timeout')) {
        errorMessage = 'Wallet connection timed out. Please try again.';
      } else {
        errorMessage = error.message;
      }
    }

    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Get the current wallet session from Crossmark
 * @returns CrossmarkSession if available, null otherwise
 */
export async function getCrossmarkSession(): Promise<CrossmarkSession | null> {
  try {
    const { default: sdk } = await import('@crossmarkio/sdk');

    if (sdk.session?.address) {
      return {
        address: sdk.session.address,
        isConnected: true,
      };
    }

    return null;
  } catch (error) {
    console.error('Error retrieving Crossmark session:', error);
    return null;
  }
}

/**
 * Disconnect from Crossmark wallet
 */
export async function disconnectCrossmarkWallet(): Promise<void> {
  try {
    const { default: sdk } = await import('@crossmarkio/sdk');
    // Crossmark SDK doesn't have explicit disconnect, but you can clear session
    // by navigating away or closing the connection through the SDK's methods
    if (sdk.session) {
      // Clear the current session by calling connect without auto-signing in
      await sdk.async.connect();
    }
  } catch (error) {
    console.error('Error disconnecting wallet:', error);
  }
}
