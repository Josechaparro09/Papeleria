// src/components/Recharges.tsx
import React from 'react';
import { formatDateColombia } from '../utils/dateHelper';

const Recharges: React.FC = () => {
  const date = new Date();
  const formattedDate = formatDateColombia(date, 'dd/MM/yyyy');

  return (
    <div>
      <h1>Fecha Formateada</h1>
      <p>{formattedDate}</p>
    </div>
  );
};

export default Recharges;
