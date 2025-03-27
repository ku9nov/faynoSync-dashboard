import { useQuery } from '@tanstack/react-query';
import axiosInstance from '../../config/axios';

export type Architecture = {
  ID: string;
  ArchID: string;
  Updated_at: string;
};

export const useArchitectureQuery = () => {
  const { data: architectures = [] } = useQuery<Architecture[]>({
    queryKey: ['architectures'],
    queryFn: async () => {
      const response = await axiosInstance.get('/arch/list');
      return response.data.archs;
    },
  });

  return { architectures };
};
