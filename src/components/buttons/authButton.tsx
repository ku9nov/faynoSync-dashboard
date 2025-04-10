import { FC } from 'react';

type AuthButtonProps = {
  text: string;
  onClick: () => void;
  type?: 'submit' | 'button';
};

export const AuthButton: FC<AuthButtonProps> = ({
  text,
  onClick,
  type = 'submit',
}) => {
  return (
    <button
      type={type}
      onClick={onClick}
      className='w-full bg-theme-button-primary text-theme-primary px-4 py-2 rounded-md hover:bg-theme-input transition duration-300'>
      {text}
    </button>
  );
};
