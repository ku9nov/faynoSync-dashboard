import { AuthWrapper } from '../components/auth-wrapper/authWrapper.tsx';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import { useNavigate } from 'react-router-dom';
import { AuthLogo } from '../components/auth-logo/authLogo.tsx';
import { AuthButton } from '../components/buttons/authButton.tsx';
import { AuthInputs } from '../components/inputs/authInputs.tsx';

interface FormValues {
  username: string;
  password: string;
  confirmPassword: string;
  apiKey: string;
}

export const SignInPage = () => {
  const navigate = useNavigate();

  const initialValues: FormValues = {
    username: '',
    password: '',
    confirmPassword: '',
    apiKey: '',
  };

  const validationSchema = Yup.object().shape({
    username: Yup.string()
      .min(3, 'Минимальная длина 3 символа')
      .required('Обязательное поле'),
    password: Yup.string()
      .min(6, 'Минимальная длина 6 символов')
      .required('Обязательное поле'),
    confirmPassword: Yup.string()
      .oneOf([Yup.ref('password')], 'Пароли должны совпадать')
      .required('Обязательное поле'),
    apiKey: Yup.string().required('Обязательное поле'),
  });

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
              console.log(values);
            }}>
            {({}) => (
              <Form>
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
                <AuthInputs name='apiKey' type='text' placeholder='apiKey' />
                <div className='flex flex-col gap-4 mt-4'>
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
