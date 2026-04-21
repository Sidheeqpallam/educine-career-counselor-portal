import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  children: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'default', size = 'default', children, ...props }, ref) => {
    const getVariantClass = () => {
      switch (variant) {
        case 'default':
          return 'btn-primary';
        case 'destructive':
          return 'btn-danger';
        case 'outline':
          return 'btn-outline';
        default:
          return 'btn-primary';
      }
    };

    return (
      <button className={`btn ${getVariantClass()} ${className}`} ref={ref} {...props}>
        {children}
      </button>
    );
  },
);

Button.displayName = 'Button';

export { Button };
