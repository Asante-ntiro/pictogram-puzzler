import {
  Address,
  PublicClient,
  WalletClient,
  getContract,
  http,
  custom,
  createPublicClient,
  createWalletClient
} from 'viem';
import { celoAlfajores } from 'wagmi/chains';
import { config, createClients } from '../config/wagmi';
import { getPublicClient, getWalletClient, getAccount } from '@wagmi/core';

// Define the ABI for the PictogramAchievement contract
export const PictogramAchievementABI = [
  {
    "inputs": [
      { "name": "player", "type": "address" },
      { "name": "score", "type": "uint256" },
      { "name": "difficulty", "type": "string" },
      { "name": "puzzlesSolved", "type": "uint256" },
      { "name": "streak", "type": "uint256" }
    ],
    "name": "mintAchievement",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "name": "owner", "type": "address" }
    ],
    "name": "balanceOf",
    "outputs": [
      { "name": "", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "name": "owner", "type": "address" },
      { "name": "index", "type": "uint256" }
    ],
    "name": "tokenOfOwnerByIndex",
    "outputs": [
      { "name": "", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "name": "tokenId", "type": "uint256" }
    ],
    "name": "achievements",
    "outputs": [
      { "name": "score", "type": "uint256" },
      { "name": "difficulty", "type": "string" },
      { "name": "puzzlesSolved", "type": "uint256" },
      { "name": "streak", "type": "uint256" },
      { "name": "timestamp", "type": "uint256" },
      { "name": "tier", "type": "uint8" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "name": "tokenId", "type": "uint256" }
    ],
    "name": "tokenURI",
    "outputs": [
      { "name": "", "type": "string" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "totalSupply",
    "outputs": [
      { "name": "", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

// Contract configuration
const CONTRACT_ADDRESS = '0xC597FCf9C877943775bE9bb7EEf83DbBEd88A650' as const;

// Enum for achievement tiers matching the contract
export enum Tier {
  BRONZE = 0,
  SILVER = 1,
  GOLD = 2
}

// Type definition for NFT Achievement
export interface Achievement {
  tokenId: bigint;
  score: bigint;
  difficulty: string;
  puzzlesSolved: bigint;
  streak: bigint;
  timestamp: bigint;
  tier: Tier;
}

// Export the class with getInstance method
export default class ContractService {
  private static instance: ContractService | null = null;
  private chain = celoAlfajores;

  // Score thresholds for different tiers
  static readonly BRONZE_THRESHOLD = 50;
  static readonly SILVER_THRESHOLD = 100;
  static readonly GOLD_THRESHOLD = 200;

  private constructor() {}

  static getInstance(): ContractService {
    if (!ContractService.instance) {
      ContractService.instance = new ContractService();
    }
    return ContractService.instance;
  }

  // Ensure wallet connection and authorization
  private async ensureWalletConnection(): Promise<{
    walletClient: WalletClient;
    publicClient: PublicClient;
    account: Address;
  } | null> {
    try {
      console.log('ContractService: Ensuring wallet connection...');
      
      // Request wallet connection if not already connected
      if (typeof window !== 'undefined' && window.ethereum) {
        try {
          // Request account access - this is crucial for authorization
          const accounts = await window.ethereum.request({ 
            method: 'eth_requestAccounts' 
          });
          console.log('ContractService: Accounts from eth_requestAccounts:', accounts);
        } catch (requestError) {
          console.error('ContractService: User denied account access:', requestError);
          return null;
        }
      }

      // Get wagmi account
      const account = getAccount(config);
      console.log('ContractService: Wagmi account:', {
        address: account.address,
        isConnected: account.isConnected,
        status: account.status,
        connector: account.connector?.name
      });

      if (!account.isConnected || !account.address) {
        console.error('ContractService: Wallet not connected via wagmi');
        return null;
      }

      // Get clients
      const publicClient = await this.getPublicClient();
      const walletClient = await getWalletClient(config);

      console.log('ContractService: Clients retrieved:', {
        hasPublicClient: !!publicClient,
        hasWalletClient: !!walletClient,
        walletClientAccount: walletClient?.account?.address,
        accountMatch: walletClient?.account?.address === account.address
      });

      if (!publicClient || !walletClient) {
        console.error('ContractService: Failed to get clients');
        return null;
      }

      // Ensure the wallet client account matches the connected account
      if (walletClient.account?.address !== account.address) {
        console.error('ContractService: Account mismatch between wallet client and wagmi');
        return null;
      }

      return {
        walletClient,
        publicClient,
        account: account.address as Address
      };
    } catch (error) {
      console.error('ContractService: Error ensuring wallet connection:', error);
      return null;
    }
  }

  // Get wagmi's connected public client
  private async getPublicClient(): Promise<PublicClient | null> {
    try {
      console.log('ContractService: Getting public client from wagmi config');
      const client = getPublicClient(config);
      
      if (!client) {
        console.log('ContractService: Wagmi public client is null, trying fallback...');
        const { publicClient } = createClients();
        return publicClient as PublicClient | null;
      }
      
      return client as PublicClient | null;
    } catch (error) {
      console.error('ContractService: Failed to get public client:', error);
      try {
        const { publicClient } = createClients();
        return publicClient as PublicClient | null;
      } catch (fallbackError) {
        console.error('ContractService: Fallback public client also failed:', fallbackError);
        return null;
      }
    }
  }

  // Check if the wallet is connected
  async isConnected(): Promise<boolean> {
    console.log('ContractService: Checking connection status...');
    const connection = await this.ensureWalletConnection();
    const isConnected = !!connection;
    console.log('ContractService: Final connection status:', isConnected);
    return isConnected;
  }

  // Mint an achievement NFT based on game performance
  async mintAchievement(
    score: number, 
    difficulty: string, 
    puzzlesSolved: number, 
    streak: number
  ): Promise<{ success: boolean; error?: string; txHash?: string }> {
    try {
      console.log('ContractService: Starting achievement mint...', { score, difficulty, puzzlesSolved, streak });
      
      // Ensure proper wallet connection and authorization
      const connection = await this.ensureWalletConnection();
      if (!connection) {
        return { 
          success: false, 
          error: "Please connect your wallet and try again. Make sure to approve the connection request." 
        };
      }

      const { walletClient, publicClient, account } = connection;

      // Check if score meets minimum threshold
      if (score < ContractService.BRONZE_THRESHOLD) {
        console.error("Score too low to earn an achievement NFT");
        return { 
          success: false, 
          error: `Score too low! You need at least ${ContractService.BRONZE_THRESHOLD} points to earn a Bronze achievement. Keep playing to improve your score!` 
        };
      }

      console.log('ContractService: Preparing transaction with account:', account);
      
      try {
        // First simulate the contract call to catch any issues
        const simulationResult = await publicClient.simulateContract({
          address: CONTRACT_ADDRESS,
          abi: PictogramAchievementABI,
          functionName: 'mintAchievement',
          args: [
            account,
            BigInt(score), 
            difficulty, 
            BigInt(puzzlesSolved), 
            BigInt(streak)
          ],
          account: account,
        });
        
        console.log('ContractService: Simulation successful, sending transaction...');
        
        // Send the transaction using the wallet client
        const hash = await walletClient.writeContract(simulationResult.request);
        
        console.log('ContractService: Transaction sent with hash:', hash);
        
        // Wait for transaction receipt
        const receipt = await publicClient.waitForTransactionReceipt({ hash });
        
        console.log('ContractService: Transaction confirmed:', receipt);
        
        return { success: true, txHash: hash };
      } catch (contractError: any) {
        console.error("ContractService: Contract interaction error:", contractError);
        
        // Handle specific error types
        if (contractError.message?.includes('User rejected') || contractError.code === 4001) {
          return { 
            success: false, 
            error: "Transaction was rejected. Please try again and approve the transaction in your wallet." 
          };
        }
        
        if (contractError.message?.includes('unauthorized') || contractError.message?.includes('not been authorized')) {
          return { 
            success: false, 
            error: "Wallet authorization failed. Please disconnect and reconnect your wallet, then try again." 
          };
        }
        
        return { 
          success: false, 
          error: contractError.message || "Failed to mint achievement NFT. Please try again." 
        };
      }
    } catch (error: any) {
      console.error("ContractService: General error minting achievement NFT:", error);
      return { 
        success: false, 
        error: error.message || "An unexpected error occurred. Please try again." 
      };
    }
  }

  // Get all NFTs owned by the current account
  async getOwnedAchievements(): Promise<Achievement[]> {
    const connection = await this.ensureWalletConnection();
    if (!connection) {
      console.error("Wallet not connected");
      return [];
    }

    const { publicClient, account } = connection;

    try {
      // Get the balance of NFTs owned by the account
      const balance = await publicClient.readContract({
        address: CONTRACT_ADDRESS,
        abi: PictogramAchievementABI,
        functionName: 'balanceOf',
        args: [account]
      }) as bigint;
      
      const achievements: Achievement[] = [];
      
      // For each token, get the token ID and achievement data
      for (let i = 0; i < Number(balance); i++) {
        // Get token ID at index
        const tokenId = await publicClient.readContract({
          address: CONTRACT_ADDRESS,
          abi: PictogramAchievementABI,
          functionName: 'tokenOfOwnerByIndex',
          args: [account, BigInt(i)]
        }) as bigint;
        
        // Get achievement data
        const achievement = await publicClient.readContract({
          address: CONTRACT_ADDRESS,
          abi: PictogramAchievementABI,
          functionName: 'achievements',
          args: [tokenId]
        }) as any;
        
        achievements.push({
          tokenId,
          score: achievement.score,
          difficulty: achievement.difficulty,
          puzzlesSolved: achievement.puzzlesSolved,
          streak: achievement.streak,
          timestamp: achievement.timestamp,
          tier: achievement.tier
        });
      }
      
      return achievements;
    } catch (error) {
      console.error("Error getting owned achievements:", error);
      return [];
    }
  }

  // Get token URI for an NFT (for metadata and image display)
  async getTokenURI(tokenId: bigint): Promise<string | null> {
    const connection = await this.ensureWalletConnection();
    if (!connection) {
      console.error("Wallet not connected");
      return null;
    }

    const { publicClient } = connection;

    try {
      const tokenURI = await publicClient.readContract({
        address: CONTRACT_ADDRESS,
        abi: PictogramAchievementABI,
        functionName: 'tokenURI',
        args: [tokenId]
      }) as string;
      
      return tokenURI;
    } catch (error) {
      console.error("Error getting token URI:", error);
      return null;
    }
  }

  // Get total supply of NFTs
  async getTotalSupply(): Promise<bigint> {
    const publicClient = await this.getPublicClient();
    
    if (!publicClient) {
      console.error("Client not initialized");
      return BigInt(0);
    }

    try {
      const totalSupply = await publicClient.readContract({
        address: CONTRACT_ADDRESS,
        abi: PictogramAchievementABI,
        functionName: 'totalSupply'
      }) as bigint;
      
      return totalSupply;
    } catch (error) {
      console.error("Error getting total supply:", error);
      return BigInt(0);
    }
  }
  
  // Determine which tier a score qualifies for
  static getScoreTier(score: number): Tier | null {
    if (score >= this.GOLD_THRESHOLD) {
      return Tier.GOLD;
    } else if (score >= this.SILVER_THRESHOLD) {
      return Tier.SILVER;
    } else if (score >= this.BRONZE_THRESHOLD) {
      return Tier.BRONZE;
    }
    return null; // Score too low for any tier
  }

  // Helper method to request wallet connection explicitly
  async requestWalletConnection(): Promise<boolean> {
    try {
      if (typeof window !== 'undefined' && window.ethereum) {
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to request wallet connection:', error);
      return false;
    }
  }
}