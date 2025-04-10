import { FC, PropsWithChildren } from 'react';

export const AuthLogo: FC<PropsWithChildren> = () => {
  return (
    <div className='w-full md:w-1/2 flex items-center justify-center'>
      <h1 className='text-6xl font-bold text-theme-primary font-sans'>FaynoSync</h1>
    </div>
  );
};
