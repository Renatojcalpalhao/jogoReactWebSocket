/**
 * Poker Multiplayer Backend (Socket.io)
 * Salve como server.js e rode com: node server.js
 * Requer: express, socket.io, cors
 */

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors({ origin: '*' }));

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});

// Utilitário para gerar cartas aleatórias
const suits = ['♠', '♥', '♣', '♦'];
const values = ['A', 'K', 'Q', 'J', '10', '9', '8', '7', '6', '5', '4', '3', '2'];
function getRandomCard(deck) {
  // Remove carta do deck e retorna
  const idx = Math.floor(Math.random() * deck.length);
  return deck.splice(idx, 1)[0];
}
function createDeck() {
  const deck = [];
  for (const suit of suits) {
    for (const value of values) {
      deck.push(value + suit);
    }
  }
  return deck;
}

const initialChips = 1000;
const bigBlind = 20;

let rooms = {}; // { roomId: { players, communityCards, pot, currentBet, playerTurn, deck, phase, chat } }

function getGameState(room) {
  return {
    players: room.players.map(p => ({
      id: p.id,
      name: p.name,
      avatar: p.avatar,
      chips: p.chips,
      seat: p.seat,
      bet: p.bet,
      hand: p.hand,
      folded: p.folded
    })),
    communityCards: room.communityCards,
    pot: room.pot,
    currentBet: room.currentBet,
    playerTurn: room.playerTurn,
    phase: room.phase,
    lastWinners: room.lastWinners || []
  };
}

function startNewRound(room) {
  room.deck = createDeck();
  room.communityCards = [];
  room.pot = 0;
  room.phase = 'preflop';
  room.lastWinners = [];

  // Dealer, small blind e big blind
  room.dealer = (room.dealer === undefined) ? 0 : (room.dealer + 1) % room.players.length;
  room.smallBlind = (room.dealer + 1) % room.players.length;
  room.bigBlind = (room.dealer + 2) % room.players.length;
  room.playerTurn = (room.dealer + 3) % room.players.length;

  room.currentBet = bigBlind;
  room.players.forEach((p, idx) => {
    p.bet = 0;
    p.folded = false;
    p.hand = [getRandomCard(room.deck), getRandomCard(room.deck)];
    // Small blind
    if (idx === room.smallBlind) {
      const sb = Math.floor(bigBlind / 2);
      p.chips -= sb;
      p.bet = sb;
      room.pot += sb;
    }
    // Big blind
    if (idx === room.bigBlind) {
      p.chips -= bigBlind;
      p.bet = bigBlind;
      room.pot += bigBlind;
    }
    // Se quiser resetar fichas, descomente:
    // p.chips = initialChips;
  });
}

// Utiliza pokersolver para avaliar as mãos reais de poker
const { Hand } = require('pokersolver');

function convertCard(card) {
  // Converte 'A♠' para 'As', '10♥' para 'Th', etc.
  const valueMap = { 'A': 'A', 'K': 'K', 'Q': 'Q', 'J': 'J', '10': 'T', '9': '9', '8': '8', '7': '7', '6': '6', '5': '5', '4': '4', '3': '3', '2': '2' };
  const suitMap = { '♠': 's', '♥': 'h', '♦': 'd', '♣': 'c' };
  let value = card.slice(0, card.length - 1);
  let suit = card.slice(-1);
  return valueMap[value] + suitMap[suit];
}

function showdown(room) {
  const activePlayers = room.players.filter(p => !p.folded);
  if (activePlayers.length === 0) return;
  // Monta as mãos para o pokersolver
  const hands = activePlayers.map(player => {
    const allCards = [...player.hand, ...room.communityCards].map(convertCard);
    return Hand.solve(allCards, 'texas-holdem');
  });

  // Side pots: identifica todos os valores de aposta únicos (all-in)
  const allBets = activePlayers.map(p => p.bet).filter(b => b > 0);
  const uniqueBets = Array.from(new Set(allBets)).sort((a, b) => a - b);
  let potLeft = room.pot;
  let winnersNames = [];

  for (let i = 0; i < uniqueBets.length; i++) {
    const betLevel = uniqueBets[i];
    // Jogadores elegíveis para este side pot
    const eligible = activePlayers.filter(p => p.bet >= betLevel);
    // Valor deste side pot
    let prevBet = i === 0 ? 0 : uniqueBets[i - 1];
    const potValue = room.players.reduce((sum, p) => {
      let contrib = Math.min(p.bet, betLevel) - prevBet;
      return sum + (contrib > 0 ? contrib : 0);
    }, 0);
    potLeft -= potValue;
    // Avalia as mãos dos elegíveis
    const eligibleHands = eligible.map(p => {
      const allCards = [...p.hand, ...room.communityCards].map(convertCard);
      return Hand.solve(allCards, 'texas-holdem');
    });
    const winners = Hand.winners(eligibleHands);
    const winnerPlayers = eligible.filter((p, idx) => winners.includes(eligibleHands[idx]));
    const prize = Math.floor(potValue / winnerPlayers.length);
    winnerPlayers.forEach(w => { w.chips += prize; });
    winnersNames.push(...winnerPlayers.map(w => w.name));
  }
  room.lastWinners = Array.from(new Set(winnersNames));
}

function advancePhase(room) {
  if (room.phase === 'preflop') {
    // Flop: 3 cartas
    room.communityCards = [getRandomCard(room.deck), getRandomCard(room.deck), getRandomCard(room.deck)];
    room.phase = 'flop';
  } else if (room.phase === 'flop') {
    // Turn: 1 carta
    room.communityCards.push(getRandomCard(room.deck));
    room.phase = 'turn';
  } else if (room.phase === 'turn') {
    // River: 1 carta
    room.communityCards.push(getRandomCard(room.deck));
    room.phase = 'river';
  } else if (room.phase === 'river') {
    room.phase = 'showdown';
    showdown(room);
    // Após 5 segundos, inicia nova rodada automaticamente
    setTimeout(() => {
      startNewRound(room);
      io.to(room.roomId).emit('gameState', getGameState(room));
    }, 5000);
  }
  // Reinicia apostas e bets dos jogadores para a nova rodada de apostas
  room.players.forEach(p => {
    p.bet = 0;
  });
  room.currentBet = 0;
}

io.on('connection', (socket) => {
  socket.on('joinRoom', ({ roomId, name, avatar }) => {
  if (!rooms[roomId]) {
  rooms[roomId] = {
  players: [],
  communityCards: [],
  pot: 0,
  currentBet: bigBlind,
  playerTurn: 0,
  deck: [],
  chat: []
  };
  }
  // Evita duplicidade de jogadores
  if (!rooms[roomId].players.find(p => p.id === socket.id)) {
  const seat = rooms[roomId].players.length;
  rooms[roomId].players.push({
  id: socket.id,
  name,
  avatar: avatar || '🧑',
  chips: initialChips,
  seat,
  bet: 0,
  hand: [], // Novo jogador só recebe cartas na próxima rodada
  folded: true // Marca como fora da rodada atual
  });
  }
  socket.join(roomId);
  
  // Se for o primeiro jogador, inicia rodada
  if (rooms[roomId].players.length === 1) {
  startNewRound(rooms[roomId]);
  }
  
  // Envia estado do jogo para todos (todos aparecem na mesa, mas só quem tem hand participa da rodada)
  io.to(roomId).emit('gameState', getGameState(rooms[roomId]));
  });

  socket.on('playerAction', ({ roomId, action, data }) => {
    const room = rooms[roomId];
    if (!room) return;
    const playerIdx = room.players.findIndex(p => p.id === socket.id);
    if (playerIdx === -1) return;
    const player = room.players[playerIdx];

    // Apenas o jogador da vez pode agir
    if (room.playerTurn !== playerIdx || player.folded) return;

    if (action === 'fold') {
      player.folded = true;
    } else if (action === 'check') {
      if (player.bet === room.currentBet) {
        // Check permitido
      } else {
        return;
      }
    } else if (action === 'call') {
      const toCall = room.currentBet - player.bet;
      if (player.chips >= toCall) {
        player.chips -= toCall;
        player.bet += toCall;
        room.pot += toCall;
      } else {
        // All-in
        room.pot += player.chips;
        player.bet += player.chips;
        player.chips = 0;
      }
    } else if (action === 'raise') {
      const raiseAmount = Number(data.amount);
      const toCall = room.currentBet - player.bet;
      if (raiseAmount > 0 && player.chips >= toCall + raiseAmount) {
        player.chips -= (toCall + raiseAmount);
        player.bet += (toCall + raiseAmount);
        room.pot += (toCall + raiseAmount);
        room.currentBet += raiseAmount;
      } else {
        return;
      }
    }

    // Avança para o próximo jogador ativo
    let nextIdx = (room.playerTurn + 1) % room.players.length;
    let activeCount = 0;
    while (room.players[nextIdx].folded) {
      nextIdx = (nextIdx + 1) % room.players.length;
      activeCount++;
      if (activeCount > room.players.length) break;
    }
    room.playerTurn = nextIdx;

    // Verifica se a rodada de apostas deve terminar
    const activePlayers = room.players.filter(p => !p.folded);
    const allBetsEqual = activePlayers.every(p => p.bet === room.currentBet || p.chips === 0);
    const onlyOneLeft = activePlayers.length === 1;
    if (allBetsEqual || onlyOneLeft) {
      // Avança de fase automaticamente
      advancePhase(room);
    }

    io.to(roomId).emit('gameState', getGameState(room));
  });

  // Chat: recebe e repassa mensagens
  socket.on('chatMessage', ({ roomId, name, avatar, message }) => {
    if (!rooms[roomId]) return;
    const msg = {
      name,
      avatar,
      message,
      timestamp: Date.now()
    };
    rooms[roomId].chat.push(msg);
    // Limita histórico a 100 mensagens
    if (rooms[roomId].chat.length > 100) rooms[roomId].chat.shift();
    io.to(roomId).emit('chatMessage', msg);
  });

  socket.on('disconnect', () => {
    for (const roomId in rooms) {
      const room = rooms[roomId];
      const idx = room.players.findIndex(p => p.id === socket.id);
      if (idx !== -1) {
        room.players.splice(idx, 1);
        // Se sala vazia, remove
        if (room.players.length === 0) {
          delete rooms[roomId];
        } else {
          // Se o jogador da vez saiu, passa a vez
          if (room.playerTurn >= room.players.length) {
            room.playerTurn = 0;
          }
          io.to(roomId).emit('gameState', getGameState(room));
        }
      }
    }
  });
});

const port = process.env.PORT || 5000;
server.listen(port, () => console.log('Servidor Poker Socket.io rodando na porta', port));