# Chameleon Protocol — Game Rules & Flow Specification

## 1. Core Overview

**Chameleon Protocol** is a real-time, text-based social deduction web application. All players except one (the **Chameleon**) share a secret word from a specific category. The Chameleon knows the category and sees the list of potential target words, but does not know which specific word is chosen.

Players take turns submitting single-word semantic clues to demonstrate they know the word without revealing it too blatantly to the Chameleon. The Chameleon attempts to blend in by submitting plausible clues. Afterwards, players discuss and vote on who they believe is the Chameleon.

---

## 2. Roles & Mechanics

| Role            | Count       | Knowledge                        | Objective                                                                         |
| :-------------- | :---------- | :------------------------------- | :-------------------------------------------------------------------------------- |
| **Loyal Agent** | All minus 1 | Category, Target Word, Word List | Give subtle clues; deduce and vote out the Chameleon; avoid revealing the word.   |
| **Chameleon**   | 1           | Category, Word List              | Blend in with believable clues; avoid detection; guess the Secret Word if caught. |

---

## 3. Host Game Configurations (Pre-Game Lobby)

The Host configures room parameters before starting the game:

1. **Word Pool & Category Selection:**
   - Toggle preset categories/items on or off.
   - **Custom Category Creation:** Add custom categories with at least two custom word items.
2. **Clue Rounds:** 1 or 2 clue rounds per game before discussion.
3. **Discussion Timer:** Set initial time limit (e.g., 60s, 90s, 120s).
4. **Chameleon Last Resort Guess:**
   - **ON (Default):** If caught by majority vote, the Chameleon gets one final chance to guess the secret word.
   - **OFF:** The Chameleon immediately loses if caught by majority vote.

---

## 4. Complete Phase-by-Phase Game Flow

```
[LobbyState] ➔ [CluePhaseState] ➔ [DiscussionState] ➔ [VotingState] ➔ [GameOverState]
```

### Phase 1: Lobby (`LobbyState`)

- Room creation yields a unique **6-character room code** (e.g., `X7K9P2`).
- Players join via code and set display names (4 to 8 players required).
- Host customizes categories, timer settings, rounds, and toggles.
- Host initiates the game. Host plays as an active player once launched.

### Phase 2: Role & Secret Distribution

- Backend randomly selects a Category and Target Word.
- Backend assigns 1 player as Chameleon, remaining as Loyal Agents.
- Secret payload dispatched via Socket.IO:
  - **Loyal Agents:** Category, Target Word, Full Word List.
  - **Chameleon:** Category, Full Word List (Secret Word hidden).

### Phase 3: Clue Submission (`CluePhaseState`)

- Randomized player turn order established.
- Players submit single-word clues in sequence.
- **Validation Rules:**
  - Strict single word (no spaces permitted).
  - Maximum 20 characters.
  - Real-time backend validation rejects invalid or duplicate submissions.
- Clues populate into the unified chat feed as immutable, pinned system messages.
- If configured for multiple rounds, sequence repeats for Round 2.

### Phase 4: Discussion (`DiscussionState`)

- Unified WhatsApp-style chat feed opens for free-form messaging (all prior clues remain visible at the top).
- Countdown timer runs for the set discussion duration.
- **Host Facilitator Controls:**
  - **Cut Short:** Immediately end discussion and jump to voting.
  - **Add +1 Min:** Extend discussion time on demand.

### Phase 5: Voting & Tie-Breaker (`VotingState`)

- Players cast hidden accusation votes by clicking a player profile.
- Results are tabulated synchronously on the backend.
- **Tie Policy:**
  - If top accusation votes result in a tie (e.g., 2-2 tie), the Host chooses how to proceed via Host Controls:
    1. **Redo Vote:** Immediately trigger a re-vote.
    2. **Extend Discussion:** Return to `DiscussionState` with +1 minute to resolve the tie.

### Phase 6: Game Over & Results (`GameOverState`)

- **Outcome A: Chameleon Voted Out**
  - If _Chameleon Last Resort_ is **ON**: Chameleon gets one attempt to select the secret word from the category list.
    - _Correct Guess:_ **Chameleon Wins** (Steals victory).
    - _Incorrect Guess:_ **Loyal Agents Win**.
  - If _Chameleon Last Resort_ is **OFF**: **Loyal Agents Win** immediately.
- **Outcome B: Innocent Player Voted Out or Tie Unresolved**
  - **Chameleon Wins** immediately.
- **Post-Game Summary Log:**
  - Displays concise Command-Pattern action audit summary:
    > **Game Outcome: Loyal Agents Win!**
    >
    > - James (Loyal): Clues: [Red, Hot] | Voted: Tommy
    > - Sarah (Loyal): Clues: [Spicy, Fire] | Voted: Tommy
    > - Tommy (Chameleon): Clues: [Warm, Sun] | Voted: James | Secret Word Guess: "Pepper" (Incorrect)
  - Host can click **"Return to Lobby"** to restart with the same group.
