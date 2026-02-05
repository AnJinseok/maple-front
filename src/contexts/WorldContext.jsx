import { createContext, useContext, useMemo, useState } from "react";
import { WORLD_SUGGESTIONS } from "../constants/worldOptions";

/**
 * 월드 선택 컨텍스트
 *
 * - 입력: Provider의 children(ReactNode)
 * - 출력: useWorld()로 { world, setWorld } 제공
 *
 * NOTE:
 * - 월드 값은 localStorage에 저장되어 새로고침 후에도 유지됩니다.
 */
const WorldContext = createContext(null);

const STORAGE_KEY = "maple:selectedWorld";

/**
 * 주어진 월드가 허용 목록(WORLD_SUGGESTIONS)에 포함되는지 확인합니다.
 * - 입력: candidateWorld(string)
 * - 출력: boolean
 */
function isAllowedWorld(candidateWorld) {
    const trimmed = String(candidateWorld ?? "").trim();
    // 조건문: 빈 값은 허용하지 않음
    if (trimmed === "") return false;

    // 조건문: 추천 목록이 없으면 검증 불가 → false 처리(드롭다운 기반 전제)
    if (!Array.isArray(WORLD_SUGGESTIONS) || WORLD_SUGGESTIONS.length === 0) return false;

    // 조건문: 목록에 있으면 허용
    return WORLD_SUGGESTIONS.includes(trimmed);
}

/**
 * localStorage에서 저장된 월드를 가져옵니다.
 * - 입력: 없음
 * - 출력: string (월드명)
 */
function getStoredWorld() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        // 조건문: 저장값이 있고, 허용 목록에 있으면 사용
        if (isAllowedWorld(stored)) return stored.trim();
    } catch {
        // 조건문: localStorage 접근 불가(시크릿/권한 등)면 기본값 사용
    }

    // 기본값은 추천 목록 첫 번째로 설정
    return WORLD_SUGGESTIONS[0] || "메이플랜드";
}

/**
 * localStorage에 월드를 저장합니다.
 * - 입력: nextWorld(string)
 * - 출력: 없음
 */
function setStoredWorld(nextWorld) {
    try {
        // 조건문: 허용되지 않은 값은 저장하지 않음
        if (!isAllowedWorld(nextWorld)) return;

        // 조건문: 값이 없으면 저장하지 않음
        if (!nextWorld || nextWorld.trim() === "") return;
        localStorage.setItem(STORAGE_KEY, nextWorld);
    } catch {
        // 조건문: localStorage 접근 불가면 무시(메모리 상태만 유지)
    }
}

/**
 * 월드 선택 Provider
 * - 입력: children(ReactNode)
 * - 출력: JSX(Element)
 */
export function WorldProvider({ children }) {
    const [world, setWorldState] = useState(() => getStoredWorld());

    /**
     * 월드 변경 + localStorage 저장
     * - 입력: nextWorld(string)
     * - 출력: 없음(상태 업데이트)
     */
    function setWorld(nextWorld) {
        const trimmed = String(nextWorld ?? "").trim();

        // 조건문: 빈 값 방지
        if (trimmed === "") return;

        // 조건문: 허용 목록 밖 값은 반영하지 않음(무조건 select로만 선택하도록 강제)
        if (!isAllowedWorld(trimmed)) return;

        setWorldState(trimmed);
        setStoredWorld(trimmed);
    }

    const value = useMemo(() => ({ world, setWorld }), [world]);

    return (
        <WorldContext.Provider value={value}>
            {children}
        </WorldContext.Provider>
    );
}

/**
 * 월드 컨텍스트 훅
 * - 입력: 없음
 * - 출력: { world: string, setWorld: (string) => void }
 */
export function useWorld() {
    const ctx = useContext(WorldContext);

    // 조건문: Provider 밖에서 호출하면 에러로 조기 발견
    if (!ctx) {
        throw new Error("useWorld must be used within <WorldProvider>.");
    }

    return ctx;
}

