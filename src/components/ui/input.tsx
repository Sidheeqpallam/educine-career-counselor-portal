import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', type, ...props }, ref) => {
    return <input type={type} className={`input ${className}`} ref={ref} {...props} />;
  },
);

Input.displayName = 'Input';

export { Input };
