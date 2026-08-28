const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const SUITS = ['hearts', 'diamonds', 'clubs', 'spades'];

export function createBluffState(playerCount = 2) {
  return {
    gameType: 'bluff',
    gameName: 'Bluff (Cheat)',
    status: 'waiting', // Starts in 'waiting' pre-game lobby until players click Start Game / Ready
    turn: 0,
    requiredRank: 'A',
    ranksCycle: RANKS,
    readyPlayers: [], // Track ready player indices
    hands: [], // Server-authoritative hands: hands[playerIndex]
    handCounts: [],
    pile: [], // Array of { playerIndex, claimedRank, cards, cardCount }
    lastPlay: null, // { playerIndex, claimedRank, cardCount, cards }
    lastChallengeResult: null, // { challengerIndex, challengedIndex, wasTruthful, loserIndex, revealedCards }
    challengeDeadline: null,
    winner: null,
    isDraw: false
  };
}

export function startBluffDeal(state, numPlayers) {
  const actualPlayers = Math.max(2, Math.min(4, numPlayers));

  const deck = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({ id: `${suit}-${rank}`, suit, rank });
    }
  }

  // Fisher-Yates Shuffle
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }

  const hands = Array.from({ length: actualPlayers }, () => []);
  const removedFromPlay = [];

  const cardsPerPlayer = Math.floor(deck.length / actualPlayers);
  const totalDealt = cardsPerPlayer * actualPlayers;

  for (let i = 0; i < totalDealt; i++) {
    hands[i % actualPlayers].push(deck[i]);
  }
  for (let i = totalDealt; i < deck.length; i++) {
    removedFromPlay.push(deck[i]);
  }

  // Sort each hand by rank index for cleaner presentation
  hands.forEach(hand => {
    hand.sort((a, b) => RANKS.indexOf(a.rank) - RANKS.indexOf(b.rank));
  });

  state.hands = hands;
  state.handCounts = hands.map(h => h.length);
  state.status = 'playing';
  state.turn = 0;
  state.requiredRank = 'A';
  state.pile = [];
  state.lastPlay = null;
  state.lastChallengeResult = null;
  state.challengeDeadline = null;
  state.winner = null;
  state.isDraw = false;
}

export function handleBluffMove(state, playerIndex, move) {
  if (!move || !move.type) {
    return { valid: false, reason: 'Invalid move payload' };
  }

  const playerCount = state.hands && state.hands.length > 0 ? state.hands.length : 2;

  if (move.type === 'start_game') {
    if (!Array.isArray(state.readyPlayers)) {
      state.readyPlayers = [];
    }
    if (!state.readyPlayers.includes(playerIndex)) {
      state.readyPlayers.push(playerIndex);
    }
    const totalPlayers = Math.max(2, move.numPlayers || 2);
    if (state.readyPlayers.length >= totalPlayers || state.status !== 'waiting') {
      startBluffDeal(state, totalPlayers);
    }
    return { valid: true, state };
  }

  if (move.type === 'restart') {
    startBluffDeal(state, move.numPlayers || playerCount || 2);
    return { valid: true, state };
  }

  if (move.type === 'play_cards') {
    if (state.status !== 'playing') {
      return { valid: false, reason: 'Not in play phase' };
    }
    if (state.turn !== playerIndex) {
      return { valid: false, reason: 'Not your turn' };
    }

    const { cardIds } = move;
    if (!Array.isArray(cardIds) || cardIds.length < 1 || cardIds.length > 4) {
      return { valid: false, reason: 'Must select between 1 and 4 cards' };
    }

    const playerHand = state.hands[playerIndex] || [];
    const playedCards = [];

    for (const id of cardIds) {
      const cardIndex = playerHand.findIndex(c => c.id === id);
      if (cardIndex === -1) {
        return { valid: false, reason: `Card ${id} not found in your hand` };
      }
      playedCards.push(playerHand[cardIndex]);
    }

    // Remove played cards from hand
    state.hands[playerIndex] = playerHand.filter(c => !cardIds.includes(c.id));
    state.handCounts[playerIndex] = state.hands[playerIndex].length;

    // Push to pile
    const pileEntry = {
      playerIndex,
      claimedRank: state.requiredRank,
      cards: playedCards,
      cardCount: playedCards.length
    };
    state.pile.push(pileEntry);

    state.lastPlay = {
      playerIndex,
      claimedRank: state.requiredRank,
      cardCount: playedCards.length,
      cards: playedCards
    };

    state.lastChallengeResult = null;
    state.status = 'challengeWindow';
    state.challengeDeadline = Date.now() + 6000; // 6-second window

    return { valid: true, state };
  }

  if (move.type === 'call_bluff') {
    if (state.status !== 'challengeWindow') {
      return { valid: false, reason: 'No active play to challenge' };
    }
    if (!state.lastPlay) {
      return { valid: false, reason: 'No last play available' };
    }
    if (playerIndex === state.lastPlay.playerIndex) {
      return { valid: false, reason: 'You cannot challenge your own play' };
    }

    const lastPlay = state.lastPlay;
    const wasTruthful = lastPlay.cards.every(c => c.rank === lastPlay.claimedRank);

    const loserIndex = wasTruthful ? playerIndex : lastPlay.playerIndex;

    // Collect all cards in pile
    const allPileCards = [];
    for (const entry of state.pile) {
      allPileCards.push(...entry.cards);
    }

    // Add pile cards to loser's hand
    state.hands[loserIndex].push(...allPileCards);
    state.hands[loserIndex].sort((a, b) => RANKS.indexOf(a.rank) - RANKS.indexOf(b.rank));
    state.handCounts[loserIndex] = state.hands[loserIndex].length;

    // Empty pile
    state.pile = [];

    state.lastChallengeResult = {
      challengerIndex: playerIndex,
      challengedIndex: lastPlay.playerIndex,
      wasTruthful,
      loserIndex,
      revealedCards: lastPlay.cards
    };

    // Win condition check: ONLY if hand is legitimately 0 after playing truthful cards
    if (wasTruthful && Array.isArray(state.hands[lastPlay.playerIndex]) && state.hands[lastPlay.playerIndex].length === 0) {
      state.winner = lastPlay.playerIndex;
      state.status = 'finished';
      state.challengeDeadline = null;
      return { valid: true, state };
    }

    // Advance turn and required rank
    const currentRankIdx = RANKS.indexOf(state.requiredRank);
    state.requiredRank = RANKS[(currentRankIdx + 1) % RANKS.length];

    state.turn = (lastPlay.playerIndex + 1) % playerCount;
    state.status = 'playing';
    state.challengeDeadline = null;

    return { valid: true, state };
  }

  if (move.type === 'challenge_timeout' || move.type === 'pass') {
    if (state.status !== 'challengeWindow') {
      return { valid: true, state }; // Ignore if already resolved
    }

    const lastPlay = state.lastPlay;

    // Win condition check: ONLY if lastPlay exists and acting player legitimately emptied hand
    if (lastPlay && Array.isArray(state.hands[lastPlay.playerIndex]) && state.hands[lastPlay.playerIndex].length === 0) {
      state.winner = lastPlay.playerIndex;
      state.status = 'finished';
      state.challengeDeadline = null;
      return { valid: true, state };
    }

    // Advance turn & rank
    const currentRankIdx = RANKS.indexOf(state.requiredRank);
    state.requiredRank = RANKS[(currentRankIdx + 1) % RANKS.length];

    state.turn = (lastPlay ? (lastPlay.playerIndex + 1) : (state.turn + 1)) % playerCount;
    state.status = 'playing';
    state.challengeDeadline = null;

    return { valid: true, state };
  }

  return { valid: false, reason: 'Unsupported move type' };
}
