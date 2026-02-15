import React from "react";

/**
 * 렌더 중 에러 시 흰 화면 대신 에러 메시지 표시
 */
export class ErrorBoundary extends React.Component {
    state = { error: null };

    static getDerivedStateFromError(error) {
        return { error };
    }

    componentDidCatch(error, info) {
        console.error("ErrorBoundary:", error, info);
    }

    render() {
        if (this.state.error) {
            return (
                <div style={{
                    padding: "24px",
                    margin: "20px",
                    background: "#fef2f2",
                    border: "1px solid #fecaca",
                    borderRadius: "8px",
                    color: "#991b1b",
                    fontFamily: "system-ui, sans-serif"
                }}>
                    <h2 style={{ margin: "0 0 12px 0", fontSize: "18px" }}>화면을 그리다 오류가 났습니다</h2>
                    <pre style={{ margin: 0, fontSize: "13px", overflow: "auto", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                        {this.state.error?.message ?? String(this.state.error)}
                    </pre>
                </div>
            );
        }
        return this.props.children;
    }
}
