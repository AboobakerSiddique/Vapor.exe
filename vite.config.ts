import { sites } from "@openai/sites-vite-plugin";
import vinext from "vinext";
import { nitro } from "nitro/vite";
import { defineConfig } from "vite";
import hostingConfig from "./.openai/hosting.json";
import tailwindcss from "@tailwindcss/vite";

const SITE_CREATOR_PLACEHOLDER_DATABASE_ID =
  "00000000-0000-4000-8000-000000000000";

const { d1, r2 } = hostingConfig;

// macOS Seatbelt blocks FSEvents, so Codex previews need polling for HMR.
const isCodexSeatbeltSandbox = process.env.CODEX_SANDBOX === "seatbelt";

// Vercel sets VERCEL=1 during its build.
const isVercel = process.env.VERCEL === "1";

const localBindingConfig = {
  main: "./worker/index.ts",
  compatibility_flags: ["nodejs_compat"],
  d1_databases: d1
    ? [
        {
          binding: d1,
          database_name: "site-creator-d1",
          database_id: SITE_CREATOR_PLACEHOLDER_DATABASE_ID,
        },
      ]
    : [],
  r2_buckets: r2
    ? [
        {
          binding: r2,
          bucket_name: "site-creator-r2",
        },
      ]
    : [],
};

export default defineConfig(async () => {
  process.env.WRANGLER_WRITE_LOGS ??= "false";
  process.env.WRANGLER_LOG_PATH ??= ".wrangler/logs";
  process.env.MINIFLARE_REGISTRY_PATH ??= ".wrangler/registry";

  const plugins = [
  tailwindcss(),
  vinext(),
  sites(),
   ];

  if (isVercel) {
    // Vercel deployment through Nitro.
    plugins.push(nitro());
  } else {
    // Keep the existing Cloudflare/OpenAI Sites development setup.
    const { cloudflare } = await import("@cloudflare/vite-plugin");

    plugins.push(
      cloudflare({
        viteEnvironment: {
          name: "rsc",
          childEnvironments: ["ssr"],
        },
        config: localBindingConfig,
      }),
    );
  }

  return {
    server: isCodexSeatbeltSandbox
      ? {
          watch: {
            useFsEvents: false,
            usePolling: true,
          },
        }
      : undefined,

    plugins,
  };
});