import axios from 'axios';

class _AuthApi {
  signUp = ({
    username,
    password,
    secretKey,
  }: {
    username: string;
    password: string;
    secretKey: string;
  }) => {
    axios
      .post(
        'http://localhost:9000/signup',
        {
          username,
          password,
          api_key: secretKey,
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )
      .then((response: any) => {
        console.log('Success:', response.data);
      })
      .catch((error: any) => {
        console.error('Error:', error);
      });
  };

  signIn = ({
    username,
    password,
    secretKey,
  }: {
    username: string;
    password: string;
    secretKey: string;
  }) => {
    // axios
    //   .post(
    //     'http://localhost:9000/signup',
    //     {
    //       username,
    //       password,
    //       api_key: secretKey,
    //     },
    //     {
    //       headers: {
    //         'Content-Type': 'application/json',
    //       },
    //     }
    //   )
    //   .then((response: any) => {
    //     console.log('Success:', response.data);
    //   })
    //   .catch((error: any) => {
    //     console.error('Error:', error);
    //   });
  };
}

const AuthApi = new _AuthApi();

export { AuthApi };
