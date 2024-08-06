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
      className='w-full bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition duration-300'>
      {text}
    </button>
  );
};
