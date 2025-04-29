import { FC, PropsWithChildren } from 'react';

export const AuthLogo: FC<PropsWithChildren> = () => {
  return (
    <div className='w-full md:w-1/2 flex items-center justify-center'>
      <img 
        src="/banner.png" 
        alt="FaynoSync Logo" 
        className="max-w-full h-auto"
      />
    </div>
  );
};
