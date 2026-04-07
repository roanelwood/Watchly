# Watchly

Watchly is an AI-powered film tracking app for discovering movies, saving watchlists and favourites, and sharing/discussing films in groups. It is built with Expo, React Native, Firebase, and the TMDB and OpenAI APIs.

## Tech Stack

- Expo + React Native
- Expo Router (navigation)
- Firebase Auth + Firestore (user data + real-time lists)
- TMDB API (movie data)
- OpenAI API (AI search suggestions)
- Jest + React Native Testing Library (unit tests)
- GitHub Actions (CI Pipeline)
- SonarQube (Code Smells & Security)
- ESLint (Code Quality)

## Prerequisites

- Node.js and npm
- Expo CLI (optional; `npx expo` works too)
- TMDB and OpenAI API keys (for search features)

## Environment Variables

Create a `.env` file in the project root with:

```
EXPO_PUBLIC_TMDB_API_KEY=your_tmdb_key
EXPO_PUBLIC_OPENAI_API_KEY=your_openai_key
```

## Install

```
npm install
```

## Run the App

```
npm run start
```

Platform shortcuts:

```
npm run ios
npm run android
npm run web
```

## Run Tests

```
npm test
```

## Lint

```
npm run lint
```
