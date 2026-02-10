import { useState, useEffect, useCallback } from "react";
import { fetchChronostoryGachaponDrops, fetchChronostoryGachaponDropMachineNames, fetchItemDetailByCode, getItemImageUrl } from "../api/mapleApi";

/** 컬럼 키 → 한글 라벨 (일부만 매핑, 없으면 키 그대로 표시) */
const COLUMN_LABELS = {
    id: "ID",
    gacha_id: "가챠 ID",
    gachapon_id: "가챠 ID",
    machine_name: "기계명",
    item_id: "아이템 ID",
    item_name: "아이템명",
    item_name_kr: "아이템명(한글)",
    name: "이름",
    name_kr: "이름(한글)",
    quantity: "수량",
    percent_text: "확률",
    drop_chance: "드롭확률"
};

/**
 * 행에서 셀 값 추출 (snake_case / camelCase 모두 처리)
 */
function getCellValue(row, key) {
    const val = row[key];
    if (val !== undefined && val !== null) return val;
    const camel = key.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
    return row[camel];
}

/**
 * 아이템 목록 페이지 - chronostory_gachapon_drop 테이블 조회, 테이블 형식 표시
 * - 조회가 진짜 간단: 검색어(선택) + 페이징
 */
export default function ItemList() {
    const [itemId, setItemId] = useState("");
    const [itemName, setItemName] = useState("");
    const [itemNameKr, setItemNameKr] = useState("");
    const [machineName, setMachineName] = useState("");
    const [submitItemId, setSubmitItemId] = useState("");
    const [submitItemName, setSubmitItemName] = useState("");
    const [submitItemNameKr, setSubmitItemNameKr] = useState("");
    const [submitMachineName, setSubmitMachineName] = useState("");
    const [machineNames, setMachineNames] = useState([]);
    const [page, setPage] = useState(0);
    const [size, setSize] = useState(50);
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [lookupItemId, setLookupItemId] = useState("");
    const [lookupResult, setLookupResult] = useState(null);
    const [lookupLoading, setLookupLoading] = useState(false);
    const [lookupError, setLookupError] = useState(null);

    useEffect(() => {
        let cancelled = false;
        fetchChronostoryGachaponDropMachineNames()
            .then((res) => {
                if (cancelled) return;
                const list = res?.data ?? res ?? [];
                setMachineNames(Array.isArray(list) ? list : []);
            })
            .catch(() => {
                if (!cancelled) setMachineNames([]);
            });
        return () => { cancelled = true; };
    }, []);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetchChronostoryGachaponDrops({
                itemId: submitItemId.trim() || undefined,
                itemName: submitItemName.trim() || undefined,
                itemNameKr: submitItemNameKr.trim() || undefined,
                machineName: submitMachineName.trim() || undefined,
                page,
                size
            });
            const payload = res?.data ?? res;
            setData(payload);
        } catch (e) {
            setError(e?.message ?? "조회 실패");
            setData(null);
        } finally {
            setLoading(false);
        }
    }, [submitItemId, submitItemName, submitItemNameKr, submitMachineName, page, size]);

    useEffect(() => {
        load();
    }, [load]);

    const handleSearch = (e) => {
        e?.preventDefault();
        setSubmitItemId(itemId);
        setSubmitItemName(itemName);
        setSubmitItemNameKr(itemNameKr);
        setSubmitMachineName(machineName);
        setPage(0);
    };

    const handleLookupItemType = async (e) => {
        e?.preventDefault();
        const id = String(lookupItemId ?? "").trim();
        if (!id) return;
        setLookupLoading(true);
        setLookupError(null);
        setLookupResult(null);
        try {
            const res = await fetchItemDetailByCode(id);
            if (!res) {
                setLookupResult({ notFound: true });
                return;
            }
            const item = res?.data ?? res;
            setLookupResult({
                name: item?.name ?? "-",
                category: item?.category ?? null,
                subCategory: item?.subCategory ?? null
            });
        } catch (err) {
            setLookupError(err?.message ?? "조회 실패");
        } finally {
            setLookupLoading(false);
        }
    };

    const items = data?.items ?? [];
    const totalElements = Number(data?.totalElements ?? 0);
    const totalPages = Number(data?.totalPages ?? 0);
    const columns = items.length > 0 ? Object.keys(items[0]) : [];

    return (
        <div className="map-page">
            <div className="map-header">
                <h2>아이템 목록</h2>
                <p className="map-subtitle">가챠폰(가챠 기계)별 드랍 아이템과 확률을 조회할 수 있습니다. 기계·등급 등을 선택한 뒤 조회하세요.</p>
            </div>

            <section className="map-card" style={{ maxWidth: "100%" }}>
                <div className="map-card-header">
                    <h3>조회</h3>
                    <span className="map-badge">{totalElements}건</span>
                </div>
                <div className="map-card-body">
                    <form onSubmit={handleSearch} style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "16px" }}>
                        <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
                            <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "14px" }}>
                                기계명
                                <select
                                    value={machineName}
                                    onChange={(e) => setMachineName(e.target.value)}
                                    style={{ padding: "6px 8px", borderRadius: "6px", border: "1px solid var(--app-border)", minWidth: "140px" }}
                                >
                                    <option value="">전체</option>
                                    {machineNames.map((name) => (
                                        <option key={name} value={name}>{name}</option>
                                    ))}
                                </select>
                            </label>
                            <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "14px" }}>
                                아이템 ID
                                <input
                                    type="text"
                                    placeholder="아이템 ID"
                                    value={itemId}
                                    onChange={(e) => setItemId(e.target.value)}
                                    style={{ padding: "6px 8px", borderRadius: "6px", border: "1px solid var(--app-border)", minWidth: "120px" }}
                                />
                            </label>
                            <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "14px" }}>
                                아이템명
                                <input
                                    type="text"
                                    placeholder="아이템명"
                                    value={itemName}
                                    onChange={(e) => setItemName(e.target.value)}
                                    style={{ padding: "6px 8px", borderRadius: "6px", border: "1px solid var(--app-border)", minWidth: "140px" }}
                                />
                            </label>
                            <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "14px" }}>
                                아이템명(한글)
                                <input
                                    type="text"
                                    placeholder="아이템명(한글)"
                                    value={itemNameKr}
                                    onChange={(e) => setItemNameKr(e.target.value)}
                                    style={{ padding: "6px 8px", borderRadius: "6px", border: "1px solid var(--app-border)", minWidth: "140px" }}
                                />
                            </label>
                            <button type="submit" className="map-btn map-btn-primary">
                                조회
                            </button>
                            <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "14px" }}>
                                크기
                            <select
                                value={size}
                                onChange={(e) => { setSize(Number(e.target.value)); setPage(0); }}
                                style={{ padding: "6px 8px", borderRadius: "6px", border: "1px solid var(--app-border)" }}
                            >
                                {[20, 50, 100, 200].map((n) => (
                                    <option key={n} value={n}>{n}</option>
                                ))}
                            </select>
                            </label>
                        </div>
                    </form>

                    <div style={{ marginBottom: "16px", padding: "12px", background: "var(--app-bg-secondary, #f5f5f5)", borderRadius: "8px" }}>
                        <h4 style={{ margin: "0 0 8px 0", fontSize: "14px" }}>아이템 ID로 구분 조회</h4>
                        <p style={{ margin: "0 0 8px 0", fontSize: "12px", color: "var(--app-muted-text-color)" }}>아이템 ID를 입력하면 장비/소비/기타 등 구분을 조회합니다.</p>
                        <form onSubmit={handleLookupItemType} style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
                            <input
                                type="text"
                                placeholder="아이템 ID"
                                value={lookupItemId}
                                onChange={(e) => setLookupItemId(e.target.value)}
                                style={{ padding: "6px 8px", borderRadius: "6px", border: "1px solid var(--app-border)", width: "120px" }}
                            />
                            <button type="submit" className="map-btn map-btn-primary" disabled={lookupLoading}>
                                {lookupLoading ? "조회 중…" : "구분 조회"}
                            </button>
                            {lookupError && <span style={{ fontSize: "12px", color: "var(--app-error-color, #c62828)" }}>{lookupError}</span>}
                        </form>
                        {lookupResult && !lookupLoading && (
                            <div style={{ marginTop: "8px", fontSize: "14px" }}>
                                {lookupResult.notFound ? (
                                    <span style={{ color: "var(--app-muted-text-color)" }}>미등록 (DB에 없는 아이템 ID입니다)</span>
                                ) : (
                                    <>
                                        <strong>{lookupResult.name}</strong>
                                        {" · "}
                                        <span>
                                            {lookupResult.category ?? "—"}
                                            {lookupResult.subCategory ? ` (${lookupResult.subCategory})` : ""}
                                        </span>
                                    </>
                                )}
                            </div>
                        )}
                    </div>

                    {error && <div className="map-error" style={{ marginBottom: "12px" }}>{error}</div>}
                    {loading && <div className="map-empty">로딩 중...</div>}

                    {!loading && !error && (
                        <>
                            {items.length === 0 ? (
                                <div className="map-empty">데이터가 없습니다.</div>
                            ) : (
                                <div style={{ overflowX: "auto" }}>
                                    <table className="map-table" style={{ width: "100%", borderCollapse: "collapse" }}>
                                        <thead>
                                            <tr>
                                                {columns.map((col) => (
                                                    <th key={col} style={{ textAlign: "left", padding: "8px 10px", borderBottom: "2px solid var(--app-border)", whiteSpace: "nowrap" }}>
                                                        {COLUMN_LABELS[col] ?? col}
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {items.map((row, idx) => (
                                                <tr key={row.id ?? idx}>
                                                    {columns.map((col) => {
                                                        const val = getCellValue(row, col);
                                                        const isItemId = /item_id|itemid/i.test(col);
                                                        const imgUrl = isItemId && val != null ? getItemImageUrl(val) : null;
                                                        return (
                                                            <td key={col} style={{ padding: "8px 10px", borderBottom: "1px solid var(--app-border)", verticalAlign: "middle" }}>
                                                                {imgUrl && (
                                                                    <img
                                                                        src={imgUrl}
                                                                        alt=""
                                                                        style={{ width: 24, height: 24, marginRight: 6, verticalAlign: "middle", objectFit: "contain" }}
                                                                        onError={(e) => { e.target.style.display = "none"; }}
                                                                    />
                                                                )}
                                                                {val != null && val !== "" ? String(val) : "-"}
                                                            </td>
                                                        );
                                                    })}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {totalPages > 1 && (
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginTop: "16px", flexWrap: "wrap" }}>
                                    <button
                                        type="button"
                                        className="map-btn"
                                        disabled={page <= 0}
                                        onClick={() => setPage((p) => Math.max(0, p - 1))}
                                    >
                                        이전
                                    </button>
                                    <span style={{ fontSize: "14px" }}>
                                        {page + 1} / {totalPages} (총 {totalElements}건)
                                    </span>
                                    <button
                                        type="button"
                                        className="map-btn"
                                        disabled={page >= totalPages - 1}
                                        onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                                    >
                                        다음
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </section>
        </div>
    );
}
