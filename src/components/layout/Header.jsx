import { Link } from "react-router-dom";
import { useMemo } from "react";
import { useWorld } from "../../contexts/WorldContext";
import { useDisplay } from "../../contexts/DisplayContext";
import { WORLD_SUGGESTIONS } from "../../constants/worldOptions";

/**
 * 상단 헤더
 * - 입력: 없음 (사이드 토글은 사이드바에 위치)
 * - 출력: JSX(Element)
 */
export default function Header() {
    const { world, setWorld } = useWorld();
    const { theme, toggleTheme } = useDisplay();

    // 월드 추천 목록(빈 값 제거 + 정렬)
    const worldSuggestionList = useMemo(() => {
        const list = Array.isArray(WORLD_SUGGESTIONS) ? WORLD_SUGGESTIONS : [];
        return list
            .filter(Boolean)
            .map(v => String(v).trim())
            .filter(v => v !== "")
            // 루프: 중복 제거(같은 이름이 여러 번 들어와도 1개만)
            .filter((value, index, array) => array.indexOf(value) === index)
            .sort((a, b) => a.localeCompare(b, "ko"));
    }, []);

    // 조건문: 현재 world가 목록에 없으면(예: 예전 localStorage 값) 첫 옵션으로 보정
    const selectedWorld = useMemo(() => {
        // 조건문: 옵션이 아예 없으면 world 그대로 사용(방어적)
        if (!Array.isArray(worldSuggestionList) || worldSuggestionList.length === 0) return world;

        // 조건문: world가 목록에 있으면 그대로 사용
        if (worldSuggestionList.includes(world)) return world;

        // 없으면 첫 번째 옵션을 사용
        return worldSuggestionList[0];
    }, [world, worldSuggestionList]);

    /**
     * 월드 변경 핸들러
     * - 입력: change 이벤트
     * - 출력: 없음(상태 업데이트)
     */
    function handleChangeWorld(e) {
        const nextWorld = e.target.value;
        // 조건문: 빈 값이면 반영하지 않음
        if (!nextWorld || nextWorld.trim() === "") return;
        setWorld(nextWorld);
    }

    /**
     * 테마 토글 버튼 클릭 핸들러
     * - 입력: 없음
     * - 출력: 없음(테마 전환)
     */
    function handleToggleTheme() {
        toggleTheme();
    }

    return (
        <header className="header">
            <div className="header-inner">
                {/* Left - 사이드 토글 + Logo */}
                <div className="logo">
                    <Link to="/">MapleLand</Link>
                </div>

                {/* Center - World Selector */}
                <div className="header-controls">
                    <label className="world-select">
                        <span className="world-select-label">월드</span>
                        {/* select: 텍스트 직접 입력 불가(무조건 선택) */}
                        <select
                            className="world-select-input"
                            value={selectedWorld}
                            onChange={handleChangeWorld}
                        >
                            {/* 루프: 추천 월드 목록 렌더 */}
                            {worldSuggestionList.map(worldName => (
                                <option key={worldName} value={worldName}>
                                    {worldName}
                                </option>
                            ))}
                        </select>
                    </label>

                    <button
                        type="button"
                        className="theme-toggle-btn"
                        onClick={handleToggleTheme}
                        aria-label={theme === "dark" ? "라이트 모드로 전환" : "다크 모드로 전환"}
                    >
                        {theme === "dark" ? "라이트 모드" : "다크 모드"}
                    </button>
                </div>

                {/* Right - Navigation */}
                <nav className="nav">
                    <Link to="/items">가챠폰 목록</Link>
                    {/* 숨김: 길드, 마켓 */}
                    {/* <Link to="/guild">길드</Link>
                    <Link to="/market">마켓</Link> */}
                </nav>
            </div>
        </header>
    );
}
