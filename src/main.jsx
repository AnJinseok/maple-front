import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { setStaticOriginOverride } from "./api/mapleApi";

/* ✅ 스타일 import */
import "./styles/layout.css";

const root = ReactDOM.createRoot(document.getElementById("root"));

(async () => {
    try {
        const r = await fetch("/api/config");
        if (r.ok) {
            const d = await r.json();
            const origin = d?.data?.staticOrigin ?? d?.staticOrigin;
            if (origin && String(origin).trim()) setStaticOriginOverride(origin);
        }
    } catch (_) {}
    root.render(<App />);
})();
