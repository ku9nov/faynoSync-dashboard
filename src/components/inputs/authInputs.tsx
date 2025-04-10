import { FC } from 'react';
import { ErrorMessage, Field } from 'formik';

type AuthInputsProps = {
  name: string;
  type: string;
  placeholder: string;
};

export const AuthInputs: FC<AuthInputsProps> = ({
  name,
  type,
  placeholder,
}) => {
  return (
    <div>
      <Field
        name={name}
        type={type}
        placeholder={placeholder}
        className='w-full px-4 py-3 border border-theme-auth-input rounded-md focus:outline-none focus:ring-2 focus:ring-theme-auth-input font-sans'
      />
      <ErrorMessage
        name={name}
        component='div'
        className='text-theme-danger text-sm mt-1'
      />
    </div>
  );
};
