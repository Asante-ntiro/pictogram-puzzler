"use client";

import {
  useMiniKit,
  useAddFrame,
  useOpenUrl,
} from "@coinbase/onchainkit/minikit";
import {
  Name,
  Identity,
  Address,
  Avatar,
  EthBalance,
} from "@coinbase/onchainkit/identity";
import {
  ConnectWallet,
  Wallet,
  WalletDropdown,
  WalletDropdownDisconnect,
} from "@coinbase/onchainkit/wallet";
import { useEffect, useMemo, useState, useCallback } from "react";
import { Button } from "./components/DemoComponents";
import { Icon } from "./components/DemoComponents";
import { Home } from "./components/DemoComponents";
import { Game } from "./components/Game";
import {ScoreCard} from "./components/Game";
import ContractTestPanel from "./components/ContractTestPanel";

export default function App() {
  const { setFrameReady, isFrameReady, context } = useMiniKit();
  const [frameAdded, setFrameAdded] = useState(false);
  const [activeTab, setActiveTab] = useState("home");
  const [gameDifficulty, setGameDifficulty] = useState<'easy' | 'hard'>('easy');
  // Lifted state from Game component
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [gameCompleted, setGameCompleted] = useState(false);
  const [shownMoviesEasy, setShownMoviesEasy] = useState<string[]>([]);
  const [shownMoviesHard, setShownMoviesHard] = useState<string[]>([]);

  const addFrame = useAddFrame();
  const openUrl = useOpenUrl();

  useEffect(() => {
    if (!isFrameReady) {
      setFrameReady();
    }
  }, [setFrameReady, isFrameReady]);

  // Load game state from localStorage on initial render
  useEffect(() => {
    const savedState = localStorage.getItem('pictogramPuzzler');
    if (savedState) {
      try {
        const { 
          shownMoviesEasy, 
          shownMoviesHard, 
          score, 
          bestScore, 
          gameCompleted 
        } = JSON.parse(savedState);
        
        setShownMoviesEasy(shownMoviesEasy || []);
        setShownMoviesHard(shownMoviesHard || []);
        setScore(score || 0);
        setBestScore(bestScore || 0);
        setGameCompleted(gameCompleted || false);
      } catch (e) {
        console.error('Error loading saved game state:', e);
      }
    }
  }, []);
  
  // Save game state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('pictogramPuzzler', JSON.stringify({
      shownMoviesEasy,
      shownMoviesHard,
      score,
      bestScore,
      gameCompleted
    }));
  }, [shownMoviesEasy, shownMoviesHard, score, bestScore, gameCompleted]);

  const handleAddFrame = useCallback(async () => {
    const frameAdded = await addFrame();
    setFrameAdded(Boolean(frameAdded));
  }, [addFrame]);

  const handleTabChange = useCallback((tab: string, difficulty?: 'easy' | 'hard') => {
    setActiveTab(tab);
    if (difficulty) {
      setGameDifficulty(difficulty);
    }
    
    // Reset game completion state when starting a new game
    if (tab === "game") {
      setGameCompleted(false);
    }
  }, []);

  // Update best score whenever score changes
  useEffect(() => {
    if (score > bestScore) {
      setBestScore(score);
    }
  }, [score, bestScore]);

  const saveFrameButton = useMemo(() => {
    if (context && !context.client.added) {
      return (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleAddFrame}
          className="text-[var(--app-accent)] p-4"
          icon={<Icon name="plus" size="sm" />}
        >
          Save Frame
        </Button>
      );
    }

    if (frameAdded) {
      return (
        <div className="flex items-center space-x-1 text-sm font-medium text-[#0052FF] animate-fade-out">
          <Icon name="check" size="sm" className="text-[#0052FF]" />
          <span>Saved</span>
        </div>
      );
    }

    return null;
  }, [context, frameAdded, handleAddFrame]);

  return (
    <div className="flex flex-col min-h-screen font-sans text-[var(--app-foreground)] mini-app-theme from-[var(--app-background)] to-[var(--app-gray)]">
      <div className="w-full max-w-md mx-auto px-4 py-3">
        <header className="flex justify-between items-center mb-3 h-11">
          <div>{saveFrameButton}</div>
        </header>

        <main className="flex-1">
          {activeTab === "home" && <Home setActiveTab={handleTabChange} />}
          {activeTab === "game" && (
            <Game 
              setActiveTab={handleTabChange} 
              initialDifficulty={gameDifficulty} 
              score={score}
              setScore={setScore}
              streak={streak}
              setStreak={setStreak}
              gameCompleted={gameCompleted}
              setGameCompleted={setGameCompleted}
              shownMovies={gameDifficulty === 'easy' ? shownMoviesEasy : shownMoviesHard}
              setShownMovies={gameDifficulty === 'easy' ? setShownMoviesEasy : setShownMoviesHard}
            />
          )}
          {activeTab === "score" && 
            <ScoreCard 
              score={score} 
              streak={streak} 
              bestScore={bestScore} 
              setActiveTab={handleTabChange}
              resetGame={() => {
                setShownMoviesEasy([]);
                setShownMoviesHard([]);
                setGameCompleted(false);
                setScore(0);
                setStreak(0);
              }} 
            />}
          {activeTab === "test" && <ContractTestPanel />}
        </main>

        <footer className="mt-2 pt-4 flex justify-center">
          <Button
            variant="ghost"
            size="sm"
            className="text-[var(--ock-text-foreground-muted)] text-xs"
            onClick={() => openUrl("https://www.hackersdao.com/celo-farcaster-quiz-game-hackathon")}
          >
            Built on Celo for The Farcaster Quiz Game Hackathon
          </Button>
        </footer>
      </div>
    </div>
  );
}
