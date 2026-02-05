import { createContext, useContext, useEffect, useMemo, useState } from "react";

const DisplayContext = createContext(null);

// localStorage 키(테마 저장)
const STORAGE_KEY_THEME = "maple_display_theme";

// 허용 테마 목록
const THEME_LIGHT = "light";
const THEME_DARK = "dark";

/**
 * 테마 값이 유효한지 확인합니다.
 * - 입력: theme(string)
 * - 출력: boolean
 */
function isValidTheme(theme) {
    return theme === THEME_LIGHT || theme === THEME_DARK;
}

/**
 * localStorage에서 테마를 읽어옵니다.
 * - 입력: 없음
 * - 출력: string("light"|"dark")
 */
function getStoredTheme() {
    try {
        const raw = window?.localStorage?.getItem(STORAGE_KEY_THEME);
        const candidate = String(raw ?? "").trim();

        // 조건문: 값이 유효하면 사용, 아니면 기본(light)
        if (isValidTheme(candidate)) return candidate;
        return THEME_LIGHT;
    } catch (e) {
        // 조건문: localStorage 접근 불가면 기본(light)
        return THEME_LIGHT;
    }
}

/**
 * localStorage에 테마를 저장합니다.
 * - 입력: theme(string)
 * - 출력: 없음
 */
function setStoredTheme(theme) {
    try {
        window?.localStorage?.setItem(STORAGE_KEY_THEME, String(theme));
    } catch (e) {
        // 조건문: 저장 실패는 무시
    }
}

/**
 * DisplayProvider (테마 전역 상태)
 * - 입력: children(ReactNode)
 * - 출력: JSX(Provider)
 */
export function DisplayProvider({ children }) {
    const [theme, setThemeState] = useState(() => getStoredTheme());

    /**
     * 테마를 설정합니다(유효성 체크 + 저장 + 상태 반영).
     * - 입력: nextTheme(string)
     * - 출력: 없음
     */
    function setTheme(nextTheme) {
        const candidate = String(nextTheme ?? "").trim();

        // 조건문: 유효하지 않으면 light로 보정
        const safeTheme = isValidTheme(candidate) ? candidate : THEME_LIGHT;
        setStoredTheme(safeTheme);
        setThemeState(safeTheme);
    }

    /**
     * 테마 토글(light <-> dark)
     * - 입력: 없음
     * - 출력: 없음
     */
    function toggleTheme() {
        // 조건문: 현재 테마가 dark면 light, 아니면 dark
        const nextTheme = theme === THEME_DARK ? THEME_LIGHT : THEME_DARK;
        setTheme(nextTheme);
    }

    // html에 data-theme 적용(전체 화면 스타일 전환)
    useEffect(() => {
        // 조건문: documentElement가 없으면(SSR 등) 스킵
        if (!document?.documentElement) return;

        document.documentElement.setAttribute("data-theme", theme);
    }, [theme]);

    const value = useMemo(() => ({ theme, setTheme, toggleTheme }), [theme]);

    return (
        <DisplayContext.Provider value={value}>
            {children}
        </DisplayContext.Provider>
    );
}

/**
 * DisplayContext 훅
 * - 입력: 없음
 * - 출력: { theme, setTheme, toggleTheme }
 */
export function useDisplay() {
    const ctx = useContext(DisplayContext);

    // 조건문: Provider 밖에서 호출되면 에러
    if (!ctx) {
        throw new Error("useDisplay must be used within <DisplayProvider>.");
    }

    return ctx;
}

