import React from 'react';
import './PokerTable.css';

interface PokerTableProps {
  children?: React.ReactNode;
}

const PokerTable: React.FC<PokerTableProps> = ({ children }) => {
  return (
    <div className="poker-table-background">
      <div className="poker-table">
        {children}
      </div>
    </div>
  );
};

export default PokerTable;