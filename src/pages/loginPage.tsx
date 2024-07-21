export const LoginPage = () => {
  return (
    <div className='min-h-screen flex flex-col md:flex-row bg-gradient-to-b from-[#6a1b9a] to-[#ff8f00]'>
      <div className='w-full md:w-1/2 flex items-center justify-center p-8'>
        <div className='w-full max-w-md bg-white bg-opacity-90 rounded-lg shadow-xl p-8'>
          <h2 className='text-4xl font-bold mb-8 text-center text-purple-800 font-sans'>
            SignIn
          </h2>
          <form>
            <div className='mb-6'>
              <input
                type='text'
                name='username'
                placeholder='Username'
                className='w-full px-4 py-3 border border-purple-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 font-sans'
              />
            </div>
            <div className='mb-8'>
              <input
                type='password'
                name='password'
                placeholder='Password'
                className='w-full px-4 py-3 border border-purple-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 font-sans'
              />
            </div>
            <div className='flex flex-col space-y-4'>
              <button
                type='submit'
                className='w-full bg-purple-600 text-white py-3 rounded-md hover:bg-purple-700 transition duration-300 font-sans shadow-md'>
                Login
              </button>
              <button
                type='button'
                className='w-full bg-purple-200 text-purple-800 py-3 rounded-md hover:bg-purple-300 transition duration-300 font-sans shadow-md'>
                Register
              </button>
            </div>
          </form>
        </div>
      </div>
      <div className='w-full md:w-1/2 bg-gradient-to-b from-[#6a1b9a] to-[#ff8f00] flex items-center justify-center'>
        <h1 className='text-6xl font-bold text-white font-sans shadow-lg'>
          faynoSync
        </h1>
      </div>
    </div>
  );
};
