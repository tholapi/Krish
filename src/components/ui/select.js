import React from 'react';

export const Select = ({ value, onValueChange, children, disabled }) => {
  return (
    <select
      value={value}
      onChange={e => onValueChange(e.target.value)}
      disabled={disabled}
      style={{
        padding: '0.5rem',
        borderRadius: '0.25rem',
        border: '1px solid #ccc',
        width: '100%',
      }}
    >
      {children}
    </select>
  );
};

export const SelectItem = ({ value, children }) => {
  return <option value={value}>{children}</option>;
};

export const SelectTrigger = ({ children }) => <>{children}</>;
export const SelectValue = ({ placeholder }) => <option disabled value="">{placeholder}</option>;
export const SelectContent = ({ children }) => <>{children}</>;