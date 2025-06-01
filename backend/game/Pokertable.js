const poker = require('pokersolver');
const PokerPlayer = require('./PokerPlayer');

class PokerTable {
    constructor(socketio, tableId) {
        this.socketio = socketio;
        this.tableId = tableId;
        this.players = [];
        this.maxSeats = 6;

        // Estado do jogo
        this.deck = [];
        this.communityCards = [];
        this.pot = 0;
        this.currentPhase = "waiting"; // waiting, pre-flop, flop, turn, river, showdown
        this.activePlayerIndex = 0;
        this.lastBet = 0;

        this.resetDeck();
    }

    resetDeck() {
        const suits = ['s', 'h', 'd', 'c'];
        const values = [
            '2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A'
        ];
        this.deck = [];
        for (let s of suits) {
            for (let v of values) {
                this.deck.push(v + s);
            }
        }
        // Embaralhar
        for (let i = this.deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.deck[i], this.deck[j]] = [this.deck[j], this.deck[i]];
        }
    }

    joinTable = (pokerPlayer) => {
        if (this.players.length < this.maxSeats) {
            pokerPlayer.chips = pokerPlayer.chips || 100; // Valor inicial de fichas
            pokerPlayer.folded = false;
            this.players.push(pokerPlayer);
            this.updatePlayers();
            return true;
        }
        return false;
    }

    startHand = () => {
        this.resetDeck();
        this.communityCards = [];
        this.pot = 0;
        this.currentPhase = "pre-flop";
        this.activePlayerIndex = 0;
        this.lastBet = 0;

        // Resetar status dos jogadores
        this.players.forEach(player => {
            player.cards = [this.deck.pop(), this.deck.pop()];
            player.folded = false;
            player.currentBet = 0;
        });

        this.updatePlayers();
    }

    nextPhase = () => {
        if (this.currentPhase === "pre-flop") {
            this.communityCards = [this.deck.pop(), this.deck.pop(), this.deck.pop()];
            this.currentPhase = "flop";
        } else if (this.currentPhase === "flop") {
            this.communityCards.push(this.deck.pop());
            this.currentPhase = "turn";
        } else if (this.currentPhase === "turn") {
            this.communityCards.push(this.deck.pop());
            this.currentPhase = "river";
        } else if (this.currentPhase === "river") {
            this.currentPhase = "showdown";
            this.determineWinner();
        }
        // Resetar apostas da rodada
        this.players.forEach(p => p.currentBet = 0);
        this.lastBet = 0;
        this.updatePlayers();
    }

    handleBet = (playerId, valor) => {
        const player = this.players.find(p => p.user && p.user.id === playerId);
        if (!player || player.folded || valor <= 0 || player.chips < valor) return;

        player.chips -= valor;
        player.currentBet += valor;
        this.pot += valor;
        this.lastBet = Math.max(this.lastBet, player.currentBet);

        // Avança para o próximo jogador ativo
        this.advanceActivePlayer();
        this.updatePlayers();
    }

    handleCall = (playerId) => {
        const player = this.players.find(p => p.user && p.user.id === playerId);
        if (!player || player.folded) return;

        const toCall = this.lastBet - player.currentBet;
        if (player.chips < toCall) return; // Não pode pagar

        player.chips -= toCall;
        player.currentBet += toCall;
        this.pot += toCall;

        this.advanceActivePlayer();
        this.updatePlayers();
    }

    handleCheck = (playerId) => {
        const player = this.players.find(p => p.user && p.user.id === playerId);
        if (!player || player.folded) return;

        if (player.currentBet === this.lastBet) {
            this.advanceActivePlayer();
            this.updatePlayers();
        }
    }

    handleFold = (playerId) => {
        const player = this.players.find(p => p.user && p.user.id === playerId);
        if (!player || player.folded) return;

        player.folded = true;
        this.advanceActivePlayer();
        this.updatePlayers();
    }

    advanceActivePlayer = () => {
        // Avança para o próximo jogador ativo (não foldado)
        let next = this.activePlayerIndex;
        for (let i = 0; i < this.players.length; i++) {
            next = (next + 1) % this.players.length;
            if (!this.players[next].folded) {
                this.activePlayerIndex = next;
                break;
            }
        }
        // Se todos exceto um foldaram, termina a rodada
        const ativos = this.players.filter(p => !p.folded);
        if (ativos.length === 1) {
            this.currentPhase = "showdown";
            this.determineWinner();
        }
    }

    determineWinner = () => {
        const hands = this.players
            .filter(p => !p.folded)
            .map(p => ({
                player: p,
                hand: poker.Hand.solve([...p.cards, ...this.communityCards])
            }));

        if (hands.length === 0) return;

        const winners = poker.Hand.winners(hands.map(h => h.hand));
        const winnerPlayers = hands.filter(h => winners.includes(h.hand)).map(h => h.player);

        const prize = Math.floor(this.pot / winnerPlayers.length);
        winnerPlayers.forEach(p => p.chips += prize);

        this.socketio.to(this.tableId).emit('showdown', {
            winners: winnerPlayers.map(p => p.user ? p.user.name : "Jogador"),
            prize: prize
        });

        setTimeout(() => this.startHand(), 5000);
    }

    updatePlayers = () => {
        const tableData = {
            seats: Array(this.maxSeats).fill({}),
            community: this.communityCards,
            pot: this.pot,
            phase: this.currentPhase,
            activePlayer: this.players[this.activePlayerIndex]?.user?.name || null,
            lastBet: this.lastBet
        };

        this.players.forEach((player, idx) => {
            if (player.user) {
                tableData.seats[idx] = {
                    name: player.user.name,
                    chips: player.chips,
                    folded: !!player.folded,
                    currentBet: player.currentBet,
                    cards: player.cards // Só envie as cartas para o próprio jogador no socket real!
                };
            }
        });

        // Emite o estado da mesa para todos os jogadores conectados
        this.socketio.to(this.tableId).emit('updateTable', tableData);
    }
}

module.exports = PokerTable;