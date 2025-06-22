// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/Base64.sol";

/**
 * @title PictogramAchievement
 * @dev NFT rewards for Pictogram Puzzler game achievements
 */
contract PictogramAchievement is ERC721Enumerable, ERC721URIStorage, Ownable {
    using Strings for uint256;
    
    // NFT tier based on score thresholds
    enum Tier { BRONZE, SILVER, GOLD }
    
    // Score thresholds for each tier
    uint256 public constant BRONZE_THRESHOLD = 500;
    uint256 public constant SILVER_THRESHOLD = 1000;
    uint256 public constant GOLD_THRESHOLD = 1500;
    
    // Achievement details stored for each token
    struct Achievement {
        uint256 score;
        string difficulty;
        uint256 puzzlesSolved;
        uint256 streak;
        uint256 timestamp;
        Tier tier;
    }
    
    // Mapping from token ID to achievement data
    mapping(uint256 => Achievement) public achievements;
    
    // Cooldown period between minting (in seconds)
    uint256 public mintCooldown = 60; // 1 minute default
    
    // Last mint timestamp for each address
    mapping(address => uint256) public lastMintTimestamp;
    
    // Events
    event AchievementMinted(address indexed player, uint256 tokenId, uint256 score, Tier tier);
    event CooldownUpdated(uint256 newCooldown);
    
    constructor(address initialOwner) ERC721("Pictogram Puzzler Achievement", "PPA") Ownable(initialOwner) {}
    
    /**
     * @dev Mint a new achievement NFT based on game performance
     * @param player Address to mint the NFT to
     * @param score Player's score
     * @param difficulty Game difficulty ("easy" or "hard")
     * @param puzzlesSolved Number of puzzles solved
     * @param streak Current streak
     */
    function mintAchievement(
        address player,
        uint256 score, 
        string calldata difficulty, 
        uint256 puzzlesSolved, 
        uint256 streak
    ) external {
        // Check if player is on cooldown
        require(block.timestamp >= lastMintTimestamp[player] + mintCooldown, "Minting on cooldown");
        
        // Determine tier based on score
        Tier tier;
        if (score >= GOLD_THRESHOLD) {
            tier = Tier.GOLD;
        } else if (score >= SILVER_THRESHOLD) {
            tier = Tier.SILVER;
        } else if (score >= BRONZE_THRESHOLD) {
            tier = Tier.BRONZE;
        } else {
            revert("Score too low for achievement");
        }
        
        // Get the next token ID
        uint256 tokenId = totalSupply() + 1;
        
        // Store achievement data
        achievements[tokenId] = Achievement({
            score: score,
            difficulty: difficulty,
            puzzlesSolved: puzzlesSolved,
            streak: streak,
            timestamp: block.timestamp,
            tier: tier
        });
        
        // Update cooldown timestamp
        lastMintTimestamp[player] = block.timestamp;
        
        // Mint the token
        _safeMint(player, tokenId);
        
        // Set the token URI with metadata
        _setTokenURI(tokenId, _generateTokenURI(tokenId));
        
        // Emit event
        emit AchievementMinted(player, tokenId, score, tier);
    }
    
    /**
     * @dev Generate token URI with metadata
     * @param tokenId Token ID
     * @return Token URI with base64 encoded metadata
     */
    function _generateTokenURI(uint256 tokenId) internal view returns (string memory) {
        Achievement memory achievement = achievements[tokenId];
        
        // Get tier name
        string memory tierName;
        string memory tierColor;
        
        if (achievement.tier == Tier.GOLD) {
            tierName = "GOLD";
            tierColor = "#FFD700";
        } else if (achievement.tier == Tier.SILVER) {
            tierName = "SILVER";
            tierColor = "#C0C0C0";
        } else {
            tierName = "BRONZE";
            tierColor = "#CD7F32";
        }
        
        // Build image SVG (simple version - could be enhanced with more visual elements)
        string memory svg = string(abi.encodePacked(
            '<svg xmlns="http://www.w3.org/2000/svg" width="350" height="350" viewBox="0 0 350 350">',
            '<rect width="100%" height="100%" fill="#1a1c24"/>',
            '<text x="50%" y="30%" font-family="monospace" font-size="24" text-anchor="middle" fill="white">Pictogram Puzzler</text>',
            '<text x="50%" y="45%" font-family="monospace" font-size="32" text-anchor="middle" fill="', tierColor, '">', tierName, ' ACHIEVEMENT</text>',
            '<text x="50%" y="60%" font-family="monospace" font-size="20" text-anchor="middle" fill="white">Score: ', achievement.score.toString(), '</text>',
            '<text x="50%" y="70%" font-family="monospace" font-size="16" text-anchor="middle" fill="white">',
            achievement.difficulty, ' mode | ', achievement.puzzlesSolved.toString(), ' puzzles | ', achievement.streak.toString(), ' streak',
            '</text>',
            '</svg>'
        ));
        
        // Format token description
        string memory description = string(abi.encodePacked(
            "A ", tierName, " tier achievement in Pictogram Puzzler. ",
            "Score: ", achievement.score.toString(), " | ",
            "Difficulty: ", achievement.difficulty, " | ",
            "Puzzles Solved: ", achievement.puzzlesSolved.toString(), " | ",
            "Streak: ", achievement.streak.toString()
        ));
        
        // Encode SVG to data URI
        string memory encodedSvg = string(abi.encodePacked(
            "data:image/svg+xml;base64,", 
            Base64.encode(bytes(svg))
        ));
        
        // Create JSON metadata
        string memory json = Base64.encode(
            bytes(string(abi.encodePacked(
                '{"name": "Pictogram Puzzler ', tierName, ' Achievement", ',
                '"description": "', description, '", ',
                '"image": "', encodedSvg, '", ',
                '"attributes": [',
                '{"trait_type": "Tier", "value": "', tierName, '"}, ',
                '{"trait_type": "Score", "value": ', achievement.score.toString(), '}, ',
                '{"trait_type": "Difficulty", "value": "', achievement.difficulty, '"}, ',
                '{"trait_type": "Puzzles Solved", "value": ', achievement.puzzlesSolved.toString(), '}, ',
                '{"trait_type": "Streak", "value": ', achievement.streak.toString(), '}',
                ']}'
            )))
        );
        
        return string(abi.encodePacked("data:application/json;base64,", json));
    }
    
    /**
     * @dev Set the cooldown period between minting
     * @param newCooldown New cooldown in seconds
     */
    function setMintCooldown(uint256 newCooldown) external onlyOwner {
        mintCooldown = newCooldown;
        emit CooldownUpdated(newCooldown);
    }
    
    // Required overrides for ERC721 extensions
    function _update(address to, uint256 tokenId, address auth) internal override(ERC721, ERC721Enumerable) returns (address) {
        return super._update(to, tokenId, auth);
    }
    
    function _increaseBalance(address account, uint128 value) internal override(ERC721, ERC721Enumerable) {
        super._increaseBalance(account, value);
    }
    
    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC721Enumerable, ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
