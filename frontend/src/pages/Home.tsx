import React from 'react';
import { Link } from 'react-router-dom';

const Home: React.FC = () => (
  <div style={{ textAlign: 'center', marginTop: '3rem' }}>
    <h1>Bem-vindo ao Poker!</h1>
    <Link to="/register">
      <button
        style={{
          fontSize: '1.2rem',
          padding: '1rem 2rem',
          borderRadius: '8px',
          background: '#388e3c',
          color: '#fff',
          border: 'none'
        }}
      >
        Jogar Agora
      </button>
    </Link>
  </div>
);

export default Home;