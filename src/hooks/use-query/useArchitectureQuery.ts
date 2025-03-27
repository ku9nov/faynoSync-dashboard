import { useEffect, useState } from 'react';
import axios from 'axios';
import { env } from '../../config/env';

const token =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NDMxMDEwODcsInVzZXJuYW1lIjoidm92YXN5QGdtYWlsLmNvbSJ9.06Ono5dW4QnU4D2G9COc3j6a0LD666hdfmkXx89IyGw';

type Architectures = {
  ID: string;
  ArchID: string;
  Updated_at: string;
};

export const useArchitectureQuery = () => {
  const [architectures, setArchitectures] = useState<[] | Architectures[]>([]);

  useEffect(() => {
    getArchitecture();
  }, []);

  const getArchitecture = async () => {
    try {
      const response = await axios.get(`${env.API_URL}/arch/list`, {
        headers: {
          Authorization: 'Bearer ' + token,
        },
      });
      setArchitectures(response.data.archs);
    } catch (error) {
      console.error('Get architecture', error);
    }
  };

  return { architectures };
};
