import { Link } from "react-router-dom";
import { useDisplay } from "../../contexts/DisplayContext";

/**
 * 상단 헤더
 * - 입력: 없음 (사이드 토글은 사이드바에 위치, 월드 선택은 메이플 그룹에 위치)
 * - 출력: JSX(Element)
 */
export default function Header() {
    const { theme, toggleTheme } = useDisplay();

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
                {/* Left - 로고: Util + 태그라인 */}
                <div className="logo">
                    <Link to="/">
                        <span className="logo-brand">Util</span>
                        <span className="logo-tagline">· 내 편한 유틸</span>
                    </Link>
                </div>

                {/* Center - 테마 토글 등 */}
                <div className="header-controls">
                    <button
                        type="button"
                        className="theme-toggle-btn"
                        onClick={handleToggleTheme}
                        aria-label={theme === "dark" ? "라이트 모드로 전환" : "다크 모드로 전환"}
                    >
                        {theme === "dark" ? "라이트 모드" : "다크 모드"}
                    </button>
                </div>

                {/* Right - Navigation: 홈 / 게임 에디터 / 메이플 / 가챠폰 목록 */}
                <nav className="nav">
                    <Link to="/">홈</Link>
                    <Link to="/big-ambitions-editor">게임 에디터</Link>
                    <Link to="/maps">메이플</Link>
                    <Link to="/items">가챠폰 목록</Link>
                </nav>
            </div>
        </header>
    );
}
