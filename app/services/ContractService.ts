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

// ABI for OnChainScores contract - focuses on the functions we need
const OnChainScoresABI = [
  // Game score functions
  {
    "inputs": [
      { "name": "score", "type": "uint256" },
      { "name": "difficulty", "type": "string" },
      { "name": "puzzlesSolved", "type": "uint256" },
      { "name": "streak", "type": "uint256" }
    ],
    "name": "submitGameScore",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "name": "player", "type": "address" }],
    "name": "getPlayerScore",
    "outputs": [
      {
        "components": [
          { "name": "score", "type": "uint256" },
          { "name": "difficulty", "type": "string" },
          { "name": "timestamp", "type": "uint256" },
          { "name": "puzzlesSolved", "type": "uint256" },
          { "name": "streak", "type": "uint256" }
        ],
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "name": "player", "type": "address" }],
    "name": "getPlayerScoreHistory",
    "outputs": [
      {
        "components": [
          { "name": "score", "type": "uint256" },
          { "name": "difficulty", "type": "string" },
          { "name": "timestamp", "type": "uint256" },
          { "name": "puzzlesSolved", "type": "uint256" },
          { "name": "streak", "type": "uint256" }
        ],
        "name": "",
        "type": "tuple[]"
      }
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
  private chain = celoAlfajores; // Use Celo Alfajores to match wagmi config

  // Score thresholds for different tiers
  static readonly BRONZE_THRESHOLD = 50;
  static readonly SILVER_THRESHOLD = 100;
  static readonly GOLD_THRESHOLD = 200;

  private constructor() {}

  // Static method to get or create instance
  static getInstance(): ContractService {
    if (!ContractService.instance) {
      ContractService.instance = new ContractService();
    }
    return ContractService.instance;
  }

  // Get wagmi's connected public client
  private async getPublicClient(): Promise<PublicClient | null> {
    try {
      console.log('ContractService: Getting public client from wagmi config');
      const client = getPublicClient(config);
      console.log('ContractService: Public client retrieved:', {
        hasClient: !!client,
        clientType: typeof client,
        chain: client?.chain?.name,
        chainId: client?.chain?.id
      });
      
      // If wagmi client is null, try fallback
      if (!client) {
        console.log('ContractService: Wagmi public client is null, trying fallback...');
        const { publicClient } = createClients();
        console.log('ContractService: Fallback public client:', {
          hasClient: !!publicClient,
          chain: publicClient?.chain?.name,
          chainId: publicClient?.chain?.id
        });
        return publicClient as PublicClient | null;
      }
      
      return client as PublicClient | null;
    } catch (error) {
      console.error('ContractService: Failed to get public client:', error);
      // Try fallback on error
      try {
        console.log('ContractService: Trying fallback public client due to error...');
        const { publicClient } = createClients();
        return publicClient as PublicClient | null;
      } catch (fallbackError) {
        console.error('ContractService: Fallback public client also failed:', fallbackError);
        return null;
      }
    }
  }

  // Get wagmi's connected wallet client
  private async getWalletClient(): Promise<WalletClient | null> {
    try {
      console.log('ContractService: Getting wallet client from wagmi config');
      
      // First try to get the account to check if we have a connector
      const account = getAccount(config);
      console.log('ContractService: Account for wallet client:', {
        hasAccount: !!account,
        address: account.address,
        isConnected: account.isConnected,
        isConnecting: account.isConnecting,
        isDisconnected: account.isDisconnected,
        status: account.status,
        connector: account.connector?.name
      });
      
      // If we have a connected account with a connector, try to get wallet client from connector
      if (account.isConnected && account.connector) {
        console.log('ContractService: Getting wallet client from connector...');
        try {
          // Type assertion for connector's getWalletClient method
          const connector = account.connector as any;
          if (connector.getWalletClient && typeof connector.getWalletClient === 'function') {
            const walletClient = await connector.getWalletClient();
            console.log('ContractService: Wallet client from connector:', {
              hasClient: !!walletClient,
              account: walletClient?.account?.address,
              chain: walletClient?.chain?.name,
              chainId: walletClient?.chain?.id
            });
            if (walletClient) {
              return walletClient as WalletClient;
            }
          }
        } catch (connectorError) {
          console.error('ContractService: Failed to get wallet client from connector:', connectorError);
        }
      }
      
      // Fallback to wagmi's getWalletClient
      console.log('ContractService: Trying wagmi getWalletClient as fallback...');
      const client = await getWalletClient(config);
      console.log('ContractService: Wagmi wallet client retrieved:', {
        hasClient: !!client,
        clientType: typeof client,
        account: client?.account?.address,
        chain: client?.chain?.name,
        chainId: client?.chain?.id
      });
      
      // If wagmi client is null, try createClients fallback
      if (!client) {
        console.log('ContractService: Wagmi wallet client is null, trying createClients fallback...');
        const { walletClient } = createClients();
        console.log('ContractService: CreateClients wallet client:', {
          hasClient: !!walletClient,
          chain: walletClient?.chain?.name,
          chainId: walletClient?.chain?.id
        });
        return walletClient as WalletClient | null;
      }
      
      return client as WalletClient | null;
    } catch (error) {
      console.error('ContractService: Failed to get wallet client:', error);
      // Try createClients fallback on error
      try {
        console.log('ContractService: Trying createClients fallback due to error...');
        const { walletClient } = createClients();
        return walletClient as WalletClient | null;
      } catch (fallbackError) {
        console.error('ContractService: CreateClients fallback also failed:', fallbackError);
        return null;
      }
    }
  }

  // Get wagmi's connected account
  private getAccount(): Address | null {
    try {
      console.log('ContractService: Getting account from wagmi config');
      const account = getAccount(config);
      console.log('ContractService: Account retrieved:', {
        hasAccount: !!account,
        address: account.address,
        isConnected: account.isConnected,
        isConnecting: account.isConnecting,
        isDisconnected: account.isDisconnected,
        status: account.status,
        connector: account.connector?.name
      });
      return account.address || null;
    } catch (error) {
      console.error('ContractService: Failed to get account:', error);
      return null;
    }
  }

  // Check if the wallet is connected
  async isConnected(): Promise<boolean> {
    console.log('ContractService: Checking connection status...');
    const account = this.getAccount();
    const publicClient = await this.getPublicClient();
    const walletClient = await this.getWalletClient();
    
    console.log('ContractService connection check:', {
      hasAccount: !!account,
      hasPublicClient: !!publicClient,
      hasWalletClient: !!walletClient,
      account,
      publicClientChain: publicClient?.chain?.name,
      walletClientChain: walletClient?.chain?.name,
      targetChain: this.chain.name
    });
    
    const isConnected = !!(account && publicClient && walletClient);
    console.log('ContractService: Final connection status:', isConnected);
    return isConnected;
  }

  // Mint an achievement NFT based on game score
  async mintAchievement(score: number, difficulty: string, puzzlesSolved: number, streak: number): Promise<{success: boolean, error?: string}> {
    const publicClient = await this.getPublicClient();
    const walletClient = await this.getWalletClient();
    const account = this.getAccount();
    
    if (!publicClient || !walletClient || !account) {
      console.error("Client or account not initialized");
      console.log('Debug info:', {
        hasPublicClient: !!publicClient,
        hasWalletClient: !!walletClient,
        hasAccount: !!account,
        account
      });
      return { success: false, error: "Wallet not connected" };
    }
    
    // Check if score meets minimum threshold
    if (score < ContractService.BRONZE_THRESHOLD) {
      console.error("Score too low to earn an achievement NFT");
      return { 
        success: false, 
        error: `Score too low! You need at least ${ContractService.BRONZE_THRESHOLD} points to earn a Bronze achievement. Keep playing to improve your score!` 
      };
    }
    
    try {
      // Prepare the transaction
      const { request } = await publicClient.simulateContract({
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
      
      // Send the transaction
      const hash = await walletClient.writeContract({
        ...request,
        chain: this.chain
      });
      
      // Wait for transaction receipt
      await publicClient.waitForTransactionReceipt({ hash });
      return { success: true };
    } catch (error) {
      console.error("Error minting achievement NFT:", error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : "Failed to mint achievement NFT" 
      };
    }
  }

  // Get all NFTs owned by the current account
  async getOwnedAchievements(): Promise<Achievement[]> {
    const publicClient = await this.getPublicClient();
    const account = this.getAccount();
    
    if (!publicClient || !account) {
      console.error("Client or account not initialized");
      return [];
    }

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
    const publicClient = await this.getPublicClient();
    
    if (!publicClient) {
      console.error("Client not initialized");
      return null;
    }

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
}
