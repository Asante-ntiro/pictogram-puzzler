// Test script for PictogramAchievement contract integration
// Run this in the browser console to test contract functions

async function testContractIntegration() {
  console.log("🧪 Starting Contract Integration Test...");
  
  try {
    // Import ContractService (assuming it's available globally or via module)
    const contractService = ContractService.getInstance();
    
    console.log("1. Testing contract connection...");
    const isConnected = contractService.isConnected();
    console.log(`   Contract service connected: ${isConnected}`);
    
    if (!isConnected) {
      console.log("   ⚠️  Wallet not connected. Please connect wallet first.");
      return;
    }
    
    console.log("2. Testing total supply...");
    const totalSupply = await contractService.getTotalSupply();
    console.log(`   Total NFTs minted: ${totalSupply.toString()}`);
    
    console.log("3. Testing owned achievements...");
    const ownedAchievements = await contractService.getOwnedAchievements();
    console.log(`   Your achievements count: ${ownedAchievements.length}`);
    
    if (ownedAchievements.length > 0) {
      console.log("   Your achievements:");
      ownedAchievements.forEach((achievement, index) => {
        console.log(`     ${index + 1}. Token ID: ${achievement.tokenId.toString()}`);
        console.log(`        Score: ${achievement.score.toString()}`);
        console.log(`        Difficulty: ${achievement.difficulty}`);
        console.log(`        Tier: ${achievement.tier}`);
        console.log(`        Puzzles Solved: ${achievement.puzzlesSolved.toString()}`);
        console.log(`        Streak: ${achievement.streak.toString()}`);
      });
    }
    
    console.log("4. Testing score tier calculation...");
    const testScores = [400, 600, 1200, 1800];
    testScores.forEach(score => {
      const tier = ContractService.getScoreTier(score);
      console.log(`   Score ${score} -> Tier: ${tier !== null ? ['Bronze', 'Silver', 'Gold'][tier] : 'Too low'}`);
    });
    
    console.log("✅ Contract integration test completed!");
    
  } catch (error) {
    console.error("❌ Test failed:", error);
  }
}

// Test minting function (use with caution - this will actually mint an NFT)
async function testMintAchievement(score = 1000, difficulty = "easy", puzzlesSolved = 5, streak = 3) {
  console.log("🎯 Testing NFT minting...");
  console.log(`   Score: ${score}, Difficulty: ${difficulty}, Puzzles: ${puzzlesSolved}, Streak: ${streak}`);
  
  try {
    const contractService = ContractService.getInstance();
    
    if (!contractService.isConnected()) {
      console.log("   ⚠️  Wallet not connected. Please connect wallet first.");
      return;
    }
    
    console.log("   Attempting to mint achievement NFT...");
    const success = await contractService.mintAchievement(score, difficulty, puzzlesSolved, streak);
    
    if (success) {
      console.log("   ✅ Achievement NFT minted successfully!");
      
      // Fetch updated achievements
      const ownedAchievements = await contractService.getOwnedAchievements();
      console.log(`   Updated achievements count: ${ownedAchievements.length}`);
      
      if (ownedAchievements.length > 0) {
        const latestAchievement = ownedAchievements[ownedAchievements.length - 1];
        console.log("   Latest achievement:");
        console.log(`     Token ID: ${latestAchievement.tokenId.toString()}`);
        console.log(`     Score: ${latestAchievement.score.toString()}`);
        console.log(`     Tier: ${['Bronze', 'Silver', 'Gold'][latestAchievement.tier]}`);
      }
    } else {
      console.log("   ❌ Failed to mint achievement NFT");
    }
    
  } catch (error) {
    console.error("   ❌ Minting failed:", error);
  }
}

// Instructions
console.log(`
🎮 Pictogram Puzzler Contract Integration Test

To test the integration:

1. Open your browser's developer console (F12)
2. Make sure your wallet is connected to the local Anvil chain (127.0.0.1:8545)
3. Run: testContractIntegration()
4. To test minting: testMintAchievement(1000, "easy", 5, 3)

Note: Make sure you have some test ETH in your wallet for gas fees.
The default Anvil account should have plenty of test ETH.
`);

// Export functions for manual testing
if (typeof window !== 'undefined') {
  window.testContractIntegration = testContractIntegration;
  window.testMintAchievement = testMintAchievement;
}
