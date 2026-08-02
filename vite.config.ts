import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv, type Plugin } from "vite";

const normalizeSiteUrl = (value: string) => value.trim().replace(/\/+$/, "");

const siteMetaPlugin = (siteUrl: string): Plugin => ({
  name: "site-meta-url",
  transformIndexHtml(html) {
    return html.replaceAll("__SITE_URL__", siteUrl);
  },
});

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, ".", "");
  const siteUrl = normalizeSiteUrl(env.SITE_URL || env.CF_PAGES_URL || "");

  return {
    plugins: [react(), siteMetaPlugin(siteUrl)],
    build: {
      target: "es2022",
    },
  };
});
