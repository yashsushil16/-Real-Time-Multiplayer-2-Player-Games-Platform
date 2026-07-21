import { createRPSState, handleRPSMove } from './rockPaperScissors.js';
import { createTicTacToeState, handleTicTacToeMove } from './ticTacToe.js';
import { createConnectFourState, handleConnectFourMove } from './connectFour.js';
import { createDotsAndBoxesState, handleDotsAndBoxesMove } from './dotsAndBoxes.js';
import { createCheckersState, handleCheckersMove } from './checkers.js';

export function createInitialGameState(gameType) {
  switch (gameType) {
    case 'rockPaperScissors':
      return createRPSState();
    case 'ticTacToe':
      return createTicTacToeState();
    case 'connectFour':
      return createConnectFourState();
    case 'dotsAndBoxes':
      return createDotsAndBoxesState();
    case 'checkers':
      return createCheckersState();
    default:
      return createTicTacToeState();
  }
}

export function processGameMove(state, playerIndex, move) {
  switch (state.gameType) {
    case 'rockPaperScissors':
      return handleRPSMove(state, playerIndex, move);
    case 'ticTacToe':
      return handleTicTacToeMove(state, playerIndex, move);
    case 'connectFour':
      return handleConnectFourMove(state, playerIndex, move);
    case 'dotsAndBoxes':
      return handleDotsAndBoxesMove(state, playerIndex, move);
    case 'checkers':
      return handleCheckersMove(state, playerIndex, move);
    default:
      return { valid: false, reason: 'Unsupported game type' };
  }
}
