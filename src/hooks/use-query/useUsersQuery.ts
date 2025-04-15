import { useQuery } from '@tanstack/react-query';
import axiosInstance from '../../config/axios';

interface UserData {
  username: string;
  is_admin: boolean;
}

export const useUsersQuery = () => {
  return useQuery<UserData>({
    queryKey: ['user'],
    queryFn: async () => {
      const response = await axiosInstance.get('/whoami');
      return response.data;
    },
    gcTime: Infinity, // Keep the data in cache indefinitely
    staleTime: Infinity, // This ensures we don't refetch unless explicitly invalidated
  });
}; 