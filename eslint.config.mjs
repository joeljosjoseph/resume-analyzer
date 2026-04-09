import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";

const eslintConfig = defineConfig([
  ...nextVitals,
  globalIgnores([
    ".next/**",
    ".next-app/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "tmp-next/**",
  ]),
]);

export default eslintConfig;
