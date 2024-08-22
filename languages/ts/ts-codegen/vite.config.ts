import viteTsConfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

export default defineConfig({
    cacheDir: "../../../node_modules/.vite/languages/ts/ts-codegen",

    plugins: [
        viteTsConfigPaths({
            root: "../../../",
        }),
    ],

    // Uncomment this if you are using workers.
    // worker: {
    //  plugins: [
    //    viteTsConfigPaths({
    //      root: '../../',
    //    }),
    //  ],
    // },

    test: {
        pool: "threads",
        poolOptions: {
            threads: {
                singleThread: true,
            },
        },
        globals: true,
        reporters: ["default", "html"],
        outputFile: ".temp/test-results/index.html",
        environment: "node",
        include: ["src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
    },
});
