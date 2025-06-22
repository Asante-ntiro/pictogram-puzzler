"use client";

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import ContractService from '../services/ContractService';
import { Button } from './DemoComponents';

interface TestResult {
  test: string;
  status: 'pending' | 'success' | 'error';
  result?: any;
  error?: string;
}

export default function ContractTestPanel() {
  const { isConnected } = useAccount();
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const addTestResult = (test: string, status: 'pending' | 'success' | 'error', result?: any, error?: string) => {
    setTestResults(prev => [...prev, { test, status, result, error }]);
  };

  const runContractTests = async () => {
    setIsRunning(true);
    setTestResults([]);

    try {
      const contractService = ContractService.getInstance();

      // Test 1: Connection status
      addTestResult('Connection Status', 'pending');
      const connected = contractService.isConnected();
      addTestResult('Connection Status', connected ? 'success' : 'error', `Connected: ${connected}`);

      if (!connected) {
        addTestResult('Tests Skipped', 'error', null, 'Wallet not connected');
        setIsRunning(false);
        return;
      }

      // Test 2: Total Supply
      addTestResult('Total Supply', 'pending');
      try {
        const totalSupply = await contractService.getTotalSupply();
        addTestResult('Total Supply', 'success', `Total NFTs: ${totalSupply.toString()}`);
      } catch (error) {
        addTestResult('Total Supply', 'error', null, error instanceof Error ? error.message : 'Unknown error');
      }

      // Test 3: Owned Achievements
      addTestResult('Owned Achievements', 'pending');
      try {
        const achievements = await contractService.getOwnedAchievements();
        addTestResult('Owned Achievements', 'success', `Count: ${achievements.length}`);
        
        if (achievements.length > 0) {
          achievements.forEach((achievement, index) => {
            addTestResult(
              `Achievement #${index + 1}`, 
              'success', 
              `Token ID: ${achievement.tokenId.toString()}, Score: ${achievement.score.toString()}, Tier: ${achievement.tier}`
            );
          });
        }
      } catch (error) {
        addTestResult('Owned Achievements', 'error', null, error instanceof Error ? error.message : 'Unknown error');
      }

      // Test 4: Score Tier Calculation
      addTestResult('Score Tier Tests', 'pending');
      const testScores = [400, 600, 1200, 1800];
      testScores.forEach(score => {
        const tier = ContractService.getScoreTier(score);
        const tierName = tier !== null ? ['Bronze', 'Silver', 'Gold'][tier] : 'Too low';
        addTestResult(`Score ${score}`, 'success', `Tier: ${tierName}`);
      });

    } catch (error) {
      addTestResult('Test Suite', 'error', null, error instanceof Error ? error.message : 'Unknown error');
    }

    setIsRunning(false);
  };

  const testMintAchievement = async () => {
    setIsRunning(true);
    
    try {
      const contractService = ContractService.getInstance();
      
      if (!contractService.isConnected()) {
        addTestResult('Mint Test', 'error', null, 'Wallet not connected');
        setIsRunning(false);
        return;
      }

      addTestResult('Mint Achievement', 'pending');
      
      // Test with Silver tier score
      const result = await contractService.mintAchievement(1200, "easy", 6, 4);
      
      if (result.success) {
        addTestResult('Mint Achievement', 'success', 'Achievement NFT minted successfully');
        
        // Refresh achievements
        const achievements = await contractService.getOwnedAchievements();
        addTestResult('Updated Achievements', 'success', `New count: ${achievements.length}`);
      } else {
        addTestResult('Mint Achievement', 'error', null, result.error || 'Minting failed');
      }
      
    } catch (error) {
      addTestResult('Mint Achievement', 'error', null, error instanceof Error ? error.message : 'Unknown error');
    }
    
    setIsRunning(false);
  };

  return (
    <div className="bg-gray-100 dark:bg-gray-800 p-6 rounded-lg max-w-2xl mx-auto">
      <h2 className="text-xl font-bold mb-4">🧪 Contract Integration Test Panel</h2>
      
      <div className="space-y-3 mb-6">
        <Button 
          onClick={runContractTests} 
          disabled={isRunning}
          variant="primary"
          className="w-full"
        >
          {isRunning ? 'Running Tests...' : 'Run Contract Tests'}
        </Button>
        
        <Button 
          onClick={testMintAchievement} 
          disabled={isRunning || !isConnected}
          variant="secondary"
          className="w-full"
        >
          {isRunning ? 'Minting...' : 'Test Mint Achievement (Score: 1200)'}
        </Button>
      </div>

      {!isConnected && (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
          ⚠️ Please connect your wallet to run tests
        </div>
      )}

      <div className="space-y-2 max-h-96 overflow-y-auto">
        {testResults.map((result, index) => (
          <div 
            key={index} 
            className={`p-3 rounded text-sm ${
              result.status === 'success' 
                ? 'bg-green-100 text-green-800' 
                : result.status === 'error'
                ? 'bg-red-100 text-red-800'
                : 'bg-blue-100 text-blue-800'
            }`}
          >
            <div className="font-medium">{result.test}</div>
            {result.result && <div className="mt-1">{result.result}</div>}
            {result.error && <div className="mt-1 text-red-600">Error: {result.error}</div>}
          </div>
        ))}
      </div>

      <div className="mt-4 text-xs text-gray-500">
        <p><strong>Contract Address:</strong> 0x5FbDB2315678afecb367f032d93F642f64180aa3</p>
        <p><strong>Network:</strong> Anvil Local (127.0.0.1:8545)</p>
      </div>
    </div>
  );
}
