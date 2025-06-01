import React, { useEffect, useRef, useState } from 'react';

interface ChatMessage {
  name: string;
  avatar: string;
  message: string;
  timestamp: number;
}

interface ChatProps {
  socket: any;
  playerName: string;
  playerAvatar: string;
  roomId: string;
}

const Chat: React.FC<ChatProps> = ({ socket, playerName, playerAvatar, roomId }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Recebe mensagens do backend
    const handleMsg = (msg: ChatMessage) => {
      setMessages(prev => [...prev, msg]);
    };
    socket.on('chatMessage', handleMsg);
    return () => {
      socket.off('chatMessage', handleMsg);
    };
  }, [socket]);

  useEffect(() => {
    // Scroll automático para a última mensagem
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      socket.emit('chatMessage', {
        roomId,
        name: playerName,
        avatar: playerAvatar,
        message: input.trim(),
      });
      setInput('');
    }
  };

  return (
    <div style={{
      position: 'absolute',
      right: 24,
      bottom: 24,
      width: 320,
      maxWidth: '90vw',
      background: '#222a',
      borderRadius: 12,
      boxShadow: '0 2px 8px #000a',
      zIndex: 20,
      display: 'flex',
      flexDirection: 'column',
      height: 320,
    }}>
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: 12,
        fontSize: '1rem',
        color: '#fff',
      }}>
        {messages.map((msg, i) => (
          <div key={i} style={{ marginBottom: 8, display: 'flex', alignItems: 'center' }}>
            <span style={{ fontSize: '1.3rem', marginRight: 6 }}>{msg.avatar}</span>
            <span style={{ fontWeight: 'bold', marginRight: 4 }}>{msg.name}:</span>
            <span>{msg.message}</span>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSend} style={{ display: 'flex', borderTop: '1px solid #444', padding: 8 }}>
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Digite sua mensagem..."
          style={{
            flex: 1,
            borderRadius: 8,
            border: '1px solid #888',
            padding: '6px 10px',
            fontSize: '1rem',
            marginRight: 8,
          }}
        />
        <button type="submit" style={{
          background: '#388e3c',
          color: '#fff',
          border: 'none',
          borderRadius: 8,
          padding: '6px 18px',
          fontWeight: 'bold',
          fontSize: '1rem',
          cursor: 'pointer',
        }}>Enviar</button>
      </form>
    </div>
  );
};

export default Chat;
