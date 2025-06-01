import React from 'react';

interface CardProps {
  value: string; // Exemplo: 'A♠', '10♥', 'K♦'
}

const Card: React.FC<CardProps> = ({ value }) => (
  <div
    style={{
      width: '48px',
      height: '68px',
      background: '#fff',
      border: '1px solid #333',
      borderRadius: '8px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '1.5rem',
      margin: '0 4px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
      userSelect: 'none',
    }}
  >
    {value}
  </div>
);

export default Card;