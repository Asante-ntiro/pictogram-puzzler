import { getAccount, getPublicClient, getWalletClient } from '@wagmi/core';
import {
  useAccount,
  useWriteContract,
  useConnect,
  useSwitchChain,
  useSendTransaction,
  usePublicClient,
} from "wagmi";

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
  async isConnected(accountOverride?: string): Promise<boolean> {
    const account = getAccount(config);
    return !!accountOverride || !!account.address;
  }

  // Mint an achievement NFT based on game performance
  async mintAchievement(score: number, difficulty: string, puzzlesSolved: number, streak: number, accountOverride?: string) {
    const walletClient = await getWalletClient(config);
    if (!walletClient) throw new Error('Wallet not connected');
    
    const account = (accountOverride || walletClient.account.address) as `0x${string}`;
    
    try {
      const publicClient = getPublicClient(config);
      if (!publicClient) throw new Error('Public client not initialized');
      
      // First simulate the contract call
      const { request } = await publicClient.simulateContract({
        address: CONTRACT_ADDRESS,
        abi: PictogramAchievementABI,
        functionName: 'mintAchievement',
        args: [account, BigInt(score), difficulty, BigInt(puzzlesSolved), BigInt(streak)],
        account: walletClient.account
      });
      
      // Send the transaction
      const hash = await walletClient.writeContract(request);
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      
      return { success: true, txHash: hash };
    } catch (error) {
      console.error('Mint error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Minting failed' };
    }
  }

  // Get all NFTs owned by the current account
  async getOwnedAchievements(accountOverride?: string): Promise<Achievement[]> {
    const publicClient = getPublicClient(config);
    if (!publicClient) throw new Error('Public client not initialized');
    
    const account = (accountOverride || getAccount(config).address) as `0x${string}`;
    if (!account) return [];

    try {
      const balance = await publicClient.readContract({
        address: CONTRACT_ADDRESS,
        abi: PictogramAchievementABI,
        functionName: 'balanceOf',
        args: [account]
      }) as bigint;

      const achievements: Achievement[] = [];
      
      for (let i = 0; i < Number(balance); i++) {
        const tokenId = await publicClient.readContract({
          address: CONTRACT_ADDRESS,
          abi: PictogramAchievementABI,
          functionName: 'tokenOfOwnerByIndex',
          args: [account, BigInt(i)]
        }) as bigint;
        
        const achievementData = await publicClient.readContract({
          address: CONTRACT_ADDRESS,
          abi: PictogramAchievementABI,
          functionName: 'achievements',
          args: [tokenId]
        }) as readonly [bigint, string, bigint, bigint, bigint, number];

        achievements.push({
          tokenId,
          score: achievementData[0],
          difficulty: achievementData[1],
          puzzlesSolved: achievementData[2],
          streak: achievementData[3],
          timestamp: achievementData[4],
          tier: achievementData[5]
        });
      }
      
      return achievements;
    } catch (error) {
      console.error('Error getting achievements:', error);
      return [];
    }
  }

  // Get token URI for an NFT (for metadata and image display)
  async getTokenURI(tokenId: bigint, accountOverride?: string): Promise<string | null> {
    const publicClient = getPublicClient(config);
    if (!publicClient) return null;

    try {
      return await publicClient.readContract({
        address: CONTRACT_ADDRESS,
        abi: PictogramAchievementABI,
        functionName: 'tokenURI',
        args: [tokenId]
      }) as string;
    } catch (error) {
      console.error('Error getting token URI:', error);
      return null;
    }
  }

  // Get total supply of NFTs
  async getTotalSupply(): Promise<bigint> {
    const publicClient = getPublicClient(config);
    if (!publicClient) return BigInt(0);

    try {
      return await publicClient.readContract({
        address: CONTRACT_ADDRESS,
        abi: PictogramAchievementABI,
        functionName: 'totalSupply'
      }) as bigint;
    } catch (error) {
      console.error('Error getting total supply:', error);
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