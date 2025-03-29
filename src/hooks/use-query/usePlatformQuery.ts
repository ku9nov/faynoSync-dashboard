import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axiosInstance from '../../config/axios';

export type Platform = {
  ID: string;
  PlatformName: string;
  Updated_at: string;
};

export const usePlatformQuery = () => {
  const queryClient = useQueryClient();

  const { data: platforms = [] } = useQuery<Platform[]>({
    queryKey: ['platforms'],
    queryFn: async () => {
      const response = await axiosInstance.get('/platform/list');
      return response.data.platforms;
    },
  });

  const createPlatformMutation = useMutation({
    mutationFn: async (platformName: string) => {
      const formData = new FormData();
      formData.append('data', JSON.stringify({ platform: platformName }));
      const response = await axiosInstance.post('/platform/create', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platforms'] });
    },
  });

  const createPlatform = async (platformName: string) => {
    await createPlatformMutation.mutateAsync(platformName);
  };

  const deletePlatformMutation = useMutation({
    mutationFn: async (platformId: string) => {
      await axiosInstance.delete(`/platform/delete?id=${platformId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platforms'] });
    },
  });

  const deletePlatform = async (platformId: string) => {
    await deletePlatformMutation.mutateAsync(platformId);
  };

  const updatePlatformMutation = useMutation({
    mutationFn: async ({ id, newName }: { id: string; newName: string }) => {
      const formData = new FormData();
      formData.append('data', JSON.stringify({ id, platform: newName }));
      const response = await axiosInstance.post('/platform/update', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platforms'] });
    },
  });

  const updatePlatform = async (id: string, newName: string) => {
    await updatePlatformMutation.mutateAsync({ id, newName });
  };

  return { platforms, deletePlatform, createPlatform, updatePlatform };
}; 