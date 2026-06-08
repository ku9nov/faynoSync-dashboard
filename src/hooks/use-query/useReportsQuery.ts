import { useQuery } from '@tanstack/react-query';
import axiosInstance from '../../config/axios';
import { PaginatedResponse } from './useAppsQuery';

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

export const useReportsQuery = (page: number = 1, limit: number = 20) => {
  const { data, isLoading, refetch } = useQuery<PaginatedResponse<ReportGroup>>({
    queryKey: ['reports', page, limit],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
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
