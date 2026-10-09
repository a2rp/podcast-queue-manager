import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
    base: "/podcast-queue-manager/",
    build: { sourcemap: false },
    plugins: [react()],
});