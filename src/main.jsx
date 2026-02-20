import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { ErrorBoundary } from "./ErrorBoundary";

/* ✅ 스타일 import */
import "./styles/layout.css";

const root = ReactDOM.createRoot(document.getElementById("root"));

// /api/config는 이미지 등 정적 오리진이 필요할 때만 mapleApi에서 한 번 호출 (홈만 열어두면 nginx 호출 없음)
root.render(
    <ErrorBoundary>
        <App />
    </ErrorBoundary>
);
