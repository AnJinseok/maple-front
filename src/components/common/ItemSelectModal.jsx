import { useEffect, useMemo, useState } from "react";
import { fetchItems, fetchItemOptions } from "../../api/mapleApi";
import { useWorld } from "../../contexts/WorldContext";

/**
 * 아이템 선택 모달
 * - 입력: open(boolean), onClose(function), onSelect(function), characterLevel(number)
 * - 출력: JSX(Element) | null
 */
export default function ItemSelectModal({
    open,
    onClose,
    onSelect,
    characterLevel
}) {
    const { world } = useWorld();
    // 검색 키워드(입력 중)
    const [keywordInput, setKeywordInput] = useState("");

    // 확정된 검색 키워드(조회에 사용)
    const [keyword, setKeyword] = useState("");

    // 페이지네이션
    const [page, setPage] = useState(0);
    const [size] = useState(20);

    // 조회 결과
    const [items, setItems] = useState([]);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);

    // UI 상태
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // 선택된 아이템
    const [selected, setSelected] = useState(null);

    // 필터: 카테고리 / 서브카테고리(KR)
    const [category, setCategory] = useState("");
    const [subCategory, setSubCategory] = useState("");

    // 옵션 목록(서버 group by 결과)
    const [options, setOptions] = useState([]);
    const [categories, setCategories] = useState([]);
    const [optionsLoading, setOptionsLoading] = useState(false);
    const [optionsError, setOptionsError] = useState(null);

    const categoryList = useMemo(() => {
        // 서버에서 group by로 내려준 categories를 우선 사용
        if (Array.isArray(categories) && categories.length > 0) {
            return categories.filter(Boolean).sort((a, b) => a.localeCompare(b, "ko"));
        }

        // fallback: options에서 추출
        const list = options.map(o => o?.categoryKr).filter(Boolean);
        return Array.from(new Set(list)).sort((a, b) => a.localeCompare(b, "ko"));
    }, [categories, options]);

    const subCategoryList = useMemo(() => {
        if (!category) return [];
        const list = options
            .filter(o => o?.categoryKr === category)
            .map(o => o?.subCategoryKr)
            .filter(Boolean);
        return Array.from(new Set(list)).sort((a, b) => a.localeCompare(b, "ko"));
    }, [category, options]);

    /**
     * 모달이 열릴 때 상태를 초기화합니다.
     * - 입력: open(boolean)
     * - 출력: 없음(상태 업데이트)
     */
    useEffect(() => {
        // 조건문: 닫힘 상태면 아무것도 하지 않음
        if (!open) return;

        setKeywordInput("");
        setKeyword("");
        setCategory("");
        setSubCategory("");
        setPage(0);
        setSelected(null);
        setError(null);
        setOptionsError(null);
    }, [open, world]);

    /**
     * 모달이 열릴 때 옵션(카테고리/서브카테고리)을 조회합니다.
     */
    useEffect(() => {
        if (!open) return;

        setOptionsLoading(true);
        setOptionsError(null);

        fetchItemOptions({
            // 월드 선택(백엔드가 지원하면 옵션도 월드별로 분기 가능)
            world: world || undefined
        })
            .then(res => {
                const payload = res?.data ?? res;
                const list = payload?.options ?? [];
                const cats = payload?.categories ?? [];

                if (!Array.isArray(list)) {
                    setOptions([]);
                } else {
                    setOptions(list);
                }

                if (!Array.isArray(cats)) {
                    setCategories([]);
                } else {
                    setCategories(cats);
                }
            })
            .catch(err => {
                setOptionsError(err?.message || "옵션 조회 중 오류가 발생했습니다.");
                setOptions([]);
                setCategories([]);
            })
            .finally(() => setOptionsLoading(false));
    }, [open, world]);

    /**
     * 아이템 목록을 조회합니다.
     * - 입력: 없음(상태 사용)
     * - 출력: 없음(상태 업데이트)
     */
    useEffect(() => {
        // 조건문: 모달이 열려있을 때만 조회
        if (!open) return;

        setLoading(true);
        setError(null);

        fetchItems({
            page,
            size,
            // 월드 선택(백엔드가 지원하면 가격/아이템 풀 등을 월드별로 조회 가능)
            world: world || undefined,
            // 서버는 keyword 파라미터를 받음
            keyword: keyword || undefined,
            category: category || undefined,
            subCategory: subCategory || undefined,
            // 캐릭터 레벨 이하만 조회(선택)
            maxReqLevel: typeof characterLevel === "number" ? characterLevel : undefined
        })
            .then(res => {
                // ApiResponse 포맷과 일반 포맷 모두 대응
                const payload = res?.data ?? res;
                const list = payload?.items ?? [];

                // 조건문: 배열이 아니면 빈 배열 처리
                if (!Array.isArray(list)) {
                    setItems([]);
                } else {
                    setItems(list);
                }

                setTotalPages(Number(payload?.totalPages ?? 0));
                setTotalElements(Number(payload?.totalElements ?? 0));
            })
            .catch(err => {
                setError(err?.message || "아이템 조회 중 오류가 발생했습니다.");
                setItems([]);
                setTotalPages(0);
                setTotalElements(0);
            })
            .finally(() => setLoading(false));
    }, [category, characterLevel, keyword, open, page, size, subCategory, world]);

    /**
     * 검색 실행
     * - 입력: 없음
     * - 출력: 없음(상태 업데이트)
     */
    function handleSearch() {
        setPage(0);
        setKeyword(keywordInput.trim());
    }

    /**
     * 카테고리 변경
     * - 입력: change 이벤트
     * - 출력: 없음(상태 업데이트)
     */
    function handleChangeCategory(e) {
        const next = e.target.value;
        setPage(0);
        setCategory(next);
        // 카테고리가 바뀌면 서브카테고리는 리셋
        setSubCategory("");
    }

    /**
     * 서브카테고리 변경
     * - 입력: change 이벤트
     * - 출력: 없음(상태 업데이트)
     */
    function handleChangeSubCategory(e) {
        setPage(0);
        setSubCategory(e.target.value);
    }

    /**
     * Enter 입력 시 검색
     * - 입력: keyboard 이벤트
     * - 출력: 없음
     */
    function handleKeywordKeyDown(e) {
        // 조건문: Enter를 누르면 검색 실행
        if (e.key === "Enter") {
            e.preventDefault();
            handleSearch();
        }
    }

    /**
     * 아이템 선택
     * - 입력: item(object)
     * - 출력: 없음(상태 업데이트)
     */
    function handlePick(item) {
        setSelected(item);
    }

    /**
     * 선택 확정
     * - 입력: 없음
     * - 출력: 없음(onSelect 호출)
     */
    function handleConfirm() {
        // 조건문: 선택된 아이템이 없으면 종료
        if (!selected) return;

        onSelect?.(selected);
        onClose?.();
    }

    /**
     * 페이지 버튼 배열 생성
     * - 입력: 없음(상태 사용)
     * - 출력: number[]
     */
    const pageIndexList = useMemo(() => {
        const pages = [];

        // 조건문: totalPages가 0이면 현재 페이지만 표시
        if (!totalPages || totalPages <= 0) return [0];

        // 최대 7개 버튼
        const maxButtons = 7;
        const half = Math.floor(maxButtons / 2);

        let start = Math.max(0, page - half);
        let end = Math.min(totalPages - 1, start + maxButtons - 1);

        // 조건문: 버튼 개수가 부족하면 start를 당김
        if (end - start + 1 < maxButtons) {
            start = Math.max(0, end - maxButtons + 1);
        }

        // 루프: start~end
        for (let i = start; i <= end; i += 1) {
            pages.push(i);
        }

        return pages;
    }, [page, totalPages]);

    // 조건문: 모달이 닫혀있으면 렌더링하지 않음
    if (!open) return null;

    return (
        <div className="modal-overlay" role="dialog" aria-modal="true">
            <div className="modal-card">
                <div className="modal-header">
                    <div>
                        <div className="modal-title">아이템 선택</div>
                        <div className="modal-subtitle">
                            총 {Number.isFinite(totalElements) ? totalElements.toLocaleString() : 0}건
                        </div>
                    </div>

                    <button type="button" className="btn btn-outline" onClick={onClose}>
                        닫기
                    </button>
                </div>

                <div className="modal-controls">
                    <input
                        className="layout-input"
                        placeholder="아이템 이름 검색"
                        value={keywordInput}
                        onChange={(e) => setKeywordInput(e.target.value)}
                        onKeyDown={handleKeywordKeyDown}
                    />

                    <select className="layout-input" value={category} onChange={handleChangeCategory}>
                        <option value="">카테고리(전체)</option>
                        {categoryList.map(c => (
                            <option key={c} value={c}>
                                {c}
                            </option>
                        ))}
                    </select>

                    <select
                        className="layout-input"
                        value={subCategory}
                        onChange={handleChangeSubCategory}
                        disabled={!category}
                    >
                        <option value="">서브 카테고리(전체)</option>
                        {subCategoryList.map(sc => (
                            <option key={sc} value={sc}>
                                {sc}
                            </option>
                        ))}
                    </select>

                    <button type="button" className="btn btn-primary" onClick={handleSearch} disabled={loading}>
                        검색
                    </button>
                </div>

                {error && <div className="modal-error">{error}</div>}
                {optionsError && <div className="modal-error">{optionsError}</div>}

                <div className="modal-list">
                    {loading && <div className="equip-empty">로딩 중...</div>}
                    {optionsLoading && <div className="equip-empty">옵션 로딩 중...</div>}

                    {!loading && items.length === 0 && (
                        <div className="equip-empty">조회 결과가 없습니다.</div>
                    )}

                    {!loading && items.length > 0 && (
                        <div className="modal-grid">
                            {items.map(item => (
                                <button
                                    key={item.id ?? item.itemCode}
                                    type="button"
                                    className={`modal-item ${selected?.id === item.id ? "selected" : ""}`}
                                    onClick={() => handlePick(item)}
                                >
                                    <div className="modal-item-name">{item.name}</div>
                                    <div className="modal-item-meta">
                                        {item.category ? `${item.category}` : "카테고리 없음"}
                                        {item.subCategory ? ` / ${item.subCategory}` : ""}
                                        {typeof item.reqLevel === "number" ? ` · Lv.${item.reqLevel}` : ""}
                                    </div>
                                    <div className="modal-item-meta">
                                        {typeof item.attack === "number" ? `공격력: ${item.attack}` : ""}
                                        {typeof item.price === "number" ? ` · 가격: ${item.price.toLocaleString()}` : ""}
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <div className="modal-footer">
                    <div className="pagination">
                        <button
                            type="button"
                            className="btn btn-outline"
                            disabled={loading || page <= 0}
                            onClick={() => setPage(0)}
                        >
                            처음
                        </button>
                        <button
                            type="button"
                            className="btn btn-outline"
                            disabled={loading || page <= 0}
                            onClick={() => setPage(p => Math.max(0, p - 1))}
                        >
                            이전
                        </button>

                        {pageIndexList.map(p => (
                            <button
                                key={p}
                                type="button"
                                className={`btn btn-page ${p === page ? "active" : ""}`}
                                disabled={loading}
                                onClick={() => setPage(p)}
                            >
                                {p + 1}
                            </button>
                        ))}

                        <button
                            type="button"
                            className="btn btn-outline"
                            disabled={loading || (totalPages > 0 ? page >= totalPages - 1 : items.length < size)}
                            onClick={() => setPage(p => p + 1)}
                        >
                            다음
                        </button>
                        <button
                            type="button"
                            className="btn btn-outline"
                            disabled={loading || totalPages <= 0 || page >= totalPages - 1}
                            onClick={() => setPage(totalPages - 1)}
                        >
                            끝
                        </button>
                    </div>

                    <button
                        type="button"
                        className="btn btn-primary"
                        onClick={handleConfirm}
                        disabled={!selected}
                    >
                        선택
                    </button>
                </div>
            </div>
        </div>
    );
}

