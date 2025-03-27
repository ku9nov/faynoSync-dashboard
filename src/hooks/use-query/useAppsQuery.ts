import { useQuery } from '@tanstack/react-query';
import axiosInstance from '../../config/axios';

export type Artifact = {
  link: string;
  platform: string;
  arch: string;
  package: string;
};

export type ChangelogEntry = {
  Version: string;
  Changes: string;
  Date: string;
};

export type App = {
  ID: string;
  AppName: string;
  Version: string;
  Channel: string;
  Published: boolean;
  Critical: boolean;
  Artifacts: Artifact[];
  Changelog: ChangelogEntry[];
  Updated_at: string;
};

export const useAppsQuery = () => {
  const { data: apps = [] } = useQuery<App[]>({
    queryKey: ['apps'],
    queryFn: async () => {
      const response = await axiosInstance.get('/');
      return response.data.apps;
    },
  });

  return { apps };
}; 