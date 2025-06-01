import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const avatarOptions = ['🧑', '👩', '🧔', '👨‍🦰', '👩‍🦰', '🧑‍🦱', '👨‍🦳', '👩‍🦳', '🧑‍🦲', '👽', '🤖', '🐱', '🐶', '🦊', '🐵', '🐸', '🐼', '🐧', '🐷', '🦁', '🐯', '🐮', '🐨', '🐻', '🐰', '🐔', '🦄', '🐙', '🐢', '🐳', '🐲'];

const Register: React.FC = () => {
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState(avatarOptions[0]);
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('playerName', name);
    localStorage.setItem('playerAvatar', avatar);
    navigate('/game');
  };

  return (
    <form onSubmit={handleSubmit} style={{ textAlign: 'center', marginTop: '3rem' }}>
      <h2>Cadastro de Jogador</h2>
      <input
        type="text"
        placeholder="Seu nome"
        value={name}
        onChange={e => setName(e.target.value)}
        required
        style={{ fontSize: '1.2rem', padding: '0.5rem', borderRadius: '8px', marginBottom: '1rem' }}
      />
      <br />
      <div style={{ margin: '1rem 0' }}>
        <span style={{ fontSize: '1.1rem', marginRight: 8 }}>Avatar:</span>
        {avatarOptions.map(opt => (
          <button
            type="button"
            key={opt}
            onClick={() => setAvatar(opt)}
            style={{
              fontSize: '2rem',
              margin: '0 4px',
              border: avatar === opt ? '2px solid #388e3c' : '1px solid #ccc',
              borderRadius: '50%',
              background: avatar === opt ? '#e8f5e9' : '#fff',
              cursor: 'pointer',
              outline: 'none',
              padding: '2px 6px',
              transition: 'border 0.2s, background 0.2s',
            }}
          >
            {opt}
          </button>
        ))}
      </div>
      <button type="submit" style={{ fontSize: '1.2rem', padding: '0.5rem 2rem', borderRadius: '8px', background: '#388e3c', color: '#fff', border: 'none' }}>
        Entrar na Mesa
      </button>
    </form>
  );
};

export default Register;