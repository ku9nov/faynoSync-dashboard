import { FC, PropsWithChildren } from 'react';
import { AnimatedBanner } from './AnimatedBanner';

export const AuthLogo: FC<PropsWithChildren> = () => {
  return (
    <div className='w-full md:w-2/3 lg:w-3/4 flex items-center justify-center min-h-[400px]'>
      <AnimatedBanner />
    </div>
  );
};
