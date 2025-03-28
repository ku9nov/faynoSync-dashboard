import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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

export type AppVersion = {
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

export type AppListItem = {
  ID: string;
  AppName: string;
  Logo: string;
  Updated_at: string;
};

export type PaginatedResponse<T> = {
  items: T[];
  total: number;
  page: number;
  limit: number;
};

export const useAppsQuery = (appName?: string, page: number = 1) => {
  const queryClient = useQueryClient();

  const { data: apps = [] } = useQuery<AppVersion[] | AppListItem[] | PaginatedResponse<AppVersion>>({
    queryKey: ['apps', appName, page],
    queryFn: async () => {
      if (appName) {
        const response = await axiosInstance.get(`/search?app_name=${appName}&limit=9&page=${page}`);
        return response.data;
      } else {
        const response = await axiosInstance.get('/app/list');
        return response.data.apps;
      }
    },
  });

  const updateAppMutation = useMutation({
    mutationFn: async ({ 
      id, 
      data 
    }: { 
      id: string; 
      data: { 
        Published: boolean; 
        Critical: boolean;
        Changelog: string;
        Platform?: string;
        Arch?: string;
        File?: File;
      } 
    }) => {
      const formData = new FormData();
      formData.append('publish', data.Published.toString());
      formData.append('critical', data.Critical.toString());
      formData.append('changelog', data.Changelog);
      formData.append('id', id);
      
      if (data.Platform) {
        formData.append('platform', data.Platform);
      }
      
      if (data.Arch) {
        formData.append('arch', data.Arch);
      }
      
      if (data.File) {
        formData.append('file', data.File);
      }

      await axiosInstance.post(`/apps/update`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['apps'] });
    },
  });

  const deleteAppMutation = useMutation({
    mutationFn: async (id: string) => {
      await axiosInstance.delete(`/apps/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['apps'] });
    },
  });

  const updateApp = async (id: string, data: {
    Published: boolean;
    Critical: boolean;
    Changelog: string;
    Platform?: string;
    Arch?: string;
    File?: File;
  }) => {
    await updateAppMutation.mutateAsync({ id, data });
  };

  const deleteApp = async (id: string) => {
    await deleteAppMutation.mutateAsync(id);
  };

  return { apps, updateApp, deleteApp };
}; 