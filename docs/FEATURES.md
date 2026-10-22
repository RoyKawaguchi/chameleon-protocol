# Chameleon Protocol — Feature Tiering & Requirements

This document classifies all system features into three execution tiers: **MVP (Minimum Viable Product)**, **Desirable End Product**, and **Future Extensions**.

---

## Tier 1: Minimum Viable Product (MVP)

The essential core game loop required to launch a fully functioning, playable real-time web application.

### A. System Architecture

1. **Monorepo Structure:** One root working space with `client/` (React/Tailwind) and `server/` (Node/Express/Socket.IO) directories.
2. **Real-Time WebSocket Sync:** Low-latency bi-directional event broadcasting via Socket.IO.
3. **Automated Unit Testing:** Comprehensive Jest test suites targeting core game rules, state transitions, tie-breakers, and validation logic.

### B. Lobby & Room Management

4. **Room Creation & Joining:** Host generates a 6-character room code; players join using custom display names.
5. **Host Configuration Dashboard:** Host toggles preset word categories and individual word items on or off prior to launch.
6. **Host-to-Player Seamless Transition:** Host automatically transitions into an active player upon game start.

### C. Core Game Logic & Rules Engine

7. **Server-Authoritative State Machine:** Backend finite state machine managing room lifecycles (`LobbyState` ➔ `CluePhaseState` ➔ `DiscussionState` ➔ `VotingState` ➔ `GameOverState`).
8. **Role & Secret Assignment:** Random assignment of 1 Chameleon vs. Loyal Agents with targeted private Socket.IO payload distribution (category + secret word to Agents; category only to Chameleon).
9. **Public Category Word List:** In-game UI component displaying the full active category word list to all players (helping Agents construct strategic clues and giving the Chameleon a deductive sandbox).
10. **Validated Clue Submission:** Turn-based single-word clue entry enforced by backend validation (no spaces, max 20 characters, duplicate prevention).
11. **Unified Continuous Chat:** WhatsApp-style chat stream keeping submitted clues pinned at the top while allowing open text communication.

### D. Voting & Match Resolution

12. **Secret Voting Ballot:** Simultaneous player voting phase to accuse suspects.
13. **Tie-Breaker Revote Handling:** Mandatory backend tie-breaker mechanism triggering an automatic re-vote if accusation votes are tied.
14. **Command Pattern Action Audit Log:** Concise _Among Us_-style summary screen displaying player roles, submitted clues, final votes, and the winning faction.

---

## Tier 2: Desirable End Product

Features that add facilitator control, deep customization, and enhanced gameplay flexibility once the core MVP loop is stable.

### A. Host Facilitator Controls

15. **Custom Category Injection:** Host ability to dynamically create custom categories and input custom word items (minimum 2 items) before starting.
16. **Discussion Facilitator Overrides:** Host UI controls to either cut discussion short immediately or add an extra 1-minute discussion window before voting.
17. **Advanced Tie-Breaker Flexibility:** Host control option to grant an extra 1-minute discussion window on a tie before triggering a revote.

### B. Advanced Mechanics & Game Toggles

18. **Multi-Round Clues Toggle:** Host setting to configure the number of sequential clue rounds before transitioning to discussion.
19. **Chameleon Last-Resort Guess (Host Toggle):** Optional mechanic allowing a caught Chameleon one final chance to guess the secret word to steal a win (on by default, can be toggled off for immediate defeat).

---

## Tier 3: Future Extensions

Optional polish, aesthetics, and portability enhancements to showcase beyond the course requirements.

20. **Custom Word Deck Export/Import:** Ability for hosts to export and import custom category word lists as `.json` files to share with other player groups.
21. **Audio & Visual Polish:** Web Audio API sound cues for phase countdown timers, turn transitions, voting alerts, and dramatic role reveal animations.
22. **Theme Switcher:** Quick Dark/Light mode theme toggle using Tailwind CSS styling.
