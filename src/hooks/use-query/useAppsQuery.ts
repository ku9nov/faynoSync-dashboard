import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axiosInstance from '../../config/axios';

export type Artifact = {
  ID: string;
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
  Description: string;
  Updated_at: string;
  isExpanded?: boolean;
};

export type PaginatedResponse<T> = {
  items: T[];
  total: number;
  page: number;
  limit: number;
};

export const useAppsQuery = (appName?: string, page: number = 1, refreshKey: number = 0) => {
  const queryClient = useQueryClient();

  const { data: apps = [] } = useQuery<AppVersion[] | AppListItem[] | PaginatedResponse<AppVersion>>({
    queryKey: ['apps', appName, page, refreshKey],
    queryFn: async () => {
      if (appName) {
        const response = await axiosInstance.get(`/search?app_name=${appName}&limit=9&page=${page}`);
        return response.data;
      } else {
        const response = await axiosInstance.get('/app/list');
        return response.data.apps || [];
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
        Files?: File[];
        app_name: string;
        version: string;
        channel: string;
      } 
    }) => {
      const formData = new FormData();
      const dataObj = {
        id,
        app_name: data.app_name,
        version: data.version,
        channel: data.channel,
        publish: data.Published,
        critical: data.Critical,
        platform: data.Platform,
        arch: data.Arch,
        changelog: data.Changelog
      };
      
      formData.append('data', JSON.stringify(dataObj));
      
      if (data.Files && data.Files.length > 0) {
        data.Files.forEach((file) => {
          formData.append('file', file);
        });
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
      await axiosInstance.delete(`/apps/delete?id=${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['apps'] });
    },
  });

  const deleteArtifactMutation = useMutation({
    mutationFn: async ({ 
      id, 
      appName, 
      version, 
      artifactIndex 
    }: { 
      id: string; 
      appName: string; 
      version: string; 
      artifactIndex: number;
    }) => {
      const formData = new FormData();
      const data = {
        id,
        app_name: appName,
        version,
        artifacts_to_delete: [artifactIndex.toString()]
      };
      formData.append('data', JSON.stringify(data));

      await axiosInstance.post('/artifact/delete', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
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
    Files?: File[];
    app_name: string;
    version: string;
    channel: string;
  }) => {
    await updateAppMutation.mutateAsync({ id, data });
  };

  const deleteApp = async (id: string) => {
    await deleteAppMutation.mutateAsync(id);
  };

  const deleteArtifact = async (id: string, appName: string, version: string, artifactIndex: number) => {
    await deleteArtifactMutation.mutateAsync({ id, appName, version, artifactIndex });
  };

  const getVersionById = (id: string): AppVersion | undefined => {
    
    if (Array.isArray(apps)) {
      const found = apps.find(app => app.ID === id) as AppVersion;
      return found;
    }
    if ('items' in apps) {
      const found = apps.items.find(app => app.ID === id) as AppVersion;
      return found;
    }
    return undefined;
  };

  return { apps, updateApp, deleteApp, getVersionById, deleteArtifact };
}; 