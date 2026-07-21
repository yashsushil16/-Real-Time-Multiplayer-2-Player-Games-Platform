export function createConnectFourState() {
  // 6 rows x 7 columns grid (null, 'P1', or 'P2')
  const rows = 6;
  const cols = 7;
  const board = Array(rows).fill(null).map(() => Array(cols).fill(null));

  return {
    gameType: 'connectFour',
    gameName: 'Connect 4',
    rows,
    cols,
    board,
    turn: 0, // 0 for P1 ('RED'), 1 for P2 ('YELLOW')
    status: 'playing',
    winner: null,
    isDraw: false,
    winningCells: null, // Array of [r, c]
    lastMove: null // [r, c]
  };
}

export function handleConnectFourMove(state, playerIndex, move) {
  // move = { col: 0..6 }
  if (state.status === 'finished') return { valid: false, reason: 'Game is finished' };
  if (state.turn !== playerIndex) return { valid: false, reason: "Not your turn" };

  const { col } = move;
  if (col < 0 || col >= state.cols) return { valid: false, reason: 'Invalid column' };

  // Find lowest available row in column `col`
  let targetRow = -1;
  for (let r = state.rows - 1; r >= 0; r--) {
    if (state.board[r][col] === null) {
      targetRow = r;
      break;
    }
  }

  if (targetRow === -1) {
    return { valid: false, reason: 'Column is full' };
  }

  const mark = playerIndex === 0 ? 'P1' : 'P2';
  state.board[targetRow][col] = mark;
  state.lastMove = [targetRow, col];

  // Check 4-in-a-row victory
  const winCells = checkConnectFourWin(state.board, targetRow, col, mark, state.rows, state.cols);
  if (winCells) {
    state.status = 'finished';
    state.winner = playerIndex;
    state.winningCells = winCells;
  } else if (isBoardFull(state.board)) {
    state.status = 'finished';
    state.isDraw = true;
  } else {
    state.turn = state.turn === 0 ? 1 : 0;
  }

  return { valid: true, state };
}

function isBoardFull(board) {
  return board[0].every(cell => cell !== null);
}

function checkConnectFourWin(board, row, col, playerMark, numRows, numCols) {
  const directions = [
    [[0, 1], [0, -1]],  // Horizontal
    [[1, 0], [-1, 0]],  // Vertical
    [[1, 1], [-1, -1]], // Diagonal \
    [[1, -1], [-1, 1]]  // Diagonal /
  ];

  for (const [d1, d2] of directions) {
    const cells = [[row, col]];

    // Check direction 1
    let r = row + d1[0];
    let c = col + d1[1];
    while (r >= 0 && r < numRows && c >= 0 && c < numCols && board[r][c] === playerMark) {
      cells.push([r, c]);
      r += d1[0];
      c += d1[1];
    }

    // Check direction 2
    r = row + d2[0];
    c = col + d2[1];
    while (r >= 0 && r < numRows && c >= 0 && c < numCols && board[r][c] === playerMark) {
      cells.push([r, c]);
      r += d2[0];
      c += d2[1];
    }

    if (cells.length >= 4) {
      return cells;
    }
  }

  return null;
}
