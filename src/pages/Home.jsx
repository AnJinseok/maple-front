export default function Home() {
    return (
        <div className="home">
            {/* Title */}
            <section className="home-header">
                <h1>MapleLand</h1>
                <p>메이플 데이터 기반 정보 플랫폼</p>
            </section>

            {/* Quick Menu */}
            <section className="home-cards">
                <div className="home-card">
                    <h3>아이템</h3>
                    <p>아이템 시세 및 정보 조회</p>
                </div>

                <div className="home-card">
                    <h3>거래소</h3>
                    <p>최근 거래 내역 확인</p>
                </div>

                <div className="home-card">
                    <h3>길드</h3>
                    <p>길드 정보 및 랭킹</p>
                </div>
            </section>
        </div>
    );
}
