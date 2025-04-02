import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axiosInstance from '../../config/axios';

export type Channel = {
  ID: string;
  ChannelName: string;
  Updated_at: string;
};

export const useChannelQuery = () => {
  const queryClient = useQueryClient();

  const { data: channels = [], isLoading } = useQuery<Channel[]>({
    queryKey: ['channels'],
    queryFn: async () => {
      const response = await axiosInstance.get('/channel/list');
      return response.data.channels || [];
    },
  });

  const createChannelMutation = useMutation({
    mutationFn: async (channelName: string) => {
      const formData = new FormData();
      formData.append('data', JSON.stringify({ channel: channelName }));
      const response = await axiosInstance.post('/channel/create', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['channels'] });
    },
  });

  const createChannel = async (channelName: string) => {
    await createChannelMutation.mutateAsync(channelName);
  };

  const deleteChannelMutation = useMutation({
    mutationFn: async (channelId: string) => {
      await axiosInstance.delete(`/channel/delete?id=${channelId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['channels'] });
    },
  });

  const deleteChannel = async (channelId: string) => {
    await deleteChannelMutation.mutateAsync(channelId);
  };

  const updateChannelMutation = useMutation({
    mutationFn: async ({ id, newName }: { id: string; newName: string }) => {
      const formData = new FormData();
      formData.append('data', JSON.stringify({ id, channel: newName }));
      const response = await axiosInstance.post('/channel/update', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['channels'] });
    },
  });

  const updateChannel = async (id: string, newName: string) => {
    await updateChannelMutation.mutateAsync({ id, newName });
  };

  return { channels, deleteChannel, createChannel, updateChannel, isLoading };
}; 