export function createCheckersState() {
  // 8x8 grid
  const board = Array(8).fill(null).map(() => Array(8).fill(null));

  // Initialize pieces
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      if ((r + c) % 2 === 1) { // Dark squares only
        if (r < 3) {
          board[r][c] = { player: 0, king: false };
        } else if (r > 4) {
          board[r][c] = { player: 1, king: false };
        }
      }
    }
  }

  return {
    gameType: 'checkers',
    gameName: 'Checkers',
    board,
    turn: 0, // 0 = Player 1 (Red/Top), 1 = Player 2 (Black/Bottom)
    status: 'playing',
    winner: null,
    isDraw: false,
    selectedSquare: null,
    validMoves: []
  };
}

export function handleCheckersMove(state, playerIndex, move) {
  // move = { from: [r, c], to: [r, c] }
  if (state.status === 'finished') return { valid: false, reason: 'Game is finished' };
  if (state.turn !== playerIndex) return { valid: false, reason: "Not your turn" };

  const { from, to } = move;
  if (!from || !to) return { valid: false, reason: 'Invalid move payload' };

  const [fromR, fromC] = from;
  const [toR, toC] = to;

  const piece = state.board[fromR]?.[fromC];
  if (!piece || piece.player !== playerIndex) {
    return { valid: false, reason: 'No valid piece at starting square' };
  }

  // Validate step or jump
  const rowDiff = toR - fromR;
  const colDiff = Math.abs(toC - fromC);

  if (state.board[toR]?.[toC] !== null) {
    return { valid: false, reason: 'Target square is occupied' };
  }

  // Direction allowed
  const forwardDir = playerIndex === 0 ? 1 : -1;
  const isForward = piece.king ? true : Math.sign(rowDiff) === forwardDir;

  if (!isForward) {
    return { valid: false, reason: 'Piece cannot move backwards unless kinged' };
  }

  let isJump = false;
  let jumpedR = -1;
  let jumpedC = -1;

  if (Math.abs(rowDiff) === 1 && colDiff === 1) {
    // Regular diagonal step
    isJump = false;
  } else if (Math.abs(rowDiff) === 2 && colDiff === 2) {
    // Jump move
    jumpedR = fromR + Math.sign(rowDiff);
    jumpedC = fromC + (toC - fromC) / 2;
    const jumpedPiece = state.board[jumpedR]?.[jumpedC];

    if (!jumpedPiece || jumpedPiece.player === playerIndex) {
      return { valid: false, reason: 'No opponent piece to jump' };
    }
    isJump = true;
  } else {
    return { valid: false, reason: 'Invalid move distance' };
  }

  // Execute move
  state.board[toR][toC] = piece;
  state.board[fromR][fromC] = null;

  if (isJump) {
    state.board[jumpedR][jumpedC] = null; // Remove captured piece
  }

  // Kinging promotion
  if (playerIndex === 0 && toR === 7) piece.king = true;
  if (playerIndex === 1 && toR === 0) piece.king = true;

  // Check remaining pieces for victory condition
  let p1Pieces = 0;
  let p2Pieces = 0;

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = state.board[r][c];
      if (p) {
        if (p.player === 0) p1Pieces++;
        else p2Pieces++;
      }
    }
  }

  if (p1Pieces === 0) {
    state.status = 'finished';
    state.winner = 1;
  } else if (p2Pieces === 0) {
    state.status = 'finished';
    state.winner = 0;
  } else {
    state.turn = state.turn === 0 ? 1 : 0;
  }

  return { valid: true, state };
}
