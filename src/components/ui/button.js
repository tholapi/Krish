import React from 'react';

export const Button = ({ children, ...props }) => {
  return (
    <button
      {...props}
      style={{
        padding: '0.5rem 1rem',
        borderRadius: '0.375rem',
        border: '1px solid #ccc',
        cursor: 'pointer',
        backgroundColor: '#f0f0f0',
      }}
    >
      {children}
    </button>
  );
};