"use client";

import { useState, useCallback, useEffect } from "react";
import dynamic from "next/dynamic";
import { Button } from "./DemoComponents";
import { useAccount, useConnect, useDisconnect, usePublicClient, useWriteContract } from 'wagmi';
import { PictogramAchievementABI } from "../services/contracts";

// Remove later
const CONTRACT_ADDRESS = '0xC597FCf9C877943775bE9bb7EEf83DbBEd88A650' as const;


const Confetti = dynamic(() => import("react-confetti"), {
  ssr: false,
});

// Types
type Movie = {
  emojis: string;
  answer: string;
  hint: string;
  difficulty: 'easy' | 'hard';
};

type GameProps = {
  setActiveTab: (tab: string) => void;
  className?: string;
  initialDifficulty?: 'easy' | 'hard';
  score: number;
  setScore: (score: number) => void;
  streak: number;
  setStreak: (streak: number) => void;
  gameCompleted: boolean;
  setGameCompleted: (gameCompleted: boolean) => void;
  shownMovies: string[];
  setShownMovies: (movies: string[]) => void;
};

type CardProps = {
  title?: string;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
};

type EmojiDisplayProps = {
  emojis: string;
  isCorrect: boolean;
};

type ScoreDisplayProps = {
  score: number;
  streak: number;
};

type FeedbackProps = {
  message: string;
};

type GameControlsProps = {
  isGameActive: boolean;
  onShowHint: () => void;
  onSkip: () => void;
  onStartNewGame?: () => void;
  currentPuzzle: Movie | null;
};

type GuessInputProps = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  disabled: boolean;
};

// Data
const movies: Movie[] = [
  { emojis: "🦁👑", answer: "The Lion King", hint: "Disney animated classic about a young prince", difficulty: 'easy' },
  { emojis: "🕷️👨", answer: "Spider-Man", hint: "Marvel superhero who shoots webs", difficulty: 'easy' },
  { emojis: "❄️👸", answer: "Frozen", hint: "Let it go, let it go...", difficulty: 'easy' },
  { emojis: "🍕🏠", answer: "Home Alone", hint: "Kevin defends his house", difficulty: 'easy' },
  { emojis: "🚢🧊💔", answer: "Titanic", hint: "Jack and Rose's tragic love story", difficulty: 'easy' },
  { emojis: "🦈", answer: "Jaws", hint: "You're gonna need a bigger boat", difficulty: 'easy' },
  { emojis: "🧙‍♂️💍", answer: "Lord of the Rings", hint: "One ring to rule them all", difficulty: 'easy' },
  { emojis: "🤖🚗", answer: "Transformers", hint: "Robots in disguise", difficulty: 'easy' },
  { emojis: "👻👻👻", answer: "Ghostbusters", hint: "Who you gonna call?", difficulty: 'easy' },
  { emojis: "🎪🐘", answer: "Dumbo", hint: "Flying elephant with big ears", difficulty: 'easy' },

  { emojis: "🔴💊🐰🕳️", answer: "The Matrix", hint: "Red pill or blue pill?", difficulty:'hard' },
  { emojis: "🧠🐑🍷", answer: "Silence of the Lambs", hint: "A young FBI trainee seeks help from Hannibal Lecter", difficulty:'hard' },
  { emojis: "🌪️🏠🌈", answer: "The Wizard of Oz", hint: "Follow the yellow brick road", difficulty:'hard' },
  { emojis: "🎭😂😢", answer: "The Dark Knight", hint: "Why so serious?", difficulty:'hard' },
  { emojis: "🍫🏭🎫", answer: "Charlie and the Chocolate Factory", hint: "Golden ticket winner tours Wonka's factory", difficulty:'hard' },
  { emojis: "🕐🕑🕒🔁", answer: "Groundhog Day", hint: "Phil relives the same day over and over", difficulty:'hard' },
  { emojis: "🚁🌴☠️", answer: "Apocalypse Now", hint: "Vietnam War epic with 'the horror, the horror", difficulty:'hard' },
  { emojis: "🎹🌧️💔", answer: "Casablanca", hint: "Play it again, Sam", difficulty:'hard' },
  { emojis: "🔪🚿🏨", answer: "Psycho", hint: "Norman Bates runs a motel", difficulty:'hard' },
  { emojis: "🌅🌄🔁", answer: "Edge of Tomorrow", hint: "Tom Cruise relives an alien invasion", difficulty:'hard' },
  { emojis: "🍑🏃‍♂️📦", answer: "Forrest Gump", hint: "Life is like a box of chocolates", difficulty:'hard' },
  { emojis: "🎪🎭🃏", answer: "The Greatest Showman", hint: "P.T. Barnum's circus spectacle", difficulty:'hard' },
  { emojis: "🔬👨‍🔬💚", answer: "The Incredible Hulk", hint: "You wouldn't like me when I'm angry", difficulty:'hard' },
  { emojis: "🌊🏄‍♂️🦈", answer: "Point Break", hint: "FBI agent goes undercover with surfers", difficulty:'hard' },
  { emojis: "🗝️🚪👁️", answer: "The Sixth Sense", hint: "I see dead people", difficulty:'hard' }
];

// Components
function Card({
  title,
  children,
  className = "",
  onClick,
}: CardProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (onClick && (e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <div
      className={`bg-[var(--app-card-bg)] backdrop-blur-md rounded-xl shadow-lg border border-[var(--app-card-border)] overflow-hidden transition-all hover:shadow-xl ${className} ${onClick ? "cursor-pointer" : ""}`}
      onClick={onClick}
      onKeyDown={onClick ? handleKeyDown : undefined}
      tabIndex={onClick ? 0 : undefined}
      role={onClick ? "button" : undefined}
    >
      {title && (
        <div className="px-5 py-3 border-b border-[var(--app-card-border)]">
          <h3 className="text-lg font-medium text-[var(--app-foreground)]">
            {title}
          </h3>
        </div>
      )}
      <div className="p-5">{children}</div>
    </div>
  );
}

function EmojiDisplay({ emojis, isCorrect }: EmojiDisplayProps) {
  return (
    <div className={`emoji-display text-7xl mb-6 text-center transition-all ${isCorrect ? 'emoji-correct scale-125' : ''}`}>
      {emojis}
    </div>
  );
}

function ScoreDisplay({ score, streak }: ScoreDisplayProps) {
  return (
    <div className="score-display flex justify-center gap-8 mb-6">
      <div className="score-item flex items-center gap-2">
        <span className="text-2xl">🏆</span>
        <div>
          <div className="text-sm text-[var(--app-foreground-muted)]">Score</div>
          <div className="font-bold text-xl text-[var(--app-foreground)]">{score}</div>
        </div>
      </div>
      <div className="score-item flex items-center gap-2">
        <span className="text-2xl">🔥</span>
        <div>
          <div className="text-sm text-[var(--app-foreground-muted)]">Streak</div>
          <div className="font-bold text-xl text-[var(--app-foreground)]">{streak}</div>
        </div>
      </div>
    </div>
  );
}

function Feedback({ message }: FeedbackProps) {
  if (!message) return null;
  
  return (
    <div className="feedback-section mb-4">
      <p className="feedback text-center text-[var(--app-foreground-muted)]">
        {message}
      </p>
    </div>
  );
}

function GuessInput({ value, onChange, onSubmit, disabled }: GuessInputProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !disabled) {
      onSubmit();
    }
  };

  return (
    <div className="input-section flex gap-2 mb-6">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Enter your guess..."
        disabled={disabled}
        className="guess-input flex-grow px-4 py-2 rounded-lg border border-[var(--app-card-border)] bg-[var(--app-background)] text-[var(--app-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--app-accent)]"
      />
      <Button
        onClick={onSubmit}
        disabled={disabled}
      >
        Submit
      </Button>
    </div>
  );
}

function GameControls({ isGameActive, onShowHint, onSkip, onStartNewGame, currentPuzzle }: GameControlsProps) {
  return (
    <div className="button-group flex justify-center gap-3">
      {!isGameActive && !currentPuzzle && (
        <Button
          onClick={onStartNewGame}
          variant="primary"
        >
          Start Game
        </Button>
      )}

      <Button
        onClick={onShowHint}
        disabled={!isGameActive}
        variant="secondary"
      >
        Show Hint
      </Button>
      <Button
        onClick={onSkip}
        disabled={!isGameActive}
        variant="outline"
      >
        Skip
      </Button>
    </div>
  );
}

export function Game({ 
  setActiveTab, 
  className = "", 
  initialDifficulty = 'easy',
  score,
  setScore,
  streak,
  setStreak,
  gameCompleted,
  setGameCompleted,
  shownMovies,
  setShownMovies
}: GameProps) {
  const [hintsUsed, setHintsUsed] = useState(0);
  const [currentPuzzle, setCurrentPuzzle] = useState<Movie | null>(null);
  const [guess, setGuess] = useState("");
  const [feedback, setFeedback] = useState("Guess the movie from the pictogram. You have 6 attempts. You&apos;ll get a score based on how many attempts it takes and how many hints you use.");
  const [isGameActive, setIsGameActive] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [correctAnimation, setCorrectAnimation] = useState(false);
  const [difficulty, setDifficulty] = useState<'easy' | 'hard'>(initialDifficulty);
  const [availableMovies, setAvailableMovies] = useState<Movie[]>([]);

  // Initialize available movies when component mounts or difficulty changes
  useEffect(() => {
    // Filter movies by difficulty
    const filteredMovies = movies.filter(movie => movie.difficulty === difficulty);
    
    // Filter out movies that have already been shown
    const moviesNotShown = filteredMovies.filter(movie => !shownMovies.includes(movie.answer));
    
    // Shuffle the available movies
    const shuffledMovies = [...moviesNotShown].sort(() => Math.random() - 0.5);
    
    setAvailableMovies(shuffledMovies);
  }, [difficulty, shownMovies]);

  // Start a new puzzle when component mounts
  useEffect(() => {
    if (availableMovies.length > 0 && !currentPuzzle) {
      startNewPuzzle();
    }
  }, [currentPuzzle, availableMovies]);

  // Start a new puzzle
  const startNewPuzzle = useCallback(() => {
    if (availableMovies.length === 0) {
      setGameCompleted(true);
      setFeedback("You've completed all puzzles for this difficulty level!");
      setIsGameActive(false);
      setTimeout(() => {
        setActiveTab("score");
      }, 2000);
      return;
    }

    // Take the first movie from the available list
    const nextMovie = availableMovies[0];
    
    // Remove this movie from available movies
    setAvailableMovies(prev => prev.slice(1));
    
    // Add to shown movies
    setShownMovies([...shownMovies, nextMovie.answer]);
    
    // Set as current puzzle
    setCurrentPuzzle(nextMovie);
    setGuess("");
    setHintsUsed(0);
    setFeedback("");
    setIsGameActive(true);
  }, [availableMovies, shownMovies, setShownMovies, setGameCompleted, setActiveTab]);

  const checkAnswer = useCallback(() => {
    if (!currentPuzzle || !guess.trim() || gameCompleted) {
      setFeedback("Please enter your guess!");
      return;
    }

    const normalizedGuess = guess.trim().toLowerCase();
    const normalizedAnswer = currentPuzzle.answer.toLowerCase();

    if (
      normalizedGuess === normalizedAnswer ||
      normalizedGuess.replace(/[^a-z0-9]/g, "") === normalizedAnswer.replace(/[^a-z0-9]/g, "")
    ) {
      setFeedback(`🎉 Correct! It was "${currentPuzzle.answer}"`);
      setShowConfetti(true);
      setCorrectAnimation(true);
      // Load next puzzle after a short delay
      setTimeout(() => {
        setShowConfetti(false);
        setCorrectAnimation(false);
        startNewPuzzle();
      }, 2000);
      // Award more points for hard difficulty
      const difficultyBonus = difficulty === 'hard' ? 2 : 1;
      const pointsToAdd = (hintsUsed === 0 ? 100 : 50) * difficultyBonus;
      setScore(score + pointsToAdd);
      setStreak(streak + 1);
      setIsGameActive(false);
    } else {
      setFeedback("❌ Not quite right. Try again!");
      setStreak(0);
    }
  }, [currentPuzzle, guess, hintsUsed, difficulty, gameCompleted]);

  const showHint = useCallback(() => {
    if (currentPuzzle) {
      setFeedback(`💡 Hint: ${currentPuzzle.hint}`);
      setHintsUsed(prev => prev + 1);
    }
  }, [currentPuzzle]);

  const skipPuzzle = useCallback(() => {
    if (currentPuzzle) {
      setFeedback(`⏭️ The answer was: "${currentPuzzle.answer}"`);
      setStreak(0);
      // Load next puzzle after a short delay
      setTimeout(() => {
        startNewPuzzle();
      }, 1500);
    }
  }, [currentPuzzle]);

  return (
    <div className={`space-y-6 animate-fade-in ${className}`}>
      {showConfetti && (
        <Confetti
          width={window.innerWidth}
          height={window.innerHeight}
          recycle={false}
          numberOfPieces={200}
          gravity={0.3}
        />
      )}
      
      <Card title="Guess The Movie!">
        {gameCompleted && (
          <div className="game-completed-banner p-3 bg-green-100 text-green-800 rounded-lg mb-4 text-center">
            Game Completed! View your final score or try another difficulty.
          </div>
        )}
        <div className="text-center mb-4">
          <p className="text-[var(--app-foreground-muted)] mb-6">
            Can you decode the movie title from these emojis?
          </p>
          <div className="flex items-center">
            <span className="text-sm mr-2 text-[var(--app-foreground-muted)]">Difficulty:</span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => {
                const newDifficulty = difficulty === 'easy' ? 'hard' : 'easy';
                setDifficulty(newDifficulty);
                setCurrentPuzzle(null);
                setIsGameActive(false);
                setGameCompleted(false);
                setFeedback(`Switched to ${newDifficulty} mode. ${newDifficulty === 'hard' ? 'Double points!' : 'Standard points.'}`);
              }}
              className={`${difficulty === 'hard' ? 'bg-red-100 hover:bg-red-200' : 'bg-green-100 hover:bg-green-200'}`}
            >
              {difficulty === 'easy' ? 'Easy 😊' : 'Hard 😰'}
            </Button>
          </div>
          <ScoreDisplay score={score} streak={streak} />
          
          {currentPuzzle && (
            <EmojiDisplay 
              emojis={currentPuzzle.emojis} 
              isCorrect={correctAnimation} 
            />
          )}

          <GuessInput 
            value={guess}
            onChange={setGuess}
            onSubmit={checkAnswer}
            disabled={!isGameActive}
          />

          <Feedback message={feedback} />

          <div className="mt-6">
            <GameControls 
              isGameActive={isGameActive}
              onShowHint={showHint}
              onSkip={skipPuzzle}
              onStartNewGame={startNewPuzzle}
              currentPuzzle={currentPuzzle}
            />
          </div>
        </div>
        
        <div className="border-t border-[var(--app-card-border)] mt-6 pt-4">
          <Button variant="outline" onClick={() => setActiveTab("home")}>
            Back to Home
          </Button>
        </div>
      </Card>
    </div>
  );
}

type ScoreCardProps = {
  score: number;
  streak: number;
  bestScore?: number;
  setActiveTab?: (tab: string) => void;
  resetGame?: () => void;
};

export function ScoreCard({ score, streak, bestScore, setActiveTab, resetGame }: ScoreCardProps) {
  // Get current difficulty from local storage or default to 'easy'
  const [difficulty, setDifficulty] = useState<string>('easy');
  // Get shownMovies from local storage or initialize as empty array
  const [shownMovies, setShownMovies] = useState<string[]>([]);
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedDifficulty = localStorage.getItem('pictogramPuzzlerDifficulty');
      if (storedDifficulty) {
        setDifficulty(storedDifficulty);
      }
      
      const storedMovies = localStorage.getItem('pictogramPuzzlerShownMovies');
      if (storedMovies) {
        setShownMovies(JSON.parse(storedMovies));
      }
    }
  }, []);
  return (
    <div className="space-y-6 animate-fade-in">
      <Card title="Your Stats 🏆">
        <div className="flex flex-col space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-[var(--app-foreground-muted)]">Current Score:</span>
            <span className="text-xl font-bold">{score}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[var(--app-foreground-muted)]">Current Streak:</span>
            <span className="text-xl font-bold text-orange-500">{streak}🔥</span>
          </div>
          {bestScore !== undefined && (
            <div className="flex justify-between items-center">
              <span className="text-[var(--app-foreground-muted)]">Best Score:</span>
              <span className="text-xl font-bold text-purple-500">{bestScore}✨</span>
            </div>
          )}
          
          <div className="flex flex-col items-center mt-6 space-y-3">
            <Button 
              variant="primary" 
              onClick={() => setActiveTab && setActiveTab("home")}
              className="mt-4"
            >
              Go back home
            </Button>
            
            {resetGame && (
              <Button 
                variant="secondary" 
                onClick={resetGame}
                className=""
              >
                Reset Game Progress
              </Button>
            )}
            <span className="text-[var(--app-foreground-muted)]">🏆 Connect your wallet to mint your achievement as an NFT!</span>
            <div>
              <WalletConnectButton score={score} difficulty={difficulty} puzzlesSolved={shownMovies.length} streak={streak} />
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}



// Types
type WalletConnectButtonProps = {
  score: number;
  difficulty: string;
  puzzlesSolved: number;
  streak: number;
};

type Achievement = {
  tokenId: bigint;
  score: bigint;
  difficulty: string;
  puzzlesSolved: bigint;
  streak: bigint;
  timestamp: bigint;
  tier: number;
};

// Enum for achievement tiers matching the contract
export enum Tier {
  BRONZE = 0,
  SILVER = 1,
  GOLD = 2
}



// Tier thresholds - move to a config file
const TIER_THRESHOLDS = {
  BRONZE: 100,
  SILVER: 500,
  GOLD: 1000
};

function WalletConnectButton({ score, difficulty, puzzlesSolved, streak }: WalletConnectButtonProps) {
  const { address, isConnected } = useAccount();
  const { connect, connectors, error: connectError } = useConnect();
  const { disconnect } = useDisconnect();
  const publicClient = usePublicClient();
  
  const { writeContract, isPending, error: writeError } = useWriteContract();
  
  // State management
  const [mintSuccess, setMintSuccess] = useState(false);
  const [mintError, setMintError] = useState('');
  const [ownedAchievements, setOwnedAchievements] = useState<Achievement[]>([]);
  const [showAchievements, setShowAchievements] = useState(false);
  const [isLoadingAchievements, setIsLoadingAchievements] = useState(false);

  // Reset states when wallet disconnects
  useEffect(() => {
    if (!isConnected) {
      setMintSuccess(false);
      setMintError('');
      setOwnedAchievements([]);
      setShowAchievements(false);
    }
  }, [isConnected]);

  // Handle wallet connection with error handling
  const handleConnect = useCallback(async () => {
    try {
      if (connectors.length === 0) {
        setMintError('No wallet connectors available');
        return;
      }

      // Try to connect with the first available connector
      const connector = connectors[0];
      console.log('Connecting with connector:', {
        name: connector.name,
        type: connector.type,
        id: connector.id
      });
      
      await connect({ connector });
    } catch (error) {
      console.error('Wallet connection error:', error);
      setMintError('Failed to connect wallet');
    }
  }, [connect, connectors]);

  // Fetch user's NFT achievements with error handling and loading state
  const fetchOwnedAchievements = useCallback(async () => {
    if (!isConnected || !address || !publicClient) return;
    
    setIsLoadingAchievements(true);
    try {
      // Get balance of NFTs owned by user
      const balance = await publicClient.readContract({
        address: CONTRACT_ADDRESS,
        abi: PictogramAchievementABI,
        functionName: 'balanceOf',
        args: [address]
      }) as bigint;

      const achievements: Achievement[] = [];
      
      // Fetch each NFT's data
      for (let i = 0; i < Number(balance); i++) {
        try {
          const tokenId = await publicClient.readContract({
            address: CONTRACT_ADDRESS,
            abi: PictogramAchievementABI,
            functionName: 'tokenOfOwnerByIndex',
            args: [address, BigInt(i)]
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
        } catch (tokenError) {
          console.error(`Error fetching token ${i}:`, tokenError);
          // Continue with other tokens even if one fails
        }
      }
      
      // Sort achievements by timestamp (newest first)
      achievements.sort((a, b) => Number(b.timestamp) - Number(a.timestamp));
      setOwnedAchievements(achievements);
    } catch (error) {
      console.error('Error fetching achievements:', error);
      setMintError('Failed to load achievements');
    } finally {
      setIsLoadingAchievements(false);
    }
  }, [isConnected, address, publicClient]);

  // Fetch achievements when wallet connects or after successful mint
  useEffect(() => {
    if (isConnected && address) {
      fetchOwnedAchievements();
    }
  }, [isConnected, address, mintSuccess, fetchOwnedAchievements]);

  // Mint NFT achievement with improved error handling
  const mintAchievement = useCallback(async () => {
    if (!isConnected || !address) {
      setMintError('Wallet not connected');
      return;
    }
    
    try {
      setMintError('');
      setMintSuccess(false);
      
      writeContract(
        {
          address: CONTRACT_ADDRESS,
          abi: PictogramAchievementABI,
          functionName: 'mintAchievement',
          args: [address, BigInt(score), difficulty, BigInt(puzzlesSolved), BigInt(streak)]
        },
        {
          onSuccess: (hash) => {
            console.log('Transaction successful:', hash);
            setMintSuccess(true);
            setShowAchievements(true);
            // fetchOwnedAchievements will be called via useEffect when mintSuccess changes
          },
          onError: (error) => {
            console.error('Transaction failed:', error);
            setMintError(error.message || 'Failed to mint achievement NFT');
          }
        }
      );
    } catch (error) {
      console.error('Error initiating mint:', error);
      setMintError(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, [isConnected, address, score, difficulty, puzzlesSolved, streak, writeContract]);

  // Get tier name from tier number
  const getTierName = useCallback((tier: number): string => {
    switch (tier) {
      case Tier.BRONZE: return "Bronze";
      case Tier.SILVER: return "Silver";
      case Tier.GOLD: return "Gold";
      default: return "Unknown";
    }
  }, []);

  // Get tier emoji for visual appeal
  const getTierEmoji = useCallback((tier: number): string => {
    switch (tier) {
      case Tier.BRONZE: return "🥉";
      case Tier.SILVER: return "🥈";
      case Tier.GOLD: return "🥇";
      default: return "🏆";
    }
  }, []);

  // Determine which tier current score qualifies for
  const getScoreTier = useCallback((currentScore: number): Tier | null => {
    if (currentScore >= TIER_THRESHOLDS.GOLD) {
      return Tier.GOLD;
    } else if (currentScore >= TIER_THRESHOLDS.SILVER) {
      return Tier.SILVER;
    } else if (currentScore >= TIER_THRESHOLDS.BRONZE) {
      return Tier.BRONZE;
    }
    return null;
  }, []);

  // Format address for display
  const formatAddress = useCallback((addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  }, []);

  // Current tier for user's score
  const currentTier = getScoreTier(score);

  return (
    <div className="flex flex-col items-center space-y-4">
      {!isConnected ? (
        <div className="flex flex-col items-center space-y-2 w-full">
          <Button 
            variant="primary" 
            onClick={handleConnect}
            className="w-full"
            disabled={connectors.length === 0}
          >
            {connectors.length === 0 ? 'No Wallet Available' : 'Connect Wallet'}
          </Button>
          {connectError && (
            <div className="text-red-500 text-sm text-center">
              Connection failed: {connectError.message}
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center space-y-3 w-full">
          {/* Wallet Info */}
          <div className="flex items-center justify-between w-full bg-gray-100 dark:bg-gray-800 px-4 py-2 rounded-md">
            <span className="truncate max-w-[150px] font-mono text-sm">
              {formatAddress(address!)}
            </span>
            <Button 
              variant="secondary" 
              onClick={() => disconnect()}
              className="text-sm"
            >
              Disconnect
            </Button>
          </div>
          
          {/* Score Tier Info */}
          {currentTier !== null && (
            <div className="text-center bg-blue-50 dark:bg-blue-900/20 px-3 py-2 rounded-md w-full">
              <div className="text-sm text-blue-600 dark:text-blue-400">
                Current Score: {score} ({getTierName(currentTier)} {getTierEmoji(currentTier)})
              </div>
            </div>
          )}
          
          {/* Mint Button */}
          {!mintSuccess ? (
            <Button 
              variant="primary" 
              onClick={mintAchievement} 
              disabled={isPending || currentTier === null}
              className="w-full"
            >
              {isPending 
                ? 'Minting...' 
                : currentTier === null 
                  ? `Score too low (min ${TIER_THRESHOLDS.BRONZE})` 
                  : 'Mint Achievement NFT'
              }
            </Button>
          ) : (
            <div className="text-green-500 font-medium text-center w-full">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <span>Achievement NFT minted successfully!</span>
                <span>🎉</span>
              </div>
              <Button
                variant="secondary"
                onClick={() => setShowAchievements(!showAchievements)}
                className="w-full"
              >
                {showAchievements ? 'Hide' : 'Show'} My Achievements
              </Button>
            </div>
          )}
          
          {/* Error Display */}
          {(mintError || writeError) && (
            <div className="text-red-500 text-sm text-center bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-md w-full">
              {mintError || writeError?.message}
            </div>
          )}

          {/* Achievements Display */}
          {showAchievements && (
            <div className="w-full mt-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold">Your Achievements</h3>
                {isLoadingAchievements && (
                  <div className="text-sm text-gray-500">Loading...</div>
                )}
              </div>
              
              {ownedAchievements.length > 0 ? (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {ownedAchievements.map((achievement) => (
                    <div key={achievement.tokenId.toString()} className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 p-3 rounded-md border">
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-semibold flex items-center space-x-2">
                          <span>{getTierEmoji(achievement.tier)}</span>
                          <span>{getTierName(achievement.tier)} Achievement</span>
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          #{achievement.tokenId.toString()}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <div>Score: {achievement.score.toString()}</div>
                        <div>Difficulty: {achievement.difficulty}</div>
                        <div>Puzzles: {achievement.puzzlesSolved.toString()}</div>
                        <div>Streak: {achievement.streak.toString()}</div>
                        <div className="col-span-2 text-xs">
                          {new Date(Number(achievement.timestamp) * 1000).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-500 py-4">
                  {isLoadingAchievements 
                    ? "Loading achievements..." 
                    : "You don't have any achievement NFTs yet."
                  }
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Utility functions that can be used elsewhere in your app
export const getTokenURI = async (
  tokenId: bigint, 
  publicClient: any
): Promise<string | null> => {
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
};

export const getTotalSupply = async (publicClient: any): Promise<bigint> => {
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
};

export default WalletConnectButton;