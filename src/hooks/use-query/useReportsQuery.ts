import { useQuery } from '@tanstack/react-query';
import axiosInstance from '@/config/axios';
import { PaginatedResponse } from '@/hooks/use-query/useAppsQuery';

export type ReportGroup = {
  id: string;
  group_hash: string;
  app_id: string;
  application: {
    name: string;
    version: string;
    channel: string;
  };
  system: {
    platform: string;
    arch: string;
  };
  event: {
    type: string;
    reason: string;
  };
  stats: {
    count: number;
    first_seen: string;
    last_seen: string;
    details_stored: number;
    details_rejected: number;
  };
  created_at: string;
  updated_at: string;
};

export type ReportBlob = {
  id: string;
  group_hash: string;
  app_id: string;
  application: {
    name: string;
    version: string;
    channel: string;
  };
  system: {
    platform: string;
    arch: string;
  };
  event: {
    type: string;
    reason: string;
  };
  storage: {
    driver: string;
    key: string;
    compressed_size: number;
    decompressed_size: number;
    content_type: string;
    encoding: string;
  };
  created_at: string;
  expires_at: string;
  url: string;
};

export type ReportFilters = {
  app?: string;
  version?: string;
  channel?: string;
  platform?: string;
  arch?: string;
  type?: string;
  reason?: string;
  from?: string;
  to?: string;
};

export const useReportsQuery = (page: number = 1, limit: number = 20, filters: ReportFilters = {}) => {
  const { data, isLoading, refetch } = useQuery<PaginatedResponse<ReportGroup>>({
    queryKey: ['reports', page, limit, filters],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      (Object.entries(filters) as [keyof ReportFilters, string | undefined][]).forEach(([key, value]) => {
        if (value) {
          params.append(key, value);
        }
      });
      const response = await axiosInstance.get(`/reports/groups?${params.toString()}`);
      return response.data;
    },
  });

  return { reports: data, isLoading, refetch };
};

export const useReportBlobsQuery = (groupHash: string | null) => {
  const { data, isLoading, refetch } = useQuery<{ items: ReportBlob[] }>({
    queryKey: ['report-blobs', groupHash],
    queryFn: async () => {
      const response = await axiosInstance.get(`/reports/groups/${groupHash}/blobs`);
      return response.data;
    },
    enabled: !!groupHash,
  });

  return { blobs: data?.items ?? [], isLoading, refetch };
};
