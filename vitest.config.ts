/// <reference types="vitest" />

import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./test/setup.ts",
    // exclude: [
    //   "**/node_modules/**",
    //   "**/dist/**",
    //   "**/cypress/**",
    //   "**/.{ideas,git,cache,output,temp}/**",
    //   "./app/components/ui/**",
    // ],
    coverage: {
      exclude: [
        "coverage/**",
        "dist/**",
        "packages/*/test?(s)/**",
        "**/*.d.ts",
        "**/virtual:*",
        "**/__x00__*",
        "**/\x00*",
        "cypress/**",
        "test?(s)/**",
        "test?(-*).?(c|m)[jt]s?(x)",
        "**/*{.,-}{test,spec}.?(c|m)[jt]s?(x)",
        "**/__tests__/**",
        "**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build}.config.*",
        "**/.{eslint,mocha,prettier}rc.{?(c|m)js,yml}",

        "app/components/ui/**",
      ],
      lines: 70,
      functions: 60,
      branches: 70,
      statements: 70,
    },
  },
});
