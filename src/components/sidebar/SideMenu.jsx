import { NavLink } from "react-router-dom";
import { useWorld } from "../../contexts/WorldContext";

/**
 * 좌측 사이드 메뉴(탭)
 * - 입력: isOpen(boolean), onToggle(function) — 열림 여부, 토글 콜백
 * - 출력: JSX(Element)
 * - 크로노스토리 선택 시에만: 가챠폰 목록, 마법 명중률, 랜덤 장비 스탯 시뮬레이션 표시
 */
export default function SideMenu({ isOpen, onToggle }) {
    const { world } = useWorld();
    const isChronoStory = world === "크로노스토리";

    return (
        <aside className="side-menu" aria-hidden={!isOpen}>
            <nav className="side-menu-nav">
                <ul className="menu-list">
                    <li>
                        <NavLink
                            to="/"
                            className={({ isActive }) => (isActive ? "active" : "")}
                            end
                        >
                            홈
                        </NavLink>
                    </li>

                    {/* 숨김: 거래소, 길드, 고확 리스트, 아이템 능력치 장착 */}
                    {/* <li>
                        <NavLink
                            to="/market"
                            className={({ isActive }) => (isActive ? "active" : "")}
                        >
                            거래소
                        </NavLink>
                    </li>

                    <li>
                        <NavLink
                            to="/guild"
                            className={({ isActive }) => (isActive ? "active" : "")}
                        >
                            길드
                        </NavLink>
                    </li>

                    <li>
                        <NavLink
                            to="/shout"
                            className={({ isActive }) => (isActive ? "active" : "")}
                        >
                            고확 리스트
                        </NavLink>
                    </li>

                    <li>
                        <NavLink
                            to="/equip-stats"
                            className={({ isActive }) => (isActive ? "active" : "")}
                        >
                            아이템 능력치 장착
                        </NavLink>
                    </li> */}

                    {/* ✅ 신규 메뉴: 맵 */}
                    <li>
                        <NavLink
                            to="/maps"
                            className={({ isActive }) => (isActive ? "active" : "")}
                        >
                            맵
                        </NavLink>
                    </li>
                    <li>
                        <NavLink
                            to="/monsters"
                            className={({ isActive }) => (isActive ? "active" : "")}
                        >
                            몬스터
                        </NavLink>
                    </li>
                    <li>
                        <NavLink
                            to="/quests"
                            className={({ isActive }) => (isActive ? "active" : "")}
                        >
                            퀘스트
                        </NavLink>
                    </li>
                    {/* 크로노스토리 선택 시에만 표시 */}
                    {isChronoStory && (
                        <li>
                            <NavLink
                                to="/items"
                                className={({ isActive }) => (isActive ? "active" : "")}
                            >
                                가챠폰 목록
                            </NavLink>
                        </li>
                    )}
                    {isChronoStory && (
                        <>
                            <li>
                                <NavLink
                                    to="/chronostory/magic-accuracy"
                                    className={({ isActive }) => (isActive ? "active" : "")}
                                >
                                    마법 명중률
                                </NavLink>
                            </li>
                            <li>
                                <NavLink
                                    to="/random-equipment-stats"
                                    className={({ isActive }) => (isActive ? "active" : "")}
                                >
                                    <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                                        랜덤 장비 스탯 시뮬레이션
                                        <span
                                            className="side-menu-dev-badge"
                                            style={{
                                                fontSize: "10px",
                                                fontWeight: 600,
                                                padding: "2px 6px",
                                                borderRadius: "999px",
                                                background: "var(--dev-badge-bg, #f0ad4e)",
                                                color: "var(--dev-badge-fg, #fff)"
                                            }}
                                        >
                                            개발 중
                                        </span>
                                    </span>
                                </NavLink>
                            </li>
                        </>
                    )}
                </ul>
            </nav>
            {onToggle && (
                <button
                    type="button"
                    className="side-menu-toggle-btn"
                    onClick={onToggle}
                    aria-label={isOpen ? "사이드 메뉴 닫기" : "사이드 메뉴 열기"}
                    title={isOpen ? "닫기" : "열기"}
                >
                    {isOpen ? "◀" : "▶"}
                </button>
            )}
        </aside>
    );
}
