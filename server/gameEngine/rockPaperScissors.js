export function createRPSState() {
  return {
    gameType: 'rockPaperScissors',
    gameName: 'Rock-Paper-Scissors',
    maxScore: 3,
    scores: { p1: 0, p2: 0 },
    choices: { p1: null, p2: null },
    lastRound: null, // { p1Choice, p2Choice, winner: 'p1' | 'p2' | 'draw' }
    history: [],
    status: 'playing', // 'playing' | 'round_over' | 'finished'
    winner: null,
    isDraw: false
  };
}

export function handleRPSMove(state, playerIndex, move) {
  // move = { choice: 'rock' | 'paper' | 'scissors' }
  if (state.status === 'finished') return { valid: false, reason: 'Game is finished' };
  
  const pKey = playerIndex === 0 ? 'p1' : 'p2';
  const validChoices = ['rock', 'paper', 'scissors'];

  if (!validChoices.includes(move.choice)) {
    return { valid: false, reason: 'Invalid choice' };
  }

  if (state.choices[pKey] !== null) {
    return { valid: false, reason: 'Choice already locked in for this round' };
  }

  // Record choice
  state.choices[pKey] = move.choice;

  // Check if both players have chosen
  if (state.choices.p1 && state.choices.p2) {
    const c1 = state.choices.p1;
    const c2 = state.choices.p2;

    let roundWinner = 'draw';
    if (c1 === c2) {
      roundWinner = 'draw';
    } else if (
      (c1 === 'rock' && c2 === 'scissors') ||
      (c1 === 'paper' && c2 === 'rock') ||
      (c1 === 'scissors' && c2 === 'paper')
    ) {
      roundWinner = 'p1';
      state.scores.p1 += 1;
    } else {
      roundWinner = 'p2';
      state.scores.p2 += 1;
    }

    state.lastRound = { p1Choice: c1, p2Choice: c2, winner: roundWinner };
    state.history.push({ ...state.lastRound, round: state.history.length + 1 });

    // Reset choices for next round
    state.choices.p1 = null;
    state.choices.p2 = null;

    // Check match victory condition (first to 3)
    if (state.scores.p1 >= state.maxScore) {
      state.status = 'finished';
      state.winner = 0; // Player 1
    } else if (state.scores.p2 >= state.maxScore) {
      state.status = 'finished';
      state.winner = 1; // Player 2
    }
  }

  return { valid: true, state };
}
