import { NavLink } from "react-router-dom";
import { useWorld } from "../contexts/WorldContext";

/**
 * 홈 화면 — 크로노스토리 선택 시에만 바로가기 카드 표시, 메이플랜드일 때는 안내만
 */
export default function Home() {
    const { world } = useWorld();
    const isChronoStory = world === "크로노스토리";
    /* 사이드바 메뉴 순서와 동일 */
    const quickLinks = [
        { to: "/maps", label: "맵", desc: "맵별 몬스터·NPC 정보" },
        { to: "/monsters", label: "몬스터", desc: "몬스터 정보 및 드롭" },
        { to: "/quests", label: "퀘스트", desc: "퀘스트 목록 및 상세" },
        ...(isChronoStory ? [{ to: "/items", label: "가챠폰 목록", desc: "가챠 기계별 드랍 아이템·확률 조회" }] : []),
        ...(isChronoStory ? [{ to: "/chronostory/magic-accuracy", label: "마법 명중률", desc: "크로노스토리 마법 명중률 계산" }] : []),
        ...(isChronoStory ? [{ to: "/random-equipment-stats", label: "랜덤 장비 스탯", desc: "장비 랜덤 스탯 범위·시뮬레이션" }] : []),
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
