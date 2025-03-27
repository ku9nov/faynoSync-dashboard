import { useQuery } from '@tanstack/react-query';
import axiosInstance from '../../config/axios';

export type Platform = {
  ID: string;
  PlatformName: string;
  Updated_at: string;
};

export const usePlatformQuery = () => {
  const { data: platforms = [] } = useQuery<Platform[]>({
    queryKey: ['platforms'],
    queryFn: async () => {
      const response = await axiosInstance.get('/platform/list');
      return response.data.platforms;
    },
  });

  return { platforms };
}; 