import { http, createConfig, WagmiConfig } from 'wagmi';
import { celoAlfajores } from 'wagmi/chains';
import { createPublicClient, createWalletClient, custom } from 'viem';

// Define the Celo Alfajores testnet chain
const alfajoresChain = celoAlfajores;

// Our contract address - deployed on Celo Alfajores testnet
export const CONTRACT_ADDRESS = "0xC597FCf9C877943775bE9bb7EEf83DbBEd88A650";

// Configuration for wagmi
export const config = createConfig({
  chains: [alfajoresChain],
  transports: {
    [alfajoresChain.id]: http(),
  },
});

// Create clients that can be used outside of React components
export const createClients = () => {
  if (typeof window === 'undefined') {
    return { publicClient: null, walletClient: null };
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
