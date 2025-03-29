import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axiosInstance from '../../config/axios';

export type Channel = {
  ID: string;
  ChannelName: string;
  Updated_at: string;
};

export const useChannelQuery = () => {
  const queryClient = useQueryClient();

  const { data: channels = [] } = useQuery<Channel[]>({
    queryKey: ['channels'],
    queryFn: async () => {
      const response = await axiosInstance.get('/channel/list');
      return response.data.channels;
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
    mutationFn: async (channelName: string) => {
      await axiosInstance.delete(`/channel/delete?id=${channelName}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['channels'] });
    },
  });

  const deleteChannel = async (channelName: string) => {
    await deleteChannelMutation.mutateAsync(channelName);
  };

  return { channels, deleteChannel, createChannel };
}; 