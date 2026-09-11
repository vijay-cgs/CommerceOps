import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{ts,tsx}",
    "../web/src/app/**/*.{ts,tsx}",
    "../web/src/components/**/*.{ts,tsx}",
    "../../packages/ui/src/**/*.{ts,tsx}",
  ],
  theme: { extend: {} },
  plugins: [],
};

export default config;
