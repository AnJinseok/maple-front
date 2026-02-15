import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { ErrorBoundary } from "./ErrorBoundary";
import { setStaticOriginOverride } from "./api/mapleApi";

/* ✅ 스타일 import */
import "./styles/layout.css";

const root = ReactDOM.createRoot(document.getElementById("root"));

// 화면을 먼저 그린 뒤 config는 비동기로 적용 (304/지연 시에도 화면이 바로 나오도록). 에러 시 흰 화면 대신 메시지 표시.
root.render(
    <ErrorBoundary>
        <App />
    </ErrorBoundary>
);

(async () => {
    try {
        const r = await fetch("/api/config", { cache: "no-store" });
        if (r.ok) {
            const d = await r.json();
            const origin = d?.data?.staticOrigin ?? d?.staticOrigin;
            if (origin && String(origin).trim()) setStaticOriginOverride(origin);
        }
    } catch (_) {}
})();
