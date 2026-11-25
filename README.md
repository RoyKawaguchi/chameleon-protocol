# Chameleon Protocol

Multiplayer web game for word association and social deduction.

## Team

- Alex
- Devona
- Roy

## Stack

- **Client:** React, TypeScript, Tailwind CSS, Vite, Socket.IO Client
- **Server:** Node.js, Express, Socket.IO, TypeScript
- **Tests:** Jest, ts-jest

## File Structure

text

```text
chameleon-protocol/
├── client/
│   └── src/
│       ├── App.css
│       ├── App.tsx
│       ├── assets/
│       │   ├── hero.png
│       │   ├── react.svg
│       │   └── vite.svg
│       ├── components/
│       │   ├── CluePhaseView.tsx
│       │   ├── DiscussionView.tsx
│       │   ├── GameOverView.tsx
│       │   ├── LobbyView.tsx
│       │   ├── LoginForm.tsx
│       │   └── VotingView.tsx
│       ├── index.css
│       ├── main.tsx
│       ├── models/
│       │   └── types.ts
│       └── services/
│           └── socket.ts
└── server/
    └── src/
        ├── game/
        │   ├── GameRoom.ts
        │   └── states/
        │       ├── CluePhaseState.ts
        │       ├── DiscussionState.ts
        │       ├── GameOverState.ts
        │       ├── GameState.ts
        │       ├── LobbyState.ts
        │       └── VotingState.ts
        ├── models/
        │   ├── Message.ts
        │   ├── Player.ts
        │   └── types.ts
        ├── server.ts
        └── tests/
            ├── Testing.ts
            ├── example.test.ts
            ├── gameroom.test.ts
            └── gamestate.test.ts
```

### File Descriptions

- `client/src/App.tsx`: Root view and socket event handler.
- `client/src/components/`: UI screens for login, lobby, clues, discussion, voting, and game over.
- `client/src/models/types.ts`: Client type definitions.
- `client/src/services/socket.ts`: Socket.IO client setup.
- `server/src/server.ts`: Express and Socket.IO server entry point.
- `server/src/game/GameRoom.ts`: Room state, players, and game loop coordinator.
- `server/src/game/states/`: State classes for each game phase.
- `server/src/models/`: Data models for players, messages, and types.
- `server/src/tests/`: Jest unit tests.

## Installation

Install Git, Node.js 24 LTS, and npm.

No `.env` file is needed.

### Check Versions

bash

```bash
node -v
npm -v
```

### Clone the Repository

bash

```bash
git clone https://github.com/RoyKawaguchi/chameleon-protocol
cd chameleon-protocol
```

### Install Dependencies

Install dependencies from the root:

bash

```bash
npm run setup
```

## Running

### Start the Server

Start the server on `localhost:4000`:

bash

```bash
cd server
npm run dev
```

### Start the Client

Start the client in a second terminal:

bash

```bash
cd client
npm run dev
```

Open the URL from the client terminal in a browser.

## Commands

| Command                      | Action                                 |
| ---------------------------- | -------------------------------------- |
| `npm run setup`              | Install client and server dependencies |
| `cd server && npm run dev`   | Run server on port 4000                |
| `cd client && npm run dev`   | Run client dev server                  |
| `cd server && npm test`      | Run server tests                       |
| `cd client && npm run build` | Build client                           |
