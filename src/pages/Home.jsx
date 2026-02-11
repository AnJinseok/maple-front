import { NavLink } from "react-router-dom";

/**
 * 홈 화면 (사이드 메뉴와 동일한 템플릿: map-page + map-header + map-card)
 */
export default function Home() {
    const quickLinks = [
        { to: "/items", label: "가챠폰 목록", desc: "가챠 기계별 드랍 아이템·확률 조회" },
        { to: "/maps", label: "맵", desc: "맵별 몬스터·NPC 정보" },
        { to: "/monsters", label: "몬스터", desc: "몬스터 정보 및 드롭" },
        { to: "/quests", label: "퀘스트", desc: "퀘스트 목록 및 상세" }
    ];

    return (
        <div className="map-page">
            <div className="map-header">
                <h2>홈</h2>
                <p className="map-subtitle">메이플 데이터 기반 정보 플랫폼입니다. 아래 메뉴에서 원하는 항목을 선택하세요.</p>
            </div>

            <section className="map-card" style={{ maxWidth: "100%" }}>
                <div className="map-card-header">
                    <h3>바로가기</h3>
                </div>
                <div className="map-card-body">
                    <div className="home-cards">
                        {quickLinks.map(({ to, label, desc }) => (
                            <NavLink
                                key={to}
                                to={to}
                                className={({ isActive }) => `home-card ${isActive ? "active" : ""}`}
                            >
                                <h3>{label}</h3>
                                <p>{desc}</p>
                            </NavLink>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
}
