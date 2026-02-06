import { NavLink } from "react-router-dom";

/**
 * 좌측 사이드 메뉴(탭)
 * - 입력: 없음
 * - 출력: JSX(Element)
 */
export default function SideMenu() {
    return (
        <aside className="side-menu">
            <nav>
                <ul className="menu-list">
                    <li>
                        <NavLink
                            to="/items"
                            className={({ isActive }) => (isActive ? "active" : "")}
                        >
                            아이템 목록
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
                </ul>
            </nav>
        </aside>
    );
}
