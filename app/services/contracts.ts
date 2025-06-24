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