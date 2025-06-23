import { http, createConfig, WagmiConfig } from 'wagmi';
import { celoAlfajores } from 'wagmi/chains';
import { createPublicClient, createWalletClient, custom } from 'viem';
import { injected } from 'wagmi/connectors';

// Define the Celo Alfajores testnet chain
const alfajoresChain = celoAlfajores;

// Our contract address - deployed on Celo Alfajores testnet
export const CONTRACT_ADDRESS = "0xC597FCf9C877943775bE9bb7EEf83DbBEd88A650";

// Configuration for wagmi
export const config = createConfig({
  chains: [alfajoresChain],
  connectors: [
    injected({
      // Disable shimDisconnect to prevent external API calls that violate Farcaster CSP
      shimDisconnect: false,
      // Target specific providers for better Farcaster compatibility
      target() {
        return {
          id: 'farcaster-injected',
          name: 'Farcaster Wallet',
          provider: typeof window !== 'undefined' ? window.ethereum : undefined,
        };
      },
    }),
  ],
  transports: {
    [alfajoresChain.id]: http(),
  },
  // Disable batch calls and other features that might trigger external requests
  batch: {
    multicall: false,
  },
  // Set a minimal cache time to reduce background requests
  cacheTime: 0,
  // Add SSR support for better compatibility
  ssr: true,
});

// Create clients that can be used outside of React components
export const createClients = () => {
  if (typeof window === 'undefined') {
    return { publicClient: undefined, walletClient: undefined };
  }

  const publicClient = createPublicClient({
    chain: alfajoresChain,
    transport: window.ethereum ? custom(window.ethereum) : http(),
  });

  const walletClient = createWalletClient({
    chain: alfajoresChain,
    transport: window.ethereum ? custom(window.ethereum) : http(),
  });

  return { publicClient, walletClient };
};
