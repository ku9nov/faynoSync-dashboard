import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axiosInstance from '../../config/axios';

export type Architecture = {
  ID: string;
  ArchID: string;
  Updated_at: string;
};

export const useArchitectureQuery = () => {
  const queryClient = useQueryClient();

  const { data: architectures = [] } = useQuery<Architecture[]>({
    queryKey: ['architectures'],
    queryFn: async () => {
      const response = await axiosInstance.get('/arch/list');
      return response.data.archs;
    },
  });

  const deleteArchitectureMutation = useMutation({
    mutationFn: async (archName: string) => {
      await axiosInstance.delete(`/arch/${archName}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['architectures'] });
    },
  });

  const deleteArchitecture = async (archName: string) => {
    await deleteArchitectureMutation.mutateAsync(archName);
  };

  return { architectures, deleteArchitecture };
};
