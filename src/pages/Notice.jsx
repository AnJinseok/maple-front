/**
 * 공지사항 페이지
 * - 입력: 없음
 * - 출력: JSX(Element)
 * - 서비스 공지 목록 표시 (추후 API/데이터 연동 가능)
 */
export default function Notice() {
    return (
        <div className="map-page">
            <div className="map-header">
                <h2>공지사항</h2>
                <p className="map-subtitle">서비스 공지 및 업데이트 소식을 확인하세요.</p>
            </div>

            <section className="map-card" style={{ maxWidth: "100%" }}>
                <div className="map-card-header">
                    <h3>공지 목록</h3>
                </div>
                <div className="map-card-body">
                    <p style={{ color: "var(--app-muted-text-color)" }}>등록된 공지가 없습니다.</p>
                </div>
            </section>
        </div>
    );
}
