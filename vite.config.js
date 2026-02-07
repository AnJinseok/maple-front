import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
    plugins: [react()],
    resolve: {
        dedupe: ["react", "react-dom"]
    },
    server: {
        host: true,   // 0.0.0.0 — 외부에서 접속 가능
        port: 5173,   // 개발 서버 포트 (방화벽에서 열어야 함)
        allowedHosts: ["maple85.ddns.net"]
    }
});