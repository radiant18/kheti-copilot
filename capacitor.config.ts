import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "in.kheti.copilot",
  appName: "Kheti",
  // Populated by `npm run build:mobile`, which runs Next's static export.
  webDir: "out",
  server: {
    androidScheme: "https",
  },
  android: {
    // Arecanut belt connectivity is poor; give slow responses room before the
    // WebView gives up on them.
    webContentsDebuggingEnabled: true,
  },
};

export default config;
