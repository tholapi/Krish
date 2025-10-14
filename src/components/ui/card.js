import React from 'react';

export const Card = ({ children, ...props }) => {
  return (
    <div
      {...props}
      style={{
        border: '1px solid #ddd',
        borderRadius: '0.5rem',
        padding: '1rem',
        marginBottom: '1rem',
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
      }}
    >
      {children}
    </div>
  );
};

export const CardContent = ({ children, ...props }) => {
  return <div {...props}>{children}</div>;
};