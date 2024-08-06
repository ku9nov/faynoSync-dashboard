import { FC, PropsWithChildren } from 'react';

export const AuthLogo: FC<PropsWithChildren> = () => {
  return (
    <div className='w-full md:w-1/2 flex items-center justify-center'>
      <h1 className='text-6xl font-bold text-white font-sans shadow-lg'>
        FaynoSync
      </h1>
    </div>
  );
};
