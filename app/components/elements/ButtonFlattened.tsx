import {Link} from '@remix-run/react';
import {twMerge} from 'tailwind-merge';

interface ButtonFlattenedProps {
  children: React.ReactNode;
  className?: string;
  color?: 'primary' | 'secondary' | 'warning' | 'error' | 'soldout';
  size?: 'small' | 'middle' | 'large';
  href?: string;
  disabled?: boolean;
  onClick?: () => void;
  type?: 'submit';
}

const colors = {
  primary: 'bg-red-600 text-white hover:bg-red-500',
  secondary: 'bg-black text-white hover:bg-red-500',
  warning: 'bg-[#ff8c00] text-black',
  error: 'bg-[#ff0000] text-white',
  soldout: 'bg-[#fff] text-gray-400 border border-gray-400',
};

const sizes = {
  small: 'px-4 py-2 text-[14px]',
  middle: 'px-4 py-2 text-[18px]',
  large: 'px-4 py-2 text-[24px]',
};

const ButtonFlattened: React.FC<ButtonFlattenedProps> = ({
  children,
  className,
  onClick,
  href,
  disabled,
  color = 'primary',
  size = 'middle',
  type,
}) => {
  const content = (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={twMerge(
        'flex w-fit justify-center items-center gap-2 font-inter uppercase',
        colors[color],
        sizes[size],
        className,
      )}
    >
      {children}
    </button>
  );
  return href ? <Link to={href}>{content}</Link> : content;
};

export default ButtonFlattened;
