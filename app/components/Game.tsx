"use client";

import { useState, useCallback, useEffect } from "react";
import dynamic from "next/dynamic";
import { Button } from "./DemoComponents";

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
  // { emojis: "🦁👑", answer: "The Lion King", hint: "Disney animated classic about a young prince", difficulty: 'easy' },
  // { emojis: "🕷️👨", answer: "Spider-Man", hint: "Marvel superhero who shoots webs", difficulty: 'easy' },
  // { emojis: "❄️👸", answer: "Frozen", hint: "Let it go, let it go...", difficulty: 'easy' },
  // { emojis: "🍕🏠", answer: "Home Alone", hint: "Kevin defends his house", difficulty: 'easy' },
  // { emojis: "🚢🧊💔", answer: "Titanic", hint: "Jack and Rose's tragic love story", difficulty: 'easy' },
  { emojis: "🦈", answer: "Jaws", hint: "You're gonna need a bigger boat", difficulty: 'easy' },
  // { emojis: "🧙‍♂️💍", answer: "Lord of the Rings", hint: "One ring to rule them all", difficulty: 'easy' },
  { emojis: "🤖🚗", answer: "Transformers", hint: "Robots in disguise", difficulty: 'easy' },
  { emojis: "👻👻👻", answer: "Ghostbusters", hint: "Who you gonna call?", difficulty: 'easy' },
  // { emojis: "🎪🐘", answer: "Dumbo", hint: "Flying elephant with big ears", difficulty: 'easy' },

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
  return (
    <div className="input-section flex gap-2 mb-6">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
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
  const [feedback, setFeedback] = useState("Guess the movie from the emojis!");
  const [isGameActive, setIsGameActive] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [correctAnimation, setCorrectAnimation] = useState(false);
  const [difficulty, setDifficulty] = useState<'easy' | 'hard'>(initialDifficulty);

  // Start a new puzzle when component mounts
  useEffect(() => {
    startNewPuzzle();
  }, []);

  // Reset shown movies when difficulty changes
  useEffect(() => {
    setShownMovies([]);
  }, [difficulty]);

  // Start a new puzzle
  const startNewPuzzle = useCallback(() => {
    // Filter movies by difficulty
    const filteredMovies = movies.filter(movie => movie.difficulty === difficulty);
    
    // Filter out movies that have already been shown
    const availableMovies = filteredMovies.filter(movie => !shownMovies.includes(movie.answer));

    // If all movies have been shown, handle game completion
    if (availableMovies.length === 0) {
      setGameCompleted(true);
      setFeedback("You've completed all puzzles for this difficulty level!");
      setIsGameActive(false);
      setTimeout(() => {
        setActiveTab("score");
      }, 2000);
      return;
    }

    // Select a random movie from those not yet shown
    const randomIndex = Math.floor(Math.random() * availableMovies.length);
    selectMovie(availableMovies[randomIndex]);
  }, [difficulty, shownMovies, setShownMovies, setGameCompleted, setActiveTab]);

  // Helper function to select a movie and update state
  const selectMovie = useCallback((movie: Movie) => {
    setCurrentPuzzle(movie);
    setShownMovies([...shownMovies, movie.answer]);
    setGuess("");
    setHintsUsed(0);
    setFeedback("");
    setIsGameActive(true);
  }, [shownMovies, setShownMovies]);

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
      const pointsToAdd = (hintsUsed === 0 ? 10 : 5) * difficultyBonus;
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
              Back to Home
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
          </div>
        </div>
      </Card>
    </div>
  );
}

export default Game;