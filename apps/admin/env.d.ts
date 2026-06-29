declare namespace NodeJS {
  interface ProcessEnv {
    NEXT_PUBLIC_API_URL?: string;
    NEXT_PUBLIC_MAP_TILES_URL?: string;
    NEXT_PUBLIC_OSRM_URL?: string;
    NODE_ENV: "development" | "production" | "test";
    VERCEL_URL?: string;
    API_UPSTREAM_URL?: string;
  }
}

declare const process: {
  env: NodeJS.ProcessEnv;
};
