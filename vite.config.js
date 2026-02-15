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
        allowedHosts: ["maple85.ddns.net"],
        proxy: {
            "/api": { target: "http://127.0.0.1:19080", changeOrigin: true }
        },
        // 개발 중 304 방지: 항상 최신 파일 받도록 (화면 안 나오는 현상 방지)
        headers: {
            "Cache-Control": "no-store, no-cache, must-revalidate"
        }
    }
});