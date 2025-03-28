import { useState } from 'react';
import * as Yup from 'yup';
import { useNavigate } from 'react-router-dom';
import { Form, Formik, FormikHelpers } from 'formik';
import { AuthWrapper } from '../components/auth-wrapper/authWrapper.tsx';
import { AuthInputs } from '../components/inputs/authInputs.tsx';
import { AuthButton } from '../components/buttons/authButton.tsx';
import { useToast } from '../hooks/useToast.ts';
import { AuthLogo } from '../components/auth-logo/authLogo.tsx';
import { useAuth } from '../providers/authProvider.tsx';

interface FormValues {
  username: string;
  password: string;
  confirmPassword: string;
  secretKey: string;
}

export const SignUpPage = () => {
  const navigate = useNavigate();
  const { signUp } = useAuth();
  const { toastSuccess } = useToast();
  const [respError, setRespError] = useState<string>('');

  const initialValues: FormValues = {
    username: '',
    password: '',
    confirmPassword: '',
    secretKey: '',
  };

  const validationSchema = Yup.object().shape({
    username: Yup.string()
      .min(3, 'Minimum 3 symbol')
      .required('Required field'),
    password: Yup.string()
      .min(6, 'Minimum 6 symbol')
      .required('Required field'),
    confirmPassword: Yup.string()
      .oneOf([Yup.ref('password')], 'Passwords must match')
      .required('Required field'),
    secretKey: Yup.string().required('Required field'),
  });

  const handleSubmit = async (
    e: FormValues,
    formikHelpers: FormikHelpers<FormValues>
  ) => {
    const { resetForm } = formikHelpers;
    try {
      await signUp({
        username: e.username,
        password: e.password,
        secretKey: e.secretKey,
      });
      toastSuccess('Signed Up successfully.');
      navigate('/applications');
      resetForm();
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
              Register
            </h2>
            <Formik
              initialValues={initialValues}
              validationSchema={validationSchema}
              onSubmit={(
                values: FormValues,
                formikHelpers: FormikHelpers<FormValues>
              ) => {
                handleSubmit(values, formikHelpers);
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
                    name='confirmPassword'
                    type='password'
                    placeholder='Confirm Password'
                  />
                  <AuthInputs
                    name='secretKey'
                    type='password'
                    placeholder='secretKey'
                  />
                  <div className='w-full text-red-600 text-center'>
                    {respError && respError}
                  </div>
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
                        navigate('/signin');
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
