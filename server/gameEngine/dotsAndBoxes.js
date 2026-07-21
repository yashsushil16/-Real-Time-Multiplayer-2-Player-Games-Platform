export function createDotsAndBoxesState() {
  const gridSize = 3; // 3x3 boxes (4x4 dots)
  // Horizontal edges: 4 rows of 3 edges = 12
  // Vertical edges: 3 rows of 4 edges = 12
  const hEdges = Array(gridSize + 1).fill(null).map(() => Array(gridSize).fill(null));
  const vEdges = Array(gridSize).fill(null).map(() => Array(gridSize + 1).fill(null));
  const boxes = Array(gridSize).fill(null).map(() => Array(gridSize).fill(null));

  return {
    gameType: 'dotsAndBoxes',
    gameName: 'Dots & Boxes',
    gridSize,
    hEdges,
    vEdges,
    boxes,
    scores: { p1: 0, p2: 0 },
    turn: 0,
    status: 'playing',
    winner: null,
    isDraw: false
  };
}

export function handleDotsAndBoxesMove(state, playerIndex, move) {
  // move = { type: 'h'|'v', row: number, col: number }
  if (state.status === 'finished') return { valid: false, reason: 'Game is finished' };
  if (state.turn !== playerIndex) return { valid: false, reason: "Not your turn" };

  const { type, row, col } = move;
  const size = state.gridSize;

  if (type === 'h') {
    if (row < 0 || row > size || col < 0 || col >= size || state.hEdges[row][col] !== null) {
      return { valid: false, reason: 'Invalid or already drawn horizontal edge' };
    }
    state.hEdges[row][col] = playerIndex;
  } else if (type === 'v') {
    if (row < 0 || row >= size || col < 0 || col > size || state.vEdges[row][col] !== null) {
      return { valid: false, reason: 'Invalid or already drawn vertical edge' };
    }
    state.vEdges[row][col] = playerIndex;
  } else {
    return { valid: false, reason: 'Invalid edge type' };
  }

  // Check if any box was completed by this edge move
  let boxesCompletedCount = 0;
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (state.boxes[r][c] === null) {
        // A box at (r, c) is bounded by:
        // Top: hEdges[r][c]
        // Bottom: hEdges[r+1][c]
        // Left: vEdges[r][c]
        // Right: vEdges[r][c+1]
        const top = state.hEdges[r][c] !== null;
        const bottom = state.hEdges[r + 1][c] !== null;
        const left = state.vEdges[r][c] !== null;
        const right = state.vEdges[r][c + 1] !== null;

        if (top && bottom && left && right) {
          state.boxes[r][c] = playerIndex;
          boxesCompletedCount += 1;
          if (playerIndex === 0) state.scores.p1 += 1;
          else state.scores.p2 += 1;
        }
      }
    }
  }

  const totalBoxes = size * size;
  const claimedBoxes = state.scores.p1 + state.scores.p2;

  if (claimedBoxes === totalBoxes) {
    state.status = 'finished';
    if (state.scores.p1 > state.scores.p2) {
      state.winner = 0;
    } else if (state.scores.p2 > state.scores.p1) {
      state.winner = 1;
    } else {
      state.isDraw = true;
    }
  } else {
    // If NO box was completed, turn passes to next player. If box WAS completed, player gets another turn!
    if (boxesCompletedCount === 0) {
      state.turn = state.turn === 0 ? 1 : 0;
    }
  }

  return { valid: true, state };
}
