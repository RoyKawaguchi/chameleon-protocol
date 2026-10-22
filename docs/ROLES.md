# Team Role Distribution & Task Breakdown

## 1. Member A — Frontend & UI Specialist

### MVP Responsibilities

- [ ] **Landing & Room UI**

  - Build the main landing page.
  - Implement display name entry.
  - Create forms for creating and joining rooms.
  - Display the 6-character room code when a room is created.

- [ ] **Host Dashboard**

  - Build the core host control panel (visible in `LobbyState` but only for Host)
  - Allow hosts to toggle preset word categories on and off.
  - Allow hosts to enable or disable individual word items before the game starts.

- [ ] **Public Word List Component**

  - Display the full active category word list to all players in real time.
  - Ensure both Agents and the Chameleon can reference the list during turns.

- [ ] **Unified Continuous Chat & Clue Feed**

  - Build a WhatsApp-style continuous chat stream.
  - Pin submitted clues at the top as immutable system messages.
  - Provide an open text input below for discussion across game phases.

- [ ] **Voting Ballot Screen**

  - Create an interactive voting grid.
  - Allow players to select a teammate's card to cast a secret accusation vote.

- [ ] **Post-Game Audit Summary**
  - Build an end-game summary screen.
  - Display player roles, submitted clues, final votes, and the winning faction.

### Desirable Responsibilities

- [ ] **Custom Category Creator UI**

  - Build an input modal that allows hosts to create custom categories.
  - Allow hosts to add custom word items.

- [ ] **Facilitator Control Buttons**

  - Add controls for the host to end discussion early.
  - Allow the host to trigger an additional 1-minute discussion window.

- [ ] **Theme Switcher**
  - Implement a smooth Dark/Light mode toggle using Tailwind CSS.

---

## 2. Member B — Backend & State Machine Engineer

### MVP Responsibilities

- [ ] **Server & Socket.IO Core**

  - Set up the Node.js and Express server.
  - Establish real-time, bidirectional event broadcasting using Socket.IO.

- [ ] **Server-Authoritative State Machine**

  - Implement the core finite state machine for managing room and game lifecycles.
  - Support the following transitions:

    `LobbyState → CluePhaseState → DiscussionState → VotingState → GameOverState` (then return to `LobbyState`)

- [ ] **Room & Role Management Engine**

  - Implement room code generation.
  - Handle players joining and leaving rooms.
  - Randomly assign roles: 1 Chameleon versus the remaining Agents.

- [ ] **Targeted Secret Payload Distribution**

  - Ensure Agents receive both the category and secret word.
  - Ensure the Chameleon receives only the category.

- [ ] **Validated Clue Submission Engine**

  - Enforce single-word clues through backend validation.
  - Reject clues containing spaces using regex validation.
  - Enforce a maximum length of 20 characters.
  - Prevent duplicate clue submissions.

- [ ] **Voting & Tie-Breaker Logic**

  - Collect secret accusation votes.
  - Evaluate voting results against majority thresholds.
  - Automatically trigger tie-breaker revotes when necessary.

- [ ] **Command Pattern Action Logger**
  - Implement a Command pattern history queue.
  - Record player clues and votes for the post-game audit log.

### Desirable Responsibilities

- [ ] **Dynamic Custom Category Handling**

  - Update the `GameRoom` aggregate root to accept and store host-created custom categories and word lists.

- [ ] **Multi-Round Clue Loop**

  - Implement backend logic supporting multiple sequential clue submission rounds.
  - Allow the host to toggle this feature on or off.

- [ ] **Chameleon Last-Resort Guess Engine**
  - Implement a win-condition check for caught Chameleons.
  - Allow the Chameleon to submit a final text guess for the secret word to steal the game.

---

## 3. Roy — Project Lead, Testing & Integration Owner

### MVP Responsibilities

- [ ] **Monorepo & Repository Setup**

  - Initialize the root monorepo structure.
  - Separate the project into decoupled `client/` and `server/` folders.
  - Configure TypeScript and ESLint.
  - Set up Git tracking.

- [ ] **Automated Testing Suite (Jest)**

  - Write comprehensive unit tests covering:
    - Core state machine transitions.
    - Clue validation logic.
    - Tie-breaker handling.
  - Target **more than 80% test coverage**.

- [ ] **Full-Stack Integration**
  - Oversee end-to-end integration between Socket.IO events and React UI components.
  - Manage pull requests.
  - Resolve merge conflicts.
  - Ensure frontend and backend features work together correctly.

### Desirable & Extension Responsibilities

- [ ] **Custom Word Deck Export/Import**

  - Build utility scripts that allow hosts to export custom word pools as JSON files.
  - Support importing custom word pools from JSON files.

- [ ] **Audio & Visual Polish**
  - Integrate Web Audio API sound cues for phase countdowns.
  - Add sound cues for role reveals.

---
