import { useState, ChangeEvent, FormEvent } from 'react';
import { AuthApi } from '../service/api/auth.api.ts';
import { AuthWrapper } from '../components/auth-wrapper/authWrapper.tsx';
import { AuthLogo } from '../components/auth-logo/authLogo.tsx';

export const SignUpPage = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    secretKey: '',
  });

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    AuthApi.signUp({
      username: 'useName',
      password: 'SomePassword',
      secretKey: 'UHp3aKb40fwpoKZluZByWQ',
    });
    console.log('test-e', e);
  };

  return (
    <AuthWrapper>
      <div className='flex-1 flex flex-col relative overflow-hidden'>
        <main className='flex-1 flex items-center justify-center p-8 z-10'>
          <div className='bg-white bg-opacity-10 rounded-lg shadow-lg p-8 w-full max-w-md'>
            <h2 className='text-3xl font-bold text-white mb-6 text-center'>
              Register
            </h2>
            <form onSubmit={handleSubmit}>
              <div className='mb-4'>
                <input
                  type='text'
                  name='username'
                  placeholder='Username'
                  value={formData.username}
                  onChange={handleInputChange}
                  className='w-full px-4 py-2 rounded-md bg-white bg-opacity-20 text-white placeholder-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-500'
                />
              </div>
              <div className='mb-4'>
                <input
                  type='password'
                  name='password'
                  placeholder='Password'
                  value={formData.password}
                  onChange={handleInputChange}
                  className='w-full px-4 py-2 rounded-md bg-white bg-opacity-20 text-white placeholder-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-500'
                />
              </div>
              <div className='mb-6'>
                <input
                  type='text'
                  name='secretKey'
                  placeholder='Secret Key'
                  value={formData.secretKey}
                  onChange={handleInputChange}
                  className='w-full px-4 py-2 rounded-md bg-white bg-opacity-20 text-white placeholder-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-500'
                />
              </div>
              <div className='flex flex-col space-y-4'>
                <button
                  type='submit'
                  className='w-full bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition duration-300'>
                  Register
                </button>
                <button
                  type='button'
                  className='w-full bg-purple-500 text-white px-4 py-2 rounded-md hover:bg-purple-600 transition duration-300'>
                  Login
                </button>
              </div>
            </form>
          </div>
        </main>
        <AuthLogo />
      </div>
    </AuthWrapper>
  );
};
