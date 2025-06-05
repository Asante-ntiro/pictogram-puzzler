# Pictogram Puzzler

Pictogram Puzzler is an engaging game where players guess movie titles from emoji clues. Built with Next.js and MiniKit, this game challenges players to decode emoji combinations representing popular movies.

## Game Features

- **Multiple Difficulty Levels**: Choose between Easy and Hard modes
- **Scoring System**: Earn points for correct answers with double points in Hard mode
- **Visual Indicators**: Clear visual cues for different difficulty levels
- **Direct Navigation**: Jump straight to your preferred difficulty from the home screen
- **Emoji Puzzles**: Unique sets of movie puzzles for each difficulty level

## Getting Started

1. Install dependencies:
```bash
npm install
# or
yarn install
# or
pnpm install
# or
bun install
```

2. Verify environment variables, these will be set up by the `npx create-onchain --mini` command:

You can regenerate the FARCASTER Account Association environment variables by running `npx create-onchain --manifest` in your project directory.

The environment variables enable the following features:

- Frame metadata - Sets up the Frame Embed that will be shown when you cast your frame
- Account association - Allows users to add your frame to their account, enables notifications
- Redis API keys - Enable Webhooks and background notifications for your application by storing users notification details

```bash
# Shared/OnchainKit variables
NEXT_PUBLIC_ONCHAINKIT_PROJECT_NAME=
NEXT_PUBLIC_URL=
NEXT_PUBLIC_ICON_URL=
NEXT_PUBLIC_ONCHAINKIT_API_KEY=

# Frame metadata
FARCASTER_HEADER=
FARCASTER_PAYLOAD=
FARCASTER_SIGNATURE=
NEXT_PUBLIC_APP_ICON=
NEXT_PUBLIC_APP_SUBTITLE=
NEXT_PUBLIC_APP_DESCRIPTION=
NEXT_PUBLIC_APP_SPLASH_IMAGE=
NEXT_PUBLIC_SPLASH_BACKGROUND_COLOR=
NEXT_PUBLIC_APP_PRIMARY_CATEGORY=
NEXT_PUBLIC_APP_HERO_IMAGE=
NEXT_PUBLIC_APP_TAGLINE=
NEXT_PUBLIC_APP_OG_TITLE=
NEXT_PUBLIC_APP_OG_DESCRIPTION=
NEXT_PUBLIC_APP_OG_IMAGE=

# Redis config
REDIS_URL=
REDIS_TOKEN=
```

3. Start the development server:
```bash
npm run dev
```

## How to Play

1. **Select Difficulty**: Choose between Easy mode for beginners or Hard mode for a greater challenge
2. **Decode the Emoji**: Each puzzle presents a series of emojis representing a movie title
3. **Submit Your Answer**: Type your guess in the input field and submit
4. **Score Points**: Earn 10 points for each correct answer in Easy mode or 20 points in Hard mode
5. **Track Your Progress**: Watch your score grow as you solve more puzzles

## Difficulty Levels

### Easy Mode
- Standard emoji puzzles with straightforward clues
- 10 points awarded per correct answer
- Perfect for beginners or casual players

### Hard Mode
- More challenging emoji combinations
- Double points (20 per correct answer)
- Designed for puzzle enthusiasts and movie buffs

## Technical Implementation

- **React/Next.js**: Modern frontend framework for responsive UI
- **MiniKit**: Provides core UI components and styling
- **OnchainKit**: Enables frame functionality and interactions
- **State Management**: React hooks for game state and scoring
- **Responsive Design**: Optimized for both mobile and desktop play

## Future Enhancements

- Leaderboard for tracking top scores
- Additional categories beyond movies
- Time-based challenges
- Social sharing of results

## Technologies Used

- [Next.js](https://nextjs.org/docs) - React framework
- [MiniKit](https://docs.base.org/builderkits/minikit/overview) - UI components
- [OnchainKit](https://www.base.org/builders/onchainkit) - Frame functionality
- [Tailwind CSS](https://tailwindcss.com/docs) - Styling
