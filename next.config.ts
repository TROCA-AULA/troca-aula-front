import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    // Os testes E2E compilam numa pasta própria (.next-e2e), apontando para o
    // backend de teste, sem sobrescrever o build normal. Ver e2e/README.md.
    distDir: process.env.NEXT_DIST_DIR || '.next',
    compiler: {
        styledComponents: true,
    },
};

export default nextConfig;
