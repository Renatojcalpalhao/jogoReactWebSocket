import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import PokerTable from '../components/PokerTable';
import Card from '../components/Card';
import Chat from '../components/Chat';

const socketUrl = 'http://localhost:5000'; // ajuste se backend estiver em outro endereço

interface PlayerState {
  id: string;
  name: string;
  avatar?: string;
  chips: number;
  seat: number;
  bet: number;
  hand: string[];
  folded: boolean;
}

interface GameState {
  players: PlayerState[];
  communityCards: string[];
  pot: number;
  currentBet: number;
  playerTurn: number; // índice do jogador da vez
  phase: 'preflop' | 'flop' | 'turn' | 'river' | 'showdown';
  lastWinners?: string[];
}

const playerPositions = [
  { top: '80%', left: '50%', transform: 'translate(-50%, 0)' },   // Jogador real (embaixo)
  { top: '65%', left: '85%', transform: 'translate(-50%, 0)' },
  { top: '35%', left: '85%', transform: 'translate(-50%, 0)' },
  { top: '15%', left: '50%', transform: 'translate(-50%, 0)' },
  { top: '35%', left: '15%', transform: 'translate(-50%, 0)' },
  { top: '65%', left: '15%', transform: 'translate(-50%, 0)' },
  { top: '50%', left: '5%', transform: 'translate(-50%, -50%)' },
];

const Game: React.FC = () => {
  const navigate = useNavigate();
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [betInput, setBetInput] = useState(0);
  const socketRef = useRef<Socket | null>(null);

  // Sair do jogo
  const handleExit = () => {
    localStorage.removeItem('playerName');
    navigate('/');
    if (socketRef.current) {
      socketRef.current.disconnect();
    }
  };

  // Envia ações para o backend
  const handleCheck = () => {
    socketRef.current?.emit('playerAction', {
      roomId: 'mesa1',
      action: 'check',
      data: {}
    });
  };
  const handleCall = () => {
    socketRef.current?.emit('playerAction', {
      roomId: 'mesa1',
      action: 'call',
      data: {}
    });
  };
  const handleRaise = () => {
    socketRef.current?.emit('playerAction', {
      roomId: 'mesa1',
      action: 'raise',
      data: { amount: betInput }
    });
    setBetInput(0);
  };
  const handleFold = () => {
    socketRef.current?.emit('playerAction', {
      roomId: 'mesa1',
      action: 'fold',
      data: {}
    });
  };

  // Nova rodada (apenas para teste/admin)
  const handleNewRound = () => {
    socketRef.current?.emit('playerAction', {
      roomId: 'mesa1',
      action: 'newRound',
      data: {}
    });
  };

  // Avançar fase (apenas para teste/admin)
  const handleNextPhase = () => {
    socketRef.current?.emit('playerAction', {
      roomId: 'mesa1',
      action: 'nextPhase',
      data: {}
    });
  };

  useEffect(() => {
    // Garante que o nome do jogador está presente, senão redireciona para registro
    const playerName = localStorage.getItem('playerName');
    const playerAvatar = localStorage.getItem('playerAvatar') || '🧑';
    const roomId = 'mesa1'; // pode ser dinâmico
    if (!playerName) {
      navigate('/register');
      return;
    }

    const socket = io(socketUrl, { autoConnect: true, forceNew: true });
    socketRef.current = socket;

    // Entra na sala SEMPRE que monta
    socket.emit('joinRoom', { roomId, name: playerName, avatar: playerAvatar });

    // Recebe atualização do estado do jogo
    socket.on('gameState', (state: GameState) => {
      setGameState(state);
    });

    // Limpeza ao sair
    return () => {
      socket.disconnect();
    };
  }, [navigate]);

  // Descobre o índice do jogador real de forma robusta (por id de socket OU nome)
  const myPlayerIdx = gameState?.players.findIndex(
    (p) => p.name === (localStorage.getItem('playerName') || '')
  ) ?? 0;

  const playerName = localStorage.getItem('playerName') || 'Você';
  const playerAvatar = localStorage.getItem('playerAvatar') || '🧑';
  const roomId = 'mesa1';

  return (
    <PokerTable>
      {/* Botão Sair */}
      <button
        onClick={handleExit}
        style={{
          position: 'absolute',
          top: 24,
          left: 24,
          zIndex: 10,
          padding: '0.7rem 2rem',
          borderRadius: '10px',
          background: 'linear-gradient(90deg, #b71c1c 60%, #f44336 100%)',
          color: '#fff',
          border: 'none',
          fontWeight: 'bold',
          fontSize: '1.1rem',
          cursor: 'pointer',
          boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
          letterSpacing: '1px',
          transition: 'background 0.2s'
        }}
        onMouseOver={e => (e.currentTarget.style.background = 'linear-gradient(90deg, #f44336 60%, #b71c1c 100%)')}
        onMouseOut={e => (e.currentTarget.style.background = 'linear-gradient(90deg, #b71c1c 60%, #f44336 100%)')}
      >
        Sair
      </button>

      {/* Pote e aposta atual */}
      {gameState && (
        <div style={{
          position: 'absolute',
          top: '48%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          color: '#fff',
          background: '#222a',
          borderRadius: 12,
          padding: '8px 24px',
          fontWeight: 'bold',
          fontSize: '1.2rem',
          zIndex: 3,
          boxShadow: '0 2px 8px rgba(0,0,0,0.18)'
        }}>
          Pote: {gameState.pot} fichas<br />
          Aposta atual: {gameState.currentBet} fichas
        </div>
      )}

      {/* Cartas comunitárias */}
      <style>{`
        @keyframes pulseTurn {
          0% { box-shadow: 0 0 24px 6px #ffd70088, 0 0 12px #ffd70088 inset; }
          100% { box-shadow: 0 0 36px 12px #ffd700cc, 0 0 24px #ffd700cc inset; }
        }
        @keyframes cardIn {
          0% { transform: scale(0.7) translateY(-40px); opacity: 0; }
          100% { transform: scale(1) translateY(0); opacity: 1; }
        }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 32, marginTop: 80 }}>
        {/* Exibe cartas conforme a fase */}
        {(() => {
          if (!gameState) return null;
          let cardsToShow = 0;
          if (gameState.phase === 'flop') cardsToShow = 3;
          else if (gameState.phase === 'turn') cardsToShow = 4;
          else if (gameState.phase === 'river' || gameState.phase === 'showdown') cardsToShow = 5;
          return gameState.communityCards.slice(0, cardsToShow).map((card, i) => (
            <div key={i} style={{ animation: 'cardIn 0.5s cubic-bezier(.4,2,.6,1) both', animationDelay: `${i * 0.15}s` }}>
              <Card value={card} />
            </div>
          ));
        })()}
      </div>

      {/* Exibe vencedor(es) no showdown */}
      {gameState?.phase === 'showdown' && gameState?.lastWinners && (
        <div style={{
          position: 'absolute',
          top: '30%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'linear-gradient(90deg, #fffde4 60%, #ffd700 100%)',
          color: '#b8860b',
          borderRadius: 20,
          padding: '22px 44px',
          fontWeight: 'bold',
          fontSize: '2rem',
          zIndex: 30,
          boxShadow: '0 4px 32px #ffd70088',
          border: '3px solid #ffd700',
          letterSpacing: 1.5,
          animation: 'cardIn 0.7s cubic-bezier(.4,2,.6,1) both',
        }}>
          {gameState.lastWinners.length === 1
            ? `Vencedor: ${gameState.lastWinners[0]}`
            : `Empate entre: ${gameState.lastWinners.join(', ')}`}
        </div>
      )}

      {/* Jogadores ao redor da mesa */}
      {gameState?.players.map((player, idx) => (
        <div
          key={player.id}
          style={{
            position: 'absolute',
            ...(playerPositions[idx % playerPositions.length]),
            color: player.folded ? '#888' : '#fff',
            background: player.folded ? '#444a' : '#222a',
            borderRadius: 16,
            padding: '8px 16px',
            minWidth: 80,
            textAlign: 'center',
            fontWeight: 'bold',
            fontSize: '1rem',
            zIndex: 2,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            border: gameState.playerTurn === idx ? '3px solid #ffd700' : 'none',
            boxShadow: gameState.playerTurn === idx ? '0 0 24px 6px #ffd70088, 0 0 12px #ffd70088 inset' : undefined,
            transition: 'box-shadow 0.4s, border 0.4s',
            animation: gameState.playerTurn === idx ? 'pulseTurn 1.2s infinite alternate' : 'none',
          }}
        >
          <span style={{ fontSize: '2rem', marginRight: 8 }}>{player.avatar || '🧑'}</span>
          {player.name}
          <div style={{ fontSize: '0.9rem', margin: '2px 0' }}>
            Fichas: {player.chips}
          </div>
          <div style={{ fontSize: '0.9rem', margin: '2px 0' }}>
            Aposta: {player.bet}
          </div>
          <div style={{ display: 'flex', marginTop: 4 }}>
            {/* Mostra cartas apenas para o jogador real */}
            {myPlayerIdx === idx && player.hand
              ? player.hand.map((card, i) => <Card key={i} value={card} />)
              : ['🂠', '🂠'].map((card, i) => <Card key={i} value={card} />)}
          </div>
          {player.folded && <div style={{ color: '#ff5252', fontSize: '0.8rem', alignSelf: 'flex-start', marginLeft: 0 }}>Desistiu</div>}
        </div>
      ))}

      {/* Painel de ação do jogador real */}
      {gameState && gameState.playerTurn === myPlayerIdx && !gameState.players[myPlayerIdx].folded && (
        <div
          className="poker-action-panel"
          style={{
            position: 'absolute',
            bottom: 40,
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#222a',
            borderRadius: 12,
            padding: '16px 32px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            gap: 16,
            flexWrap: 'wrap', // Responsivo para telas pequenas
            zIndex: 10,
            maxWidth: '90vw',
          }}
        >
          {/* Check ou Call */}
          {gameState.players[myPlayerIdx].bet === gameState.currentBet ? (
            <button
              onClick={handleCheck}
              style={{
                padding: '0.5rem 1.5rem',
                borderRadius: '8px',
                background: '#1976d2',
                color: '#fff',
                border: 'none',
                fontWeight: 'bold',
                fontSize: '1.1rem',
                cursor: 'pointer',
                margin: 0,
              }}
            >
              Check
            </button>
          ) : (
            <button
              onClick={handleCall}
              style={{
                padding: '0.5rem 1.5rem',
                borderRadius: '8px',
                background: '#388e3c',
                color: '#fff',
                border: 'none',
                fontWeight: 'bold',
                fontSize: '1.1rem',
                cursor: 'pointer',
                margin: 0,
              }}
            >
              Call ({gameState.currentBet - gameState.players[myPlayerIdx].bet})
            </button>
          )}
          {/* Raise */}
          <input
            type="number"
            min={1}
            max={gameState.players[myPlayerIdx].chips}
            value={betInput}
            onChange={e => setBetInput(Number(e.target.value))}
            style={{
              width: 80,
              fontSize: '1.1rem',
              borderRadius: 8,
              border: '1px solid #888',
              padding: '4px 8px',
              margin: 0,
            }}
          />
          <button
            onClick={handleRaise}
            style={{
              padding: '0.5rem 1.5rem',
              borderRadius: '8px',
              background: '#ffa000',
              color: '#fff',
              border: 'none',
              fontWeight: 'bold',
              fontSize: '1.1rem',
              cursor: 'pointer',
              margin: 0,
            }}
            disabled={betInput < 1 || betInput > gameState.players[myPlayerIdx].chips}
          >
            Raise
          </button>
          {/* Fold */}
          <button
            onClick={handleFold}
            style={{
              padding: '0.5rem 1.5rem',
              borderRadius: '8px',
              background: '#b71c1c',
              color: '#fff',
              border: 'none',
              fontWeight: 'bold',
              fontSize: '1.1rem',
              cursor: 'pointer',
              margin: 0,
            }}
          >
            Fold
          </button>
        </div>
      )}

      {/* Botão para nova rodada (admin/teste) */}
      <button
        onClick={handleNewRound}
        style={{
          position: 'absolute',
          top: 24,
          right: 24,
          zIndex: 10,
          padding: '0.7rem 2rem',
          borderRadius: '10px',
          background: 'linear-gradient(90deg, #388e3c 60%, #145a32 100%)',
          color: '#fff',
          border: 'none',
          fontWeight: 'bold',
          fontSize: '1.1rem',
          cursor: 'pointer',
          boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
          letterSpacing: '1px',
          transition: 'background 0.2s'
        }}
      >
        Nova Rodada
      </button>
      {/* Botão para avançar fase (admin/teste) */}
      <button
        onClick={handleNextPhase}
        style={{
          position: 'absolute',
          top: 70,
          right: 24,
          zIndex: 10,
          padding: '0.7rem 2rem',
          borderRadius: '10px',
          background: 'linear-gradient(90deg, #1976d2 60%, #0d47a1 100%)',
          color: '#fff',
          border: 'none',
          fontWeight: 'bold',
          fontSize: '1.1rem',
          cursor: 'pointer',
          boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
          letterSpacing: '1px',
          transition: 'background 0.2s'
        }}
      >
        Avançar Fase
      </button>
      {/* Chat */}
      {socketRef.current && (
        <div style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: 20
        }}>
          <Chat
            socket={socketRef.current}
            playerName={playerName}
            playerAvatar={playerAvatar}
            roomId={roomId}
          />
        </div>
      )}
    </PokerTable>
  );
};

export default Game;