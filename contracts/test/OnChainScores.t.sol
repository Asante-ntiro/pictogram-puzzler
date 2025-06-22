// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "forge-std/Test.sol";
import "../src/OnChainScores.sol";
import "../src/IFarcasterOpenRank.sol";

contract OnChainScoresTest is Test {
    OnChainScores public scores;
    address owner = address(1);
    address user1 = address(2);
    address user2 = address(3);

    function setUp() public {

        // Initialize the scores contract with the proxy address
        scores = new OnChainScores(owner);
        
        // Transfer ownership if needed
        if (scores.owner() != owner) {
            vm.prank(scores.owner());
            scores.transferOwnership(owner);
        }
    }

    function test_OwnerIsSet() public view {
        assertEq(scores.owner(), owner);
    }

    // Add more test functions for your contract's functionality
    // Example:
    /*
    function test_AddScore() public {
        uint256 score = 100;
        string memory username = "testUser";
        
        vm.prank(user1);
        scores.appendScores([User({fid: user1, score: score})]);
        
        assertEq(scores.fidRank(user1), 1);
        assertEq(scores.leaderboardLength(), 1);
    }
    */
}