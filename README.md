# Chameleon Protocol

A lightweight, real-time multiplayer web application centered on word association and social deduction mechanics.

## Team Members

- Alex
- Devona
- Roy

## Tech Stack

- **Frontend:** React, TypeScript, Tailwind CSS, Vite, Socket.IO Client
- **Backend:** Node.js, Express, Socket.IO, TypeScript
- **Testing:** Jest and ts-jest

## Project Architecture

- `/client` — Frontend user interface and Socket.IO client
- `/server` — Backend server, game models, state machine, and Socket.IO connections
- `/server/src/models` — Game entities such as `GameRoom` and `Player`
- `/server/src/states` — Game state definitions and transition behavior
- `/server/src/tests` — Backend unit tests

## Prerequisites

Install the following before starting:

- Node.js 24 LTS
- npm (included with Node.js)

Then, verify your installation:

```bash
node -v
npm -v
```
## Unfinished features, known issues, and to be implemented
- Chat feature in Discussion state (unfinished)
- Countdown Timer not visibly counting down (known issue)
- Round number config doesn't update (known issue)
- Chameleon Last Chance (to be implemented)

> **Note:** Use Node.js 24 for this project to keep the team's development environment consistent.

## Getting Started

### 1. Clone the Repository

```bash
git clone <https://github.com/RoyKawaguchi/chameleon-protocol>
cd chameleon-protocol
```

### 2. Install Dependencies

From the project root, run:

```bash
npm run setup
```

This installs the dependencies for both the frontend and backend using their respective `package-lock.json` files.

You only need to run this again when setting up a fresh environment or after dependency changes.

### 3. Start the Backend

Open a terminal at the project root:

```bash
cd server
npm run dev
```

The backend should run at localhost 3000.

### 4. Start the Frontend

Open a second terminal at the project root:

```bash
cd client
npm run dev
```

Open the URL (shown by the terminal) in your browser to view the page.

### 5. Run the Backend Tests

From the project root:

```bash
cd server
npm test
```

### 6. Build the Frontend

From the project root:

```bash
cd client
npm run build
```

## Useful Commands

| Command                      | Purpose                                              |
| ---------------------------- | ---------------------------------------------------- |
| `npm run setup`              | Install client and server dependencies from the root |
| `cd client && npm run dev`   | Start the frontend development server                |
| `cd server && npm run dev`   | Start the backend development server                 |
| `cd server && npm test`      | Run backend tests                                    |
| `cd client && npm run build` | Type-check and build the frontend                    |
