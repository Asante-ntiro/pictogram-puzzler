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
import { hardhat } from 'wagmi/chains';
import { config } from '../config/wagmi';

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
  private publicClient: PublicClient | null = null;
  private walletClient: WalletClient | null = null;
  private account: Address | null = null;
  private chain = hardhat; // Using hardhat chain for local testing with Anvil

  // Static instance for singleton pattern
  private static instance: ContractService;

  // Score thresholds from contract (must match contract values)
  public static readonly BRONZE_THRESHOLD = 500;
  public static readonly SILVER_THRESHOLD = 1000;
  public static readonly GOLD_THRESHOLD = 1500;

  // Static method to get or create instance
  public static getInstance(): ContractService {
    if (!ContractService.instance) {
      ContractService.instance = new ContractService();
    }
    return ContractService.instance;
  }

  // Initialize the service when the wallet is connected
  async connect(): Promise<boolean> {
    if (typeof window !== 'undefined' && window.ethereum) {
      try {
        // Create a public client (for reading from the blockchain)
        this.publicClient = createPublicClient({
          chain: this.chain,
          transport: custom(window.ethereum)
        });
        
        // Create a wallet client (for writing to the blockchain)
        this.walletClient = createWalletClient({
          chain: this.chain,
          transport: custom(window.ethereum)
        });
        
        // Request account access
        if (this.walletClient) {
          const [address] = await this.walletClient.requestAddresses();
          this.account = address;
        }
        
        return true;
      } catch (error) {
        console.error("Error connecting to wallet:", error);
        return false;
      }
    } else {
      console.error("No Ethereum browser extension detected");
      return false;
    }
  }

  // Check if the wallet is connected
  isConnected(): boolean {
    return !!this.account && !!this.publicClient && !!this.walletClient;
  }

  // Mint an achievement NFT based on game score
  async mintAchievement(score: number, difficulty: string, puzzlesSolved: number, streak: number): Promise<{success: boolean, error?: string}> {
    if (!this.publicClient || !this.walletClient || !this.account) {
      console.error("Client or account not initialized");
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
      const { request } = await this.publicClient.simulateContract({
        address: CONTRACT_ADDRESS,
        abi: PictogramAchievementABI,
        functionName: 'mintAchievement',
        args: [
          this.account,
          BigInt(score), 
          difficulty, 
          BigInt(puzzlesSolved), 
          BigInt(streak)
        ],
        account: this.account,
      });
      
      // Send the transaction
      const hash = await this.walletClient.writeContract({
        ...request,
        chain: this.chain
      });
      
      // Wait for transaction receipt
      await this.publicClient.waitForTransactionReceipt({ hash });
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
    if (!this.publicClient || !this.account) {
      console.error("Client or account not initialized");
      return [];
    }

    try {
      // Get the balance of NFTs owned by the account
      const balance = await this.publicClient.readContract({
        address: CONTRACT_ADDRESS,
        abi: PictogramAchievementABI,
        functionName: 'balanceOf',
        args: [this.account]
      }) as bigint;
      
      const achievements: Achievement[] = [];
      
      // For each token, get the token ID and achievement data
      for (let i = 0; i < Number(balance); i++) {
        // Get token ID at index
        const tokenId = await this.publicClient.readContract({
          address: CONTRACT_ADDRESS,
          abi: PictogramAchievementABI,
          functionName: 'tokenOfOwnerByIndex',
          args: [this.account, BigInt(i)]
        }) as bigint;
        
        // Get achievement data
        const achievement = await this.publicClient.readContract({
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
    if (!this.publicClient) {
      console.error("Client not initialized");
      return null;
    }

    try {
      const tokenURI = await this.publicClient.readContract({
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
    if (!this.publicClient) {
      console.error("Client not initialized");
      return BigInt(0);
    }

    try {
      const totalSupply = await this.publicClient.readContract({
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
