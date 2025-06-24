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
    const account = useAccount();
    return !!accountOverride || !!account.address;
  }

  // Mint an achievement NFT based on game performance


  // Get all NFTs owned by the current account


  // Get token URI for an NFT (for metadata and image display)
  