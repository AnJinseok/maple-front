import { useState, useMemo } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useWorld } from "../../contexts/WorldContext";
import { WORLD_SUGGESTIONS } from "../../constants/worldOptions";

/** 현재 경로가 속한 그룹 키 반환: "home" | "notice" | "gameEditor" | "maple" */
function getGroupKeyByPath(pathname) {
    if (pathname === "/" || pathname === "") return "home";
    if (pathname.startsWith("/notice")) return "notice";
    if (pathname.startsWith("/big-ambitions-editor")) return "gameEditor";
    return "maple";
}

/**
 * 좌측 사이드 메뉴(탭)
 * - 입력: isOpen(boolean), onToggle(function) — 열림 여부, 토글 콜백
 * - 출력: JSX(Element)
 * - 상단: 홈 버튼(단일 링크), 그룹: 게임 에디터 / 메이플 (그룹별 펼침/접힘)
 * - 크로노스토리 선택 시에만: 가챠폰 목록, 마법 명중률, 랜덤 장비 스탯 시뮬레이션 표시
 */
export default function SideMenu({ isOpen, onToggle }) {
    const { world } = useWorld();
    const location = useLocation();

    /** 월드 추천 목록(빈 값 제거 + 정렬) */
    const worldSuggestionList = useMemo(() => {
        const list = Array.isArray(WORLD_SUGGESTIONS) ? WORLD_SUGGESTIONS : [];
        return list
            .filter(Boolean)
            .map((v) => String(v).trim())
            .filter((v) => v !== "")
            .filter((value, index, array) => array.indexOf(value) === index)
            .sort((a, b) => a.localeCompare(b, "ko"));
    }, []);

    /** 현재 선택 월드(목록에 없으면 첫 옵션으로 보정) */
    const selectedWorld = useMemo(() => {
        if (!Array.isArray(worldSuggestionList) || worldSuggestionList.length === 0) return world;
        if (worldSuggestionList.includes(world)) return world;
        return worldSuggestionList[0];
    }, [world, worldSuggestionList]);

    /** 그룹별 펼침 상태: true = 열림, false = 접힘 (홈은 상단 단일 버튼으로 별도) */
    const [groupOpen, setGroupOpen] = useState({ gameEditor: true, maple: true });
    /** 메이플 내 월드별 섹션 펼침: 크로노스토리·메이플랜드 모두 기본 접힘, 클릭 시에만 열림 */
    const [worldSectionOpen, setWorldSectionOpen] = useState({ chronostory: false, mapleland: false });

    const toggleGroup = (key) => {
        setGroupOpen((prev) => ({ ...prev, [key]: !prev[key] }));
    };
    const toggleWorldSection = (key) => {
        setWorldSectionOpen((prev) => ({ ...prev, [key]: !prev[key] }));
    };

    /** 전체 열기: 메인 그룹만 펼치고, 하위 그룹(크로노스토리/메이플랜드)은 제목만 보이게(맵·몬스터·퀘스트 목록은 접힌 상태) */
    const openAll = () => {
        setGroupOpen({ gameEditor: true, maple: true });
        setWorldSectionOpen({ chronostory: false, mapleland: false });
    };
    /** 전체 닫기: 메인 그룹 + 하위 그룹 모두 접기 */
    const closeAll = () => {
        setGroupOpen({ gameEditor: false, maple: false });
        setWorldSectionOpen({ chronostory: false, mapleland: false });
    };
    /** 현재 페이지가 속한 그룹만 열기 (나머지는 접기) */
    const openCurrentOnly = () => {
        const key = getGroupKeyByPath(location.pathname);
        setGroupOpen({ gameEditor: key === "gameEditor", maple: key === "maple" });
    };

    /** 맵/몬스터/퀘스트처럼 월드별로 같은 path를 쓰는 메뉴: pathname + 현재 월드가 일치할 때만 active (URL 쿼리 우선) */
    const isWorldSectionActive = (pathname, worldKey) => {
        if (location.pathname !== pathname) return false;
        const searchWorld = new URLSearchParams(location.search).get("world");
        if (searchWorld) return searchWorld === worldKey;
        return world === worldKey;
    };

    return (
        <aside className="side-menu" aria-hidden={!isOpen}>
            <nav className="side-menu-nav">
                {/* 전체 열기/닫기 / 현재 메뉴만 */}
                <div className="side-menu-group-actions">
                    <button type="button" className="side-menu-action-btn" onClick={openAll}>
                        전체 열기 <span className="side-menu-action-en">(Expand all)</span>
                    </button>
                    <button type="button" className="side-menu-action-btn" onClick={closeAll}>
                        전체 닫기 <span className="side-menu-action-en">(Collapse all)</span>
                    </button>
                    <button type="button" className="side-menu-action-btn" onClick={openCurrentOnly}>
                        현재 메뉴만 <span className="side-menu-action-en">(Current only)</span>
                    </button>
                </div>

                {/* 사이드 상단: 홈·공지사항 (그룹과 별도) */}
                <div className="side-menu-home">
                    <ul className="menu-list">
                        <li>
                            <NavLink
                                to="/"
                                className={({ isActive }) => (isActive ? "active" : "")}
                                end
                            >
                                홈 (Home)
                            </NavLink>
                        </li>
                        <li>
                            <NavLink
                                to="/notice"
                                className={({ isActive }) => (isActive ? "active" : "")}
                            >
                                공지사항 (Notice)
                            </NavLink>
                        </li>
                    </ul>
                </div>

                {/* 그룹: 게임 에디터 */}
                <div className="side-menu-group">
                    <button
                        type="button"
                        className={`side-menu-group-title side-menu-group-toggle ${groupOpen.gameEditor ? "is-open" : ""}`}
                        onClick={() => toggleGroup("gameEditor")}
                        aria-expanded={groupOpen.gameEditor}
                    >
                        <span className="side-menu-group-chevron" aria-hidden>{groupOpen.gameEditor ? "▼" : "▶"}</span>
                        게임 에디터 (Game Editor)
                    </button>
                    {groupOpen.gameEditor && (
                    <ul className="menu-list">
                        <li>
                            <NavLink
                                to="/big-ambitions-editor"
                                className={({ isActive }) => (isActive ? "active" : "")}
                            >
                                Big Ambitions 세이브 (Save Editor)
                            </NavLink>
                        </li>
                    </ul>
                    )}
                </div>

                {/* 그룹: 메이플 — 그룹별 현재 월드 표시 */}
                <div className="side-menu-group">
                    <button
                        type="button"
                        className={`side-menu-group-title side-menu-group-toggle ${groupOpen.maple ? "is-open" : ""}`}
                        onClick={() => toggleGroup("maple")}
                        aria-expanded={groupOpen.maple}
                    >
                        <span className="side-menu-group-chevron" aria-hidden>{groupOpen.maple ? "▼" : "▶"}</span>
                        <span className="side-menu-group-title-text">메이플 (Maple)</span>
                        <span className="side-menu-group-world" title={`현재 월드: ${selectedWorld}`}>{selectedWorld}</span>
                    </button>
                    {groupOpen.maple && (
                    <>
                        {/* 메이플 - 크로노스토리 - 맵, 몬스터, 퀘스트, 가챠폰, 마법 명중률, 랜덤 장비 스탯 */}
                        <div className="side-menu-world-section">
                            <button
                                type="button"
                                className={`side-menu-world-section-title side-menu-world-section-toggle ${worldSectionOpen.chronostory ? "is-open" : ""}`}
                                onClick={() => toggleWorldSection("chronostory")}
                                aria-expanded={worldSectionOpen.chronostory}
                            >
                                <span className="side-menu-group-chevron" aria-hidden>{worldSectionOpen.chronostory ? "▼" : "▶"}</span>
                                크로노스토리
                            </button>
                            {worldSectionOpen.chronostory && (
                            <ul className="menu-list">
                                <li><NavLink to={{ pathname: "/maps", search: "?world=크로노스토리" }} className={() => (isWorldSectionActive("/maps", "크로노스토리") ? "active" : "")}>맵 (Maps)</NavLink></li>
                                <li><NavLink to={{ pathname: "/monsters", search: "?world=크로노스토리" }} className={() => (isWorldSectionActive("/monsters", "크로노스토리") ? "active" : "")}>몬스터 (Monsters)</NavLink></li>
                                <li>
                                    <NavLink to={{ pathname: "/quests", search: "?world=크로노스토리" }} className={() => (isWorldSectionActive("/quests", "크로노스토리") ? "active" : "")}>
                                        <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                                            퀘스트 (Quests)
                                            <span className="side-menu-dev-badge side-menu-done-badge" style={{ fontSize: "10px", fontWeight: 600, padding: "2px 6px", borderRadius: "999px", background: "var(--done-badge-bg, #5cb85c)", color: "var(--done-badge-fg, #fff)" }}>개발 완료 (Done)</span>
                                        </span>
                                    </NavLink>
                                </li>
                                <li><NavLink to="/items" className={({ isActive }) => (isActive ? "active" : "")}>가챠폰 목록 (Gachapon)</NavLink></li>
                                <li><NavLink to="/chronostory/magic-accuracy" className={({ isActive }) => (isActive ? "active" : "")}>마법 명중률 (Magic Accuracy)</NavLink></li>
                                <li>
                                    <NavLink to="/random-equipment-stats" className={({ isActive }) => (isActive ? "active" : "")}>
                                        <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                                            랜덤 장비 스탯 시뮬레이션 (Random Equip Stats)
                                            <span className="side-menu-dev-badge" style={{ fontSize: "10px", fontWeight: 600, padding: "2px 6px", borderRadius: "999px", background: "var(--dev-badge-bg, #f0ad4e)", color: "var(--dev-badge-fg, #fff)" }}>개발 중 (WIP)</span>
                                        </span>
                                    </NavLink>
                                </li>
                            </ul>
                            )}
                        </div>

                        {/* 메이플 - 메이플랜드 - 맵, 몬스터, 퀘스트 */}
                        <div className="side-menu-world-section">
                            <button
                                type="button"
                                className={`side-menu-world-section-title side-menu-world-section-toggle ${worldSectionOpen.mapleland ? "is-open" : ""}`}
                                onClick={() => toggleWorldSection("mapleland")}
                                aria-expanded={worldSectionOpen.mapleland}
                            >
                                <span className="side-menu-group-chevron" aria-hidden>{worldSectionOpen.mapleland ? "▼" : "▶"}</span>
                                메이플랜드
                            </button>
                            {worldSectionOpen.mapleland && (
                            <ul className="menu-list">
                                <li><NavLink to={{ pathname: "/maps", search: "?world=메이플랜드" }} className={() => (isWorldSectionActive("/maps", "메이플랜드") ? "active" : "")}>맵 (Maps)</NavLink></li>
                                <li><NavLink to={{ pathname: "/monsters", search: "?world=메이플랜드" }} className={() => (isWorldSectionActive("/monsters", "메이플랜드") ? "active" : "")}>몬스터 (Monsters)</NavLink></li>
                                <li>
                                    <NavLink to={{ pathname: "/quests", search: "?world=메이플랜드" }} className={() => (isWorldSectionActive("/quests", "메이플랜드") ? "active" : "")}>
                                        <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                                            퀘스트 (Quests)
                                            <span className="side-menu-dev-badge side-menu-done-badge" style={{ fontSize: "10px", fontWeight: 600, padding: "2px 6px", borderRadius: "999px", background: "var(--done-badge-bg, #5cb85c)", color: "var(--done-badge-fg, #fff)" }}>개발 완료 (Done)</span>
                                        </span>
                                    </NavLink>
                                </li>
                            </ul>
                            )}
                        </div>
                    </>
                    )}
                </div>
            </nav>
            {onToggle && (
                <button
                    type="button"
                    className="side-menu-toggle-btn"
                    onClick={onToggle}
                    aria-label={isOpen ? "사이드 메뉴 닫기 (Close sidebar)" : "사이드 메뉴 열기 (Open sidebar)"}
                    title={isOpen ? "닫기 (Close)" : "열기 (Open)"}
                >
                    {isOpen ? "◀" : "▶"}
                </button>
            )}
        </aside>
    );
}
