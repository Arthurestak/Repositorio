import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vite.dev/config/
export default defineConfig({
	plugins: [react()],
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "./src"),
		},
	},
	server: {
		host: '0.0.0.0',
		port: process.env.PORT ? parseInt(process.env.PORT) : 3000,
		strictPort: false,
	},
	preview: {
		host: '0.0.0.0',
		port: process.env.PORT ? parseInt(process.env.PORT) : 3000,
		strictPort: false,
	}
});
