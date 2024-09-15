import { AuthWrapper } from '../components/auth-wrapper/authWrapper.tsx';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import { useNavigate } from 'react-router-dom';
import { AuthLogo } from '../components/auth-logo/authLogo.tsx';
import { AuthButton } from '../components/buttons/authButton.tsx';
import { AuthInputs } from '../components/inputs/authInputs.tsx';
import { AuthApi } from '../service/api/auth.api.ts';

interface FormValues {
  username: string;
  password: string;
  secretKey: string;
}

export const SignInPage = () => {
  const navigate = useNavigate();

  const initialValues: FormValues = {
    username: '',
    password: '',
    secretKey: '',
  };

  const validationSchema = Yup.object().shape({
    username: Yup.string()
      .min(3, 'Minimum 3 symbol')
      .required('Required field'),
    password: Yup.string()
      .min(6, 'Minimum 6 symbol')
      .required('Required field'),
    secretKey: Yup.string().required('Required field'),
  });

  const handleSubmit = (e: FormValues) => {
    AuthApi.signIn({
      username: e.username,
      password: e.password,
      secretKey: e.secretKey,
    });
  };

  return (
    <AuthWrapper>
      <div className='w-full md:w-1/2 flex items-center justify-center p-8'>
        <div className='bg-white bg-opacity-90  rounded-lg shadow-lg p-8 w-full max-w-md'>
          <h2 className='text-4xl font-bold mb-8 text-center text-purple-800 font-sans'>
            Register
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
                <AuthInputs
                  name='secretKey'
                  type='text'
                  placeholder='secretKey'
                />
                <div className='flex flex-col gap-3 mt-4'>
                  <AuthButton
                    type='submit'
                    text='Register'
                    onClick={() => {}}
                  />
                  <AuthButton
                    type='button'
                    text='Login'
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
    </AuthWrapper>
  );
};
