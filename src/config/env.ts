export const env = {
  API_URL: import.meta.env.VITE_API_URL,
  PORT: import.meta.env.VITE_PORT,
  TUF_METADATA_URL: import.meta.env.VITE_TUF_METADATA_URL,
} as const;
