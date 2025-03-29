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

  const createArchitectureMutation = useMutation({
    mutationFn: async (archName: string) => {
      const formData = new FormData();
      formData.append('data', JSON.stringify({ arch: archName }));
      const response = await axiosInstance.post('/arch/create', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['architectures'] });
    },
  });

  const createArchitecture = async (archName: string) => {
    await createArchitectureMutation.mutateAsync(archName);
  };

  const deleteArchitectureMutation = useMutation({
    mutationFn: async (archName: string) => {
      await axiosInstance.delete(`/arch/delete?id=${archName}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['architectures'] });
    },
  });

  const deleteArchitecture = async (archName: string) => {
    await deleteArchitectureMutation.mutateAsync(archName);
  };

  const updateArchitectureMutation = useMutation({
    mutationFn: async ({ id, newName }: { id: string; newName: string }) => {
      const formData = new FormData();
      formData.append('data', JSON.stringify({ id, arch: newName }));
      const response = await axiosInstance.post('/arch/update', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['architectures'] });
    },
  });

  const updateArchitecture = async (id: string, newName: string) => {
    await updateArchitectureMutation.mutateAsync({ id, newName });
  };

  return { architectures, deleteArchitecture, createArchitecture, updateArchitecture };
};
