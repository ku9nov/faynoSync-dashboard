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
        className='w-full px-4 py-3 border border-purple-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 font-sans'
      />
      <ErrorMessage
        name={name}
        component='div'
        className='text-theme-danger text-sm mt-1'
      />
    </div>
  );
};
