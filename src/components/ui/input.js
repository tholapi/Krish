import React from 'react';

export const Input = (props) => {
  return (
    <input
      {...props}
      style={{
        padding: '0.5rem',
        borderRadius: '0.25rem',
        border: '1px solid #ccc',
        width: '100%',
      }}
    />
  );
};