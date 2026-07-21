export function createTicTacToeState() {
  return {
    gameType: 'ticTacToe',
    gameName: 'Tic-Tac-Toe',
    board: Array(9).fill(null),
    turn: 0, // 0 = Player 1 ('X'), 1 = Player 2 ('O')
    status: 'playing', // 'playing' | 'finished'
    winner: null, // 0, 1, or null
    isDraw: false,
    winningLine: null // array of winning indices e.g. [0, 1, 2]
  };
}

const WINNING_COMBOS = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
  [0, 4, 8], [2, 4, 6]             // Diagonals
];

export function handleTicTacToeMove(state, playerIndex, move) {
  // move = { index: 0..8 }
  if (state.status === 'finished') return { valid: false, reason: 'Game is finished' };
  if (state.turn !== playerIndex) return { valid: false, reason: "Not your turn" };
  
  const { index } = move;
  if (index < 0 || index > 8 || state.board[index] !== null) {
    return { valid: false, reason: 'Invalid square choice' };
  }

  const mark = playerIndex === 0 ? 'X' : 'O';
  state.board[index] = mark;

  // Check for winner
  let wonCombo = null;
  for (const combo of WINNING_COMBOS) {
    const [a, b, c] = combo;
    if (state.board[a] && state.board[a] === state.board[b] && state.board[a] === state.board[c]) {
      wonCombo = combo;
      break;
    }
  }

  if (wonCombo) {
    state.status = 'finished';
    state.winner = playerIndex;
    state.winningLine = wonCombo;
  } else if (!state.board.includes(null)) {
    state.status = 'finished';
    state.isDraw = true;
  } else {
    // Switch turn
    state.turn = state.turn === 0 ? 1 : 0;
  }

  return { valid: true, state };
}
