import { useCallback, useEffect, useState } from "react";
import { fetchChronostoryMobDetail, fetchChronostoryMonsters } from "../../api/mapleApi";

/**
 * 크로노스토리 몬스터 검색·선택 모달
 * - 입력: open(boolean), onClose(function), onSelect(function) — onSelect({ mobId, nameKr, nameEn, level, eva })
 * - 출력: JSX(Element) | null
 */
export default function MonsterSelectModal({ open, onClose, onSelect }) {
    const [keywordInput, setKeywordInput] = useState("");
    const [keyword, setKeyword] = useState("");
    /** 정렬: "level_asc" | "level_desc" | "xp_asc" | "xp_desc" */
    const [sort, setSort] = useState("level_asc");
    /** 출몰 여부: ""(전체) | "yes"(출몰 있음) | "no"(출몰 없음) */
    const [hasSpawnFilter, setHasSpawnFilter] = useState("");
    const [page, setPage] = useState(0);
    const [size] = useState(20);
    const [items, setItems] = useState([]);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [selected, setSelected] = useState(null);
    const [confirmLoading, setConfirmLoading] = useState(false);

    // 모달이 열릴 때 상태 초기화
    useEffect(() => {
        if (!open) return;
        setKeywordInput("");
        setKeyword("");
        setSort("level_asc");
        setHasSpawnFilter("");
        setPage(0);
        setSelected(null);
        setError(null);
    }, [open]);

    // 몬스터 목록 조회 (keyword 변경 시 검색, 열릴 때는 빈 검색으로 1페이지)
    useEffect(() => {
        if (!open) return;

        let cancelled = false;
        setLoading(true);
        setError(null);

        const params = { page, size };
        if (keyword != null && String(keyword).trim() !== "") {
            params.keyword = String(keyword).trim();
        }
        // 정렬: "level_asc" -> sortBy=level, sortOrder=asc
        const [sortBy, sortOrder] = (sort || "level_asc").split("_");
        if (sortBy) params.sortBy = sortBy;
        if (sortOrder) params.sortOrder = sortOrder;
        // 출몰 여부: yes -> true, no -> false, 전체 -> 생략
        if (hasSpawnFilter === "yes") params.hasSpawn = true;
        if (hasSpawnFilter === "no") params.hasSpawn = false;

        fetchChronostoryMonsters(params)
            .then((res) => {
                if (cancelled) return;
                const payload = res?.data ?? res;
                const list = payload?.items ?? [];
                setItems(Array.isArray(list) ? list : []);
                setTotalElements(Number(payload?.totalElements ?? 0));
                setTotalPages(Number(payload?.totalPages ?? 0));
            })
            .catch((err) => {
                if (cancelled) return;
                setError(err?.message ?? "몬스터 검색 실패");
                setItems([]);
                setTotalPages(0);
                setTotalElements(0);
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => { cancelled = true; };
    }, [open, keyword, sort, hasSpawnFilter, page, size]);

    /** 검색 실행 */
    const handleSearch = useCallback(() => {
        setPage(0);
        setKeyword(keywordInput.trim());
    }, [keywordInput]);

    /** 정렬 변경 시 1페이지로 이동 */
    const handleSortChange = useCallback((e) => {
        setSort(e.target.value || "level_asc");
        setPage(0);
    }, []);

    /** 출몰 여부 변경 시 1페이지로 이동 */
    const handleHasSpawnChange = useCallback((e) => {
        setHasSpawnFilter(e.target.value || "");
        setPage(0);
    }, []);

    /** 목록에서 몬스터 선택(클릭) */
    const handlePick = useCallback((item) => {
        setSelected(item);
    }, []);

    /** 선택 확정: 목록에 eva 있으면 그대로 사용, 없으면 상세 조회로 eva(회피) 가져온 뒤 onSelect 호출 */
    const handleConfirm = useCallback(() => {
        if (!selected) return;

        const mobId = selected.mob_id ?? selected.mobId ?? null;
        const nameKr = selected.monster_name_kr ?? selected.monsterNameKr ?? "";
        const nameEn = selected.monster_name_en ?? selected.monsterNameEn ?? "";
        const levelFromList = selected.level != null ? Number(selected.level) : null;
        const evaFromList = selected.eva != null && selected.eva !== "" ? Number(selected.eva) : null;

        // 목록 응답에 eva(회피)가 있으면 상세 API 호출 없이 바로 적용
        if (evaFromList !== null && !Number.isNaN(evaFromList)) {
            onSelect?.({
                mobId,
                nameKr,
                nameEn,
                level: levelFromList ?? 1,
                eva: evaFromList
            });
            onClose?.();
            return;
        }

        setConfirmLoading(true);
        fetchChronostoryMobDetail(mobId)
            .then((res) => {
                const mob = res?.mob ?? res;
                const eva = mob?.eva != null ? Number(mob.eva) : 0;
                const level = mob?.level != null ? Number(mob.level) : levelFromList;
                onSelect?.({ mobId, nameKr, nameEn, level: level ?? 1, eva });
                onClose?.();
            })
            .catch(() => {
                onSelect?.({
                    mobId,
                    nameKr,
                    nameEn,
                    level: levelFromList ?? 1,
                    eva: 0
                });
                onClose?.();
            })
            .finally(() => setConfirmLoading(false));
    }, [selected, onSelect, onClose]);

    /** Enter 키로 검색 */
    const handleKeyDown = useCallback(
        (e) => {
            if (e.key === "Enter") {
                e.preventDefault();
                handleSearch();
            }
        },
        [handleSearch]
    );

    if (!open) return null;

    return (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="monster-modal-title">
            <div className="modal-card monster-select-modal">
                <div className="modal-header">
                    <div>
                        <div className="modal-title" id="monster-modal-title">
                            몬스터 검색
                        </div>
                        <div className="modal-subtitle">
                            크로노스토리 몬스터를 검색해 선택하면 회피·레벨이 자동 입력됩니다. (총{" "}
                            {Number.isFinite(totalElements) ? totalElements.toLocaleString() : 0}건)
                        </div>
                    </div>
                    <button type="button" className="btn btn-outline" onClick={onClose}>
                        닫기
                    </button>
                </div>

                <div className="modal-controls">
                    <input
                        className="layout-input"
                        placeholder="몬스터 한글명 검색 (예: 리게이터)"
                        value={keywordInput}
                        onChange={(e) => setKeywordInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                    />
                    <label className="monster-select-filter">
                        <span className="monster-select-filter-label">정렬</span>
                        <select
                            className="layout-input monster-select-sort"
                            value={sort}
                            onChange={handleSortChange}
                            disabled={loading}
                        >
                            <option value="level_asc">레벨 낮은 순</option>
                            <option value="level_desc">레벨 높은 순</option>
                            <option value="xp_asc">경험치 낮은 순</option>
                            <option value="xp_desc">경험치 높은 순</option>
                        </select>
                    </label>
                    <label className="monster-select-filter">
                        <span className="monster-select-filter-label">출몰 여부</span>
                        <select
                            className="layout-input monster-select-sort"
                            value={hasSpawnFilter}
                            onChange={handleHasSpawnChange}
                            disabled={loading}
                        >
                            <option value="">전체</option>
                            <option value="yes">출몰 있음</option>
                            <option value="no">출몰 없음</option>
                        </select>
                    </label>
                    <button type="button" className="btn btn-primary" onClick={handleSearch} disabled={loading}>
                        검색
                    </button>
                </div>

                {error && <div className="modal-error">{error}</div>}

                <div className="modal-list">
                    {loading && <div className="equip-empty">로딩 중...</div>}
                    {!loading && items.length === 0 && keyword === "" && (
                        <div className="equip-empty">검색어를 입력한 뒤 검색하면 목록이 표시됩니다.</div>
                    )}
                    {!loading && items.length === 0 && keyword !== "" && (
                        <div className="equip-empty">조회 결과가 없습니다.</div>
                    )}
                    {!loading && items.length > 0 && (
                        <ul className="monster-select-list">
                            {items.map((item, idx) => {
                                const mobId = item.mob_id ?? item.mobId;
                                const nameKr = item.monster_name_kr ?? item.monsterNameKr ?? "";
                                const nameEn = item.monster_name_en ?? item.monsterNameEn ?? "";
                                const level = item.level != null ? item.level : "-";
                                const isSelected =
                                    selected &&
                                    (String(selected.mob_id ?? selected.mobId) === String(mobId));
                                return (
                                    <li key={mobId ?? `m-${idx}`}>
                                        <button
                                            type="button"
                                            className={`monster-select-item ${isSelected ? "selected" : ""}`}
                                            onClick={() => handlePick(item)}
                                        >
                                            <span className="monster-select-name">
                                                {nameKr || nameEn || "(이름 없음)"}
                                            </span>
                                            <span className="monster-select-meta">
                                                Lv.{level}
                                                {item.exp != null && ` · XP ${Number(item.exp).toLocaleString()}`}
                                                {item.eva != null && item.eva !== "" && ` · 회피 ${item.eva}`}
                                            </span>
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>
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
                            onClick={() => setPage((p) => Math.max(0, p - 1))}
                        >
                            이전
                        </button>
                        <span className="modal-pagination-info">
                            {page + 1} / {totalPages || 1}
                        </span>
                        <button
                            type="button"
                            className="btn btn-outline"
                            disabled={loading || (totalPages > 0 && page >= totalPages - 1)}
                            onClick={() => setPage((p) => p + 1)}
                        >
                            다음
                        </button>
                        <button
                            type="button"
                            className="btn btn-outline"
                            disabled={loading || totalPages <= 0 || page >= totalPages - 1}
                            onClick={() => setPage(Math.max(0, totalPages - 1))}
                        >
                            끝
                        </button>
                    </div>
                    <button
                        type="button"
                        className="btn btn-primary"
                        onClick={handleConfirm}
                        disabled={!selected || confirmLoading}
                    >
                        {confirmLoading ? "적용 중..." : "선택"}
                    </button>
                </div>
            </div>
        </div>
    );
}
