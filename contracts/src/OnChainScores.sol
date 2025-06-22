// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "@openzeppelin/contracts/access/Ownable.sol";
import {IFarcasterOpenRank} from "./IFarcasterOpenRank.sol";


/// @title Global Farcaster OpenkRank scores & Pictogram Puzzler game scores
contract OnChainScores is IFarcasterOpenRank, Ownable {
    // --- BEGIN state variables ---

    /// @notice Leaderboard entries, sorted by score.
    User[] private leaderboard;

    /// @notice FID to their position (rank) in the leaderboard.
    /// @dev Invariant: an FID exists in fidRank iff it also appears in leaderboard.
    /// Rank values stored here are 1-based; 0 means fid not found.
    mapping(uint256 => uint256) public fidRank;

    // --- Game specific state variables ---
    
    /// @notice Structure to hold player game score details
    struct PlayerScore {
        uint256 score;
        string difficulty;  // "easy" or "hard"
        uint256 timestamp;
        uint256 puzzlesSolved;
        uint256 streak;
    }
    
    /// @notice Mapping from player address to their game score data
    mapping(address => PlayerScore) public playerScores;
    
    /// @notice Mapping from player address to their historical scores
    mapping(address => PlayerScore[]) public playerScoreHistory;
    
    /// @notice Top game players leaderboard
    address[] public gameLeaderboard;
    
    /// @notice Mapping from player address to their position in the game leaderboard
    mapping(address => uint256) public playerGameRank;
    
    /// @notice Cooldown period between score submissions (in seconds)
    uint256 public scoreCooldown = 60; // 1 minute default
    
    // --- Events ---
    
    /// @notice Emitted when a game score is recorded
    event GameScoreRecorded(address indexed player, uint256 score, string difficulty, uint256 puzzlesSolved, uint256 streak);
    
    /// @notice Emitted when cooldown period is updated
    event CooldownUpdated(uint256 newCooldown);

    // --- END state variables ---

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor(address owner) Ownable(msg.sender) {}


    /// @notice Extends the leaderboard with additional entries at the end.
    function appendScores(User[] calldata users) external onlyOwner {
        uint256 start = leaderboard.length;
        uint256 lastScore = start > 0 ? leaderboard[start - 1].score : type(uint256).max;
        for (uint256 i = 0; i < users.length; i++) {
            uint256 fid = users[i].fid;
            require(fid != 0, "zero FID");
            require(fidRank[fid] == 0, "FID already ranked");
            uint256 score = users[i].score;
            require(score <= lastScore, "score not sorted");
            leaderboard.push(users[i]);
            fidRank[users[i].fid] = start + i + 1;
            emit ScoreSet(users[i].fid, start + i, score);
            lastScore = score;
        }
    }

    /// @notice Truncates a tail of the given length of the leaderboard.
    /// If the leaderboard has less entries, truncate to empty.
    function truncate(uint256 count) external onlyOwner {
        uint256 length = leaderboard.length;
        for (; length > 0 && count > 0; count--) {
            User memory user = leaderboard[--length];
            leaderboard.pop();
            delete fidRank[user.fid];
            emit ScoreDeleted(user.fid, leaderboard.length, user.score);
        }
    }

    // --- BEGIN impl IFarcasterOpenRank ---

    /// @notice Gets the given FID's rank.
    /// @param fid Farcaster ID.
    /// @return rank Rank (position) in the leaderboard.
    function getFidRank(uint256 fid) external view returns (uint256 rank) {
        return fidRank[fid];
    }

    function leaderboardLength() external view returns (uint256) {
        return leaderboard.length;
    }

    function getUserAtRank(uint256 rank) external view returns (User memory user) {
        require(rank >= 1 && rank <= leaderboard.length, "rank out of range");
        user = leaderboard[rank - 1];
    }

    function getUsersAtRanks(uint256[] calldata ranks) external view returns (User[] memory users) {
        users = new User[](ranks.length);
        for (uint256 i = 0; i < ranks.length; i++) {
            uint256 rank = ranks[i];
            if (rank >= 1 && rank <= leaderboard.length) {
                users[i] = leaderboard[rank - 1];
            }
        }
    }

    function getUsersInRankRange(uint256 start, uint256 count) external view returns (User[] memory users) {
        if (start < 1) {
            start = 1;
        }
        start--; // convert to zero-based
        if (start >= leaderboard.length) {
            start = leaderboard.length;
        }
        if (start + count > leaderboard.length) {
            count = leaderboard.length - start;
        }
        users = new User[](count);
        for (uint256 i = 0; i < count; i++) {
            users[i] = leaderboard[start++];
        }
    }

    function getRankAndScoreForFID(uint256 fid) external view returns (uint256 rank, uint256 score) {
        (rank, score) = _getRankAndScoreForFID(fid);
    }

    function _getRankAndScoreForFID(uint256 fid) private view returns (uint256 rank, uint256 score) {
        rank = fid > 0 ? fidRank[fid] : 0;
        score = rank > 0 ? leaderboard[rank - 1].score : 0;
    }

    function getRanksAndScoresForFIDs(uint256[] calldata fids)
        external
        view
        returns (uint256[] memory ranks, uint256[] memory scores)
    {
        (ranks, scores) = _getRanksAndScoresForFIDs(fids);
    }

    function _getRanksAndScoresForFIDs(uint256[] memory fids)
        private
        view
        returns (uint256[] memory ranks, uint256[] memory scores)
    {
        ranks = new uint256[](fids.length);
        scores = new uint256[](fids.length);
        for (uint256 i = 0; i < fids.length; i++) {
            uint256 fid = fids[i];
            uint256 rank = fid > 0 ? fidRank[fid] : 0;
            ranks[i] = rank;
            scores[i] = rank > 0 ? leaderboard[rank - 1].score : 0;
        }
    }

    // --- END impl IFarcasterOpenRank ---

    // --- BEGIN Pictogram Puzzler game functions ---
    
    /// @notice Submit a new game score
    /// @param score The player's score
    /// @param difficulty The game difficulty ("easy" or "hard")
    /// @param puzzlesSolved Number of puzzles solved
    /// @param streak Current streak
    function submitGameScore(uint256 score, string calldata difficulty, uint256 puzzlesSolved, uint256 streak) external {
        // Check if player is on cooldown
        if (playerScoreHistory[msg.sender].length > 0) {
            PlayerScore memory lastSubmission = playerScoreHistory[msg.sender][playerScoreHistory[msg.sender].length - 1];
            require(block.timestamp >= lastSubmission.timestamp + scoreCooldown, "Score submission on cooldown");
        }
        
        // Create new score record
        PlayerScore memory newScore = PlayerScore({
            score: score,
            difficulty: difficulty,
            timestamp: block.timestamp,
            puzzlesSolved: puzzlesSolved,
            streak: streak
        });
        
        // Add to history
        playerScoreHistory[msg.sender].push(newScore);
        
        // Update current score
        playerScores[msg.sender] = newScore;
        
        // Update game leaderboard (simplified - a production implementation would sort by score)
        if (playerGameRank[msg.sender] == 0) {
            gameLeaderboard.push(msg.sender);
            playerGameRank[msg.sender] = gameLeaderboard.length;
        }
        
        // Emit event
        emit GameScoreRecorded(msg.sender, score, difficulty, puzzlesSolved, streak);
    }
    
    /// @notice Get a player's highest score
    /// @param player The player's address
    /// @return The player's highest score
    function getPlayerScore(address player) external view returns (PlayerScore memory) {
        return playerScores[player];
    }
    
    /// @notice Get a player's score history
    /// @param player The player's address
    /// @return An array of the player's historical scores
    function getPlayerScoreHistory(address player) external view returns (PlayerScore[] memory) {
        return playerScoreHistory[player];
    }
    
    /// @notice Get top players by score
    /// @param count Number of top players to return
    /// @return addresses Player addresses
    /// @return scores Player scores
    function getTopPlayers(uint256 count) external view returns (address[] memory addresses, uint256[] memory scores) {
        uint256 length = gameLeaderboard.length;
        if (count > length) {
            count = length;
        }
        
        addresses = new address[](count);
        scores = new uint256[](count);
        
        // Simple implementation - in production we should maintain a sorted list
        for (uint256 i = 0; i < count; i++) {
            addresses[i] = gameLeaderboard[i];
            scores[i] = playerScores[gameLeaderboard[i]].score;
        }
    }
    
    /// @notice Set the cooldown period between score submissions
    /// @param newCooldown New cooldown in seconds
    function setScoreCooldown(uint256 newCooldown) external onlyOwner {
        scoreCooldown = newCooldown;
        emit CooldownUpdated(newCooldown);
    }

    /// @notice Health check.  Used to check for installation.
    function healthCheck(uint256 nonce) public pure returns (uint256) {
        return nonce * 40 + 2;
    }
}