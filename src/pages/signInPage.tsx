import { useState } from 'react';
import * as Yup from 'yup';
import { useNavigate } from 'react-router-dom';
import { Formik, Form } from 'formik';
import { AuthWrapper } from '../components/auth-wrapper/authWrapper.tsx';
import { AuthLogo } from '../components/auth-logo/authLogo.tsx';
import { AuthButton } from '../components/buttons/authButton.tsx';
import { AuthInputs } from '../components/inputs/authInputs.tsx';
import { useAuth } from '../providers/authProvider.tsx';

interface FormValues {
  username: string;
  password: string;
}

export const SignInPage = () => {
  const [respError, setRespError] = useState<string>('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const initialValues: FormValues = {
    username: '',
    password: '',
  };

  const validationSchema = Yup.object().shape({
    username: Yup.string()
      .min(3, 'Minimum 3 symbol')
      .required('Required field'),
    password: Yup.string()
      .min(6, 'Minimum 6 symbol')
      .required('Required field'),
  });

  const handleSubmit = async (e: FormValues) => {
    if (respError) {
      setRespError('');
    }
    try {
      await login({ username: e.username, password: e.password });
      navigate('/board');
    } catch (error: any) {
      setRespError(error);
    }
  };

  return (
    <AuthWrapper>
      <div className='flex md:flex-row flex-col-reverse w-full'>
        <div className='w-full md:w-1/2 flex items-center justify-center p-8'>
          <div className='bg-white bg-opacity-90  rounded-lg shadow-lg p-8 w-full max-w-md'>
            <h2 className='text-4xl font-bold mb-8 text-center text-purple-800 font-sans'>
              SignIn
            </h2>
            <Formik
              initialValues={initialValues}
              validationSchema={validationSchema}
              onSubmit={(values: FormValues) => {
                handleSubmit(values);
              }}>
              {({}) => (
                <Form className='flex flex-col gap-3'>
                  <AuthInputs
                    name='username'
                    type='text'
                    placeholder='Username'
                  />
                  <AuthInputs
                    name='password'
                    type='Password'
                    placeholder='password'
                  />
                  <div className='w-full text-red-600 text-center'>
                    {respError && respError}
                  </div>
                  <div className='flex flex-col gap-3 mt-4'>
                    <AuthButton type='submit' text='Login' onClick={() => {}} />
                    <AuthButton
                      type='button'
                      text='Register'
                      onClick={() => {
                        navigate('/signup');
                      }}
                    />
                  </div>
                </Form>
              )}
            </Formik>
          </div>
        </div>
        <AuthLogo />
      </div>
    </AuthWrapper>
  );
};
