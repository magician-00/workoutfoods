import {motion} from 'framer-motion';
import {IconBaseProps, IconType} from 'react-icons/lib';
import {twMerge} from 'tailwind-merge';
import clsx from 'clsx';

type ButtonProps = {
  children?: React.ReactNode;
  className?: string;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  Icon?: IconType;
  iconProps?: IconBaseProps;
  variant?: 'default' | 'contained' | 'outlined' | 'icon' | 'link';
  color?: 'primary' | 'secondary' | 'warning' | 'error';
  disabled?: boolean;
  badge?: string;
  href?: string;
  name?: string;
  value?: string | number;
  onChange?: () => void;
  type?: 'button' | 'submit' | 'reset';
};

const variantClsx: {[key: string]: string} = {
  default: 'text-[18px]',
  contained: 'text-[18px] font-inter uppercase w-full rounded-[100px]',
  outlined:
    'text-[18px] text-white border border-black uppercase w-full rounded-[100px]',
  icon: '',
  link: 'text-[16px] uppercase underline w-full',
};

const colorClsx: {[key: string]: string} = {
  primary: 'bg-black text-white',
  secondary: 'bg-[#fef100] text-black',
};

export default function Button({
  variant = 'default',
  disabled = false,
  children,
  color = 'primary',
  Icon,
  name,
  value,
  iconProps,
  className,
  href,
  onClick,
  type,
  badge,
}: ButtonProps) {
  const content = (
    <button
      type={type}
      name={name}
      value={value}
      className={twMerge(
        'group text-center',
        variantClsx[variant],
        clsx({
          [colorClsx[color]]: ['contained'].includes(variant),
          'bg-gray-300': disabled,
          relative: !!badge,
        }),
        className,
      )}
      onClick={disabled ? undefined : onClick}
    >
      {Icon ? (
        <Icon
          {...iconProps}
          className={twMerge(
            'group-hover:text-[#575757]',
            iconProps?.className,
          )}
        />
      ) : variant !== 'link' ? (
        <motion.div
          className={clsx('flex items-center justify-center', {
            'py-6': ['contained', 'outlined'].includes(variant),
            'pointer-events-none': disabled,
          })}
          whileHover={{scale: 1.1}}
          whileTap={{scale: 0.9}}
        >
          {children}
        </motion.div>
      ) : (
        children
      )}
      {badge && (
        <motion.div
          key={badge}
          initial={{scale: 0.5}}
          animate={{scale: 1}}
          transition={{type: 'spring', duration: 0.3}}
          className="absolute -right-1 -top-1 inline-flex h-4 w-4 items-center justify-center rounded-full border border-white bg-red-500 text-[10px] font-bold text-white"
        >
          {badge}
        </motion.div>
      )}
    </button>
  );
  return href ? <a href={href}>{content}</a> : content;
}
