import { useQuery } from '@tanstack/react-query';
import axiosInstance from '../../config/axios';

export type Channel = {
  ID: string;
  ChannelName: string;
  Updated_at: string;
};

export const useChannelQuery = () => {
  const { data: channels = [] } = useQuery<Channel[]>({
    queryKey: ['channels'],
    queryFn: async () => {
      const response = await axiosInstance.get('/channel/list');
      return response.data.channels;
    },
  });

  return { channels };
}; 