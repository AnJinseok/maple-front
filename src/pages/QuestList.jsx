import { useCallback, useEffect, useMemo, useState } from "react";
import { useWorld } from "../contexts/WorldContext";
import { fetchChronostoryQuests, getNpcImageUrl, getNpcImageUrlByFilePath } from "../api/mapleApi";

const CSV_PATH = "/data/QuestDatabase.csv";

/**
 * 간단한 CSV 파싱 (쉼표 구분, 큰따옴표 필드 지원)
 */
function parseCSV(text) {
    if (!text || typeof text !== "string") return { headers: [], rows: [] };
    const lines = text.split(/\r?\n/).filter((line) => line.trim() !== "");
    if (lines.length === 0) return { headers: [], rows: [] };
    const parseRow = (line) => {
        const result = [];
        let current = "";
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
            const c = line[i];
            if (c === '"') {
                inQuotes = !inQuotes;
            } else if (inQuotes) {
                current += c;
            } else if (c === ",") {
                result.push(current.trim());
                current = "";
            } else {
                current += c;
            }
        }
        result.push(current.trim());
        return result;
    };
    const headers = parseRow(lines[0]);
    const rows = lines.slice(1).map((line) => parseRow(line));
    return { headers, rows };
}

/** API items 또는 CSV rows → 공통 객체 배열 (목록/상세용) */
function toQuestItems(source, apiItems, csvHeaders, csvRows) {
    if (source === "api" && Array.isArray(apiItems)) {
        return apiItems;
    }
    if (source === "csv" && Array.isArray(csvHeaders) && csvHeaders.length > 0 && Array.isArray(csvRows)) {
        return csvRows.map((row) => {
            const obj = {};
            csvHeaders.forEach((h, i) => { obj[h] = row[i] ?? ""; });
            return obj;
        });
    }
    return [];
}

/** 퀘스트 제목 문자열 (검색용) */
function getQuestDisplayNameText(item) {
    if (!item) return "";
    const kr = String(item.quest_name_kr ?? item.questNameKr ?? "").trim();
    const en = String(item.quest_name ?? item.questName ?? item.QuestName ?? item.QuestID ?? "").trim();
    if (kr) return en ? `${kr} ${en}` : kr;
    return en ? en : "";
}

/** 퀘스트 한 건에서 목록에 쓸 제목: 한글(줄바꿈)영어(작은글씨), 한글 없으면 -(영어) */
function getQuestDisplayName(item) {
    if (!item) return "(이름 없음)";
    const kr = String(item.quest_name_kr ?? item.questNameKr ?? "").trim();
    const en = String(item.quest_name ?? item.questName ?? item.QuestName ?? item.QuestID ?? "").trim();
    if (!kr && !en) return "(이름 없음)";
    return (
        <>
            {kr || "-"}
            {en ? (
                <span style={{ display: "block", fontSize: "0.85em", color: "var(--app-muted-text-color, #666)", marginTop: "2px" }}>
                    {kr ? en : `(${en})`}
                </span>
            ) : null}
        </>
    );
}

/** 퀘스트 한 건에서 목록 메타: NPC · 요구레벨 · 경험치 */
function getQuestMeta(item) {
    if (!item) return "";
    const npc = item.npc_name ?? item.npcName ?? item.QuestNPCName ?? "";
    const level = item.req_level ?? item.reqLevel ?? item.ReqLevel ?? "";
    const exp = item.reward_exp ?? item.rewardExp ?? "";
    const parts = [];
    if (String(npc).trim()) parts.push(String(npc).trim());
    if (String(level).trim()) parts.push(`Lv.${level}`);
    if (exp !== "" && exp !== null && exp !== undefined) parts.push(`경험치 ${Number(exp).toLocaleString()}`);
    return parts.join(" · ");
}

/** 퀘스트 한 건의 고유 키 */
function getQuestKey(item, index) {
    if (!item) return `quest-${index}`;
    const id = item.id ?? item.quest_id ?? item.questId ?? item.QuestID ?? "";
    const s = String(id).trim();
    return s || `quest-${index}`;
}

/**
 * 크로노스토리 퀘스트 DB 페이지
 * - 맵 리스트와 동일한 레이아웃: 좌측 목록 + 우측 상세
 */
export default function QuestList() {
    const { world } = useWorld();
    const isChronoStoryWorld = world === "크로노스토리";

    const [source, setSource] = useState(null); // "api" | "csv" | null
    const [apiItems, setApiItems] = useState(null);
    const [csvText, setCsvText] = useState(null);
    const [csvData, setCsvData] = useState({ headers: [], rows: [] });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState("");
    const [submitSearch, setSubmitSearch] = useState("");
    const [page, setPage] = useState(0);
    const [size, setSize] = useState(50);
    const [totalElements, setTotalElements] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [selectedQuest, setSelectedQuest] = useState(null);
    const [sortBy, setSortBy] = useState(null);
    const [sortOrder, setSortOrder] = useState("asc");
    const [visibleColumns, setVisibleColumns] = useState({
        quest_name_kr: true,
        quest_name: true,
        npc_name: true,
        req_level: true,
        reward_exp: true
    });
    const [showColumnMenu, setShowColumnMenu] = useState(false);

    /** CSV 폴백 로드 (API 실패 또는 데이터 없을 때만 사용, loadFromApi보다 먼저 정의) */
    const loadStaticCsv = useCallback(() => {
        setLoading(true);
        setError(null);
        fetch(CSV_PATH)
            .then((res) => {
                if (!res.ok) throw new Error("퀘스트 데이터를 불러올 수 없습니다.");
                return res.text();
            })
            .then((text) => {
                setCsvText(text);
                setCsvData(parseCSV(text));
                setSource("csv");
            })
            .catch((err) => {
                setError(err.message || "로드 실패");
                setCsvText(null);
                setCsvData({ headers: [], rows: [] });
                setSource(null);
            })
            .finally(() => setLoading(false));
    }, []);

    const loadFromApi = useCallback((pageNum = 0, pageSize = size) => {
        setLoading(true);
        setError(null);
        const keyword = submitSearch.trim() || undefined;
        const params = { page: pageNum, size: pageSize, keyword };
        if (sortBy) {
            params.sortBy = sortBy;
            params.sortOrder = sortOrder;
        }
        fetchChronostoryQuests(params)
            .then((res) => {
                const data = res?.data ?? res;
                const items = data?.items ?? [];
                const total = Number(data?.totalElements ?? 0);
                const pages = Number(data?.totalPages ?? 0);
                setApiItems(items);
                setTotalElements(total);
                setTotalPages(pages);
                if (items.length > 0 || total > 0) {
                    setSource("api");
                    setCsvText(null);
                    setCsvData({ headers: [], rows: [] });
                } else {
                    setApiItems(null);
                    setSource(null);
                    loadStaticCsv();
                }
                setLoading(false);
            })
            .catch(() => {
                setApiItems(null);
                setSource(null);
                loadStaticCsv();
            })
            .finally(() => setLoading(false));
    }, [submitSearch, size, sortBy, sortOrder, loadStaticCsv]);

    useEffect(() => {
        if (isChronoStoryWorld) {
            loadFromApi(page, size);
        } else {
            setLoading(false);
            setSelectedQuest(null);
        }
    }, [isChronoStoryWorld, page, submitSearch, size, sortBy, sortOrder, loadFromApi]);

    const questItems = useMemo(() => {
        return toQuestItems(source, apiItems, csvData.headers, csvData.rows);
    }, [source, apiItems, csvData.headers, csvData.rows]);

    /** 테이블 열 설정 (헤더·표시 메뉴 공용) */
    const questTableColumns = useMemo(() => [
        { key: "quest_name_kr", label: "퀘스트명(한글)", style: { minWidth: "120px" } },
        { key: "quest_name", label: "퀘스트명(영문)", style: { minWidth: "140px" } },
        { key: "npc_name", label: "NPC", style: { minWidth: "100px" } },
        { key: "req_level", label: "요구레벨", style: { width: "70px", textAlign: "center" } },
        { key: "reward_exp", label: "경험치", style: { width: "90px", textAlign: "right" } }
    ], []);

    /** 상세에 표시할 라벨 매핑 (snake_case → 한글) */
    const detailLabelMap = useMemo(() => ({
        quest_id: "퀘스트 ID",
        quest_name: "퀘스트명",
        quest_name_kr: "퀘스트명(한글)",
        region: "지역",
        region_name: "지역명",
        npc_id: "제공자 NPC ID",
        npc_name: "퀘스트 제공자",
        parent_name: "상위명",
        quest_order: "순서",
        sort_order: "정렬",
        prereq_quest_1: "선행 퀘스트 1",
        prereq_quest_name_1: "선행 퀘스트명 1",
        prereq_quest_2: "선행 퀘스트 2",
        prereq_quest_name_2: "선행 퀘스트명 2",
        req_level: "요구 레벨",
        req_jobs: "요구 직업",
        give_item_1: "지급 아이템 1",
        give_item_name_1: "지급 아이템명 1",
        give_item_count_1: "지급 개수 1",
        req_npc: "요구 NPC",
        req_npc_name: "요구 NPC명",
        req_mesos: "요구 메소",
        req_item_1: "요구 아이템 1",
        req_item_name_1: "요구 아이템명 1",
        req_item_count_1: "요구 개수 1",
        req_item_2: "요구 아이템 2",
        req_item_name_2: "요구 아이템명 2",
        req_item_count_2: "요구 개수 2",
        req_item_3: "요구 아이템 3",
        req_item_name_3: "요구 아이템명 3",
        req_item_count_3: "요구 개수 3",
        req_item_4: "요구 아이템 4",
        req_item_name_4: "요구 아이템명 4",
        req_item_count_4: "요구 개수 4",
        req_mob_1: "요구 몹 1",
        req_mob_name_1: "요구 몹명 1",
        req_mob_count_1: "요구 몹 수 1",
        req_mob_2: "요구 몹 2",
        req_mob_name_2: "요구 몹명 2",
        req_mob_count_2: "요구 몹 수 2",
        reward_exp: "보상 경험치",
        random_item_reward: "랜덤 보상",
        random_item_reward_count: "랜덤 보상 개수",
        random_item_reward_chance: "랜덤 보상 확률",
        select_item_reward: "선택 보상",
        select_item_reward_count: "선택 보상 개수",
        reward_item_1: "보상 아이템 1",
        reward_item_name_1: "보상 아이템명 1",
        reward_item_count_1: "보상 개수 1",
        reward_item_2: "보상 아이템 2",
        reward_item_name_2: "보상 아이템명 2",
        reward_item_count_2: "보상 개수 2",
        reward_mesos: "보상 메소",
        reward_fame: "보상 명성",
        journal_0: "대화 1",
        journal_1: "대화 2",
        journal_2: "대화 3",
        contents: "퀘스트 내용",
        contents_kr: "퀘스트 내용(한글)",
        requirements: "조건",
        rewards: "보상",
        category: "카테고리",
        created_at: "등록일",
        updated_at: "수정일"
    }), []);

    const renderDetailValue = (key, value) => {
        if (value === undefined || value === null || String(value).trim() === "") return "-";
        const s = String(value).trim();
        if (s.length > 200) return <span style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{s}</span>;
        return s;
    };

    /** 퀘스트 내용에서 #r(빨강) #b(파랑) #g(초록) #e(보라) #k(끝) #cRRGGBB(커스텀) 등 색상 코드 반영, 줄바꿈은 그대로 표시 */
    const renderQuestContent = (text) => {
        if (text == null || String(text).trim() === "") return null;
        let s = String(text)
            .replace(/\r\n/g, "\n")
            .replace(/\r/g, "\n")
            .replace(/\\n/g, "\n")
            .replace(/#r/gi, "<span style=\"color:#e53935\">")
            .replace(/#b/gi, "<span style=\"color:#1e88e5\">")
            .replace(/#g/gi, "<span style=\"color:#43a047\">")
            .replace(/#e/gi, "<span style=\"color:#8e24aa\">")
            .replace(/#k/gi, "</span>")
            .replace(/#c([0-9a-fA-F]{6})/g, (_, hex) => `<span style="color:#${hex}">`)
            .replace(/\n/g, "<br />");
        const openCount = (s.match(/<span/g) || []).length;
        const closeCount = (s.match(/<\/span>/g) || []).length;
        if (openCount > closeCount) s += "</span>".repeat(openCount - closeCount);
        return <div className="map-info-value" style={{ whiteSpace: "pre-wrap", wordBreak: "break-word", lineHeight: 1.5 }} dangerouslySetInnerHTML={{ __html: s }} />;
    };

    return (
        <div className="map-page">
            <div className="map-header">
                <h2>퀘스트</h2>
                {isChronoStoryWorld ? (
                    <>
                        <p className="map-subtitle">퀘스트명으로 검색한 뒤 목록에서 선택하면 상세(보상·조건 등)를 볼 수 있습니다.</p>
                        <p className="map-subtitle">선택된 월드: <b>{world}</b></p>
                    </>
                ) : (
                    <>
                        <p className="map-subtitle">퀘스트는 크로노스토리 월드에서만 이용할 수 있습니다.</p>
                        <p className="map-subtitle">선택된 월드: <b>{world}</b></p>
                    </>
                )}
            </div>

            <div className="map-grid monster-list-grid">
                {/* 좌측: 퀘스트 목록 */}
                <section className="map-card map-list-card">
                    <div className="map-card-header">
                        <h3>퀘스트 목록</h3>
                        {totalElements > 0 && <span className="map-badge">{totalElements.toLocaleString()}개</span>}
                    </div>
                    {isChronoStoryWorld && (
                        <form
                            onSubmit={(e) => { e.preventDefault(); setSubmitSearch(search); setPage(0); }}
                            style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "12px" }}
                        >
                            <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
                                <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "14px" }}>
                                    검색
                                    <input
                                        type="text"
                                        placeholder="퀘스트명, 지역, NPC 등"
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        style={{ padding: "6px 8px", borderRadius: "6px", border: "1px solid var(--app-border)", minWidth: "160px" }}
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
                    )}
                    {!isChronoStoryWorld && (
                        <div className="map-empty">크로노스토리 월드에서만 퀘스트를 이용할 수 있습니다.</div>
                    )}
                    {isChronoStoryWorld && loading && <div className="map-empty">퀘스트 데이터 로딩 중...</div>}
                    {isChronoStoryWorld && !loading && error && !csvText && !apiItems?.length && (
                        <div className="map-error">
                            {error}
                            <div style={{ marginTop: "8px", fontSize: "12px", color: "var(--app-muted-text-color)" }}>
                                API 연결을 확인한 뒤 새로고침하세요.
                            </div>
                        </div>
                    )}
                    {isChronoStoryWorld && !loading && (source === "api" || source === "csv") && questItems.length === 0 && (
                        <div className="map-empty">
                            {submitSearch.trim() ? "검색 결과가 없습니다." : "퀘스트 데이터가 없습니다."}
                        </div>
                    )}
                    {isChronoStoryWorld && !loading && (source === "api" || source === "csv") && questItems.length > 0 && (
                        <>
                        <div className="map-list-and-pagination">
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", marginBottom: "6px", minHeight: "32px" }}>
                            <div style={{ position: "relative" }}>
                                <button
                                    type="button"
                                    className="map-btn"
                                    onClick={() => setShowColumnMenu((v) => !v)}
                                    style={{ padding: "4px 10px", fontSize: "13px" }}
                                >
                                    표시 {showColumnMenu ? "▲" : "▼"}
                                </button>
                                {showColumnMenu && (
                                    <>
                                        <div
                                            role="presentation"
                                            style={{ position: "fixed", inset: 0, zIndex: 10 }}
                                            onClick={() => setShowColumnMenu(false)}
                                        />
                                        <div
                                            style={{
                                                position: "absolute",
                                                top: "100%",
                                                right: 0,
                                                marginTop: "4px",
                                                padding: "8px",
                                                background: "var(--app-bg, #fff)",
                                                border: "1px solid var(--app-border)",
                                                borderRadius: "8px",
                                                boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                                                zIndex: 11,
                                                minWidth: "160px"
                                            }}
                                        >
                                            <div style={{ fontSize: "12px", fontWeight: 600, marginBottom: "6px", color: "var(--app-muted-text-color)" }}>표시할 열</div>
                                            {questTableColumns.map(({ key, label }) => {
                                                const isChecked = !!visibleColumns[key];
                                                const visibleCount = questTableColumns.filter((c) => visibleColumns[c.key]).length;
                                                const canUncheck = visibleCount > 1 || !isChecked;
                                                return (
                                                    <label key={key} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "4px 0", cursor: canUncheck ? "pointer" : "default", fontSize: "14px" }}>
                                                        <input
                                                            type="checkbox"
                                                            checked={isChecked}
                                                            disabled={!canUncheck}
                                                            onChange={() => canUncheck && setVisibleColumns((prev) => ({ ...prev, [key]: !prev[key] }))}
                                                        />
                                                        {label}
                                                    </label>
                                                );
                                            })}
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                        <div className="map-monster-table-wrap" style={{ overflowX: "auto" }}>
                            <table className="map-table quest-list-table">
                                <thead>
                                    <tr>
                                        {questTableColumns.filter((col) => visibleColumns[col.key]).map(({ key, label, style }) => {
                                            const isActive = sortBy === key;
                                            const handleSort = () => {
                                                if (sortBy === key) {
                                                    setSortOrder((o) => (o === "asc" ? "desc" : "asc"));
                                                } else {
                                                    setSortBy(key);
                                                    setSortOrder("asc");
                                                }
                                                setPage(0);
                                            };
                                            return (
                                                <th key={key} style={style}>
                                                    <button
                                                        type="button"
                                                        onClick={handleSort}
                                                        className="quest-sort-th"
                                                        style={{
                                                            background: "none",
                                                            border: "none",
                                                            padding: "4px 6px",
                                                            cursor: "pointer",
                                                            fontWeight: isActive ? 700 : undefined,
                                                            display: "inline-flex",
                                                            alignItems: "center",
                                                            gap: "4px"
                                                        }}
                                                    >
                                                        {label}
                                                        {isActive && (sortOrder === "asc" ? " ▲" : " ▼")}
                                                    </button>
                                                </th>
                                            );
                                        })}
                                    </tr>
                                </thead>
                                <tbody>
                                    {questItems.map((item, index) => {
                                        const key = getQuestKey(item, index);
                                        const isSelected = selectedQuest && getQuestKey(selectedQuest, -1) === key;
                                        const cellByKey = {
                                            quest_name_kr: String(item.quest_name_kr ?? item.questNameKr ?? "").trim() || "-",
                                            quest_name: String(item.quest_name ?? item.questName ?? item.QuestName ?? item.QuestID ?? "").trim() || "-",
                                            npc_name: String(item.npc_name ?? item.npcName ?? "").trim() || "-",
                                            req_level: (item.req_level ?? item.reqLevel ?? "") !== "" && (item.req_level ?? item.reqLevel) != null ? (item.req_level ?? item.reqLevel) : "-",
                                            reward_exp: (() => {
                                                const exp = item.reward_exp ?? item.rewardExp ?? "";
                                                return exp !== "" && exp != null && exp !== undefined ? Number(exp).toLocaleString() : "-";
                                            })()
                                        };
                                        const tdStyleByKey = {
                                            quest_name_kr: { fontWeight: 600 },
                                            quest_name: { fontSize: "12px", color: "var(--app-muted-text-color)" },
                                            npc_name: {},
                                            req_level: { textAlign: "center" },
                                            reward_exp: { textAlign: "right", fontWeight: 600 }
                                        };
                                        return (
                                            <tr
                                                key={key}
                                                onClick={() => setSelectedQuest(item)}
                                                role="button"
                                                tabIndex={0}
                                                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setSelectedQuest(item); } }}
                                                style={{
                                                    cursor: "pointer",
                                                    background: isSelected ? "var(--app-bg-secondary, rgba(0,0,0,0.06))" : undefined
                                                }}
                                            >
                                                {questTableColumns.filter((col) => visibleColumns[col.key]).map((col) => (
                                                    <td key={col.key} style={tdStyleByKey[col.key]}>
                                                        {cellByKey[col.key]}
                                                    </td>
                                                ))}
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                        {totalPages > 1 && (
                            <div className="map-pagination" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "8px", paddingTop: "8px", borderTop: "1px solid var(--app-border)" }}>
                                <button
                                    type="button"
                                    className="map-btn"
                                    disabled={page <= 0 || loading}
                                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                                >
                                    이전
                                </button>
                                <span style={{ fontSize: "13px", color: "var(--app-muted-text-color)" }}>
                                    {page + 1} / {totalPages} (총 {totalElements.toLocaleString()}건)
                                </span>
                                <button
                                    type="button"
                                    className="map-btn"
                                    disabled={page >= totalPages - 1 || loading}
                                    onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                                >
                                    다음
                                </button>
                            </div>
                        )}
                        </div>
                        </>
                    )}
                </section>

                {/* 우측: 퀘스트 상세 */}
                <section className="map-card map-detail-card">
                    <div className="map-card-header">
                        <h3>상세</h3>
                    </div>
                    {!selectedQuest && (
                        <div className="map-empty">왼쪽에서 퀘스트를 선택해주세요.</div>
                    )}
                    {selectedQuest && (
                        <div className="map-detail">
                            {(() => {
                                const npcPath = selectedQuest.npc_file_path ?? selectedQuest.npcFilePath ?? "";
                                const npcImgUrl = npcPath ? getNpcImageUrlByFilePath(npcPath) : getNpcImageUrl(selectedQuest.npc_id ?? selectedQuest.npcId);
                                const npcName = selectedQuest.npc_name ?? selectedQuest.npcName ?? "";
                                if (!npcImgUrl) return null;
                                return (
                                    <div className="map-section" style={{ marginBottom: "16px" }}>
                                        <h4>퀘스트 제공자</h4>
                                        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                                            <img
                                                src={npcImgUrl}
                                                alt={npcName || "NPC"}
                                                style={{ width: 64, height: 64, objectFit: "contain", borderRadius: "8px", background: "var(--app-bg-secondary, #f0f0f0)" }}
                                                onError={(e) => { e.target.style.display = "none"; }}
                                            />
                                            {npcName && <span style={{ fontWeight: 600, fontSize: "15px" }}>{npcName}</span>}
                                        </div>
                                    </div>
                                );
                            })()}
                            <div className="map-section">
                                <h4>기본 정보</h4>
                                <div className="map-info-grid">
                                    {["quest_name", "quest_name_kr", "region", "region_name", "npc_id", "npc_name", "parent_name", "quest_order", "req_level", "req_jobs"].map((k) => {
                                        const label = detailLabelMap[k] ?? k;
                                        const val = selectedQuest[k] ?? selectedQuest[k.replace(/_/g, "")] ?? "";
                                        return (
                                            <div key={k} className="map-info-item">
                                                <div className="map-info-label">{label}</div>
                                                <div className="map-info-value">{renderDetailValue(k, val)}</div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                            <div className="map-section">
                                <h4>선행 퀘스트</h4>
                                <div className="map-info-grid">
                                    {["prereq_quest_1", "prereq_quest_name_1", "prereq_quest_2", "prereq_quest_name_2"].map((k) => {
                                        const label = detailLabelMap[k] ?? k;
                                        const val = selectedQuest[k] ?? "";
                                        return (
                                            <div key={k} className="map-info-item">
                                                <div className="map-info-label">{label}</div>
                                                <div className="map-info-value">{renderDetailValue(k, val)}</div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                            <div className="map-section">
                                <h4>요구 조건 (아이템/몹/메소)</h4>
                                <div className="map-info-grid">
                                    {["give_item_1", "give_item_name_1", "give_item_count_1", "req_npc", "req_npc_name", "req_mesos",
                                        "req_item_1", "req_item_name_1", "req_item_count_1", "req_item_2", "req_item_name_2", "req_item_count_2",
                                        "req_item_3", "req_item_name_3", "req_item_count_3", "req_item_4", "req_item_name_4", "req_item_count_4",
                                        "req_mob_1", "req_mob_name_1", "req_mob_count_1", "req_mob_2", "req_mob_name_2", "req_mob_count_2"
                                    ].map((k) => {
                                        const label = detailLabelMap[k] ?? k;
                                        const val = selectedQuest[k] ?? "";
                                        if (!val && String(val) !== "0") return null;
                                        return (
                                            <div key={k} className="map-info-item">
                                                <div className="map-info-label">{label}</div>
                                                <div className="map-info-value">{renderDetailValue(k, val)}</div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                            {(() => {
                                const req = selectedQuest?.requirements ?? selectedQuest?.requirementsParsed;
                                if (!req) return null;
                                const boxStyle = {
                                    marginTop: "8px",
                                    padding: "12px",
                                    background: "var(--app-bg-tertiary, #f8f9fa)",
                                    borderRadius: "8px",
                                    border: "1px solid var(--app-border-color, rgba(0,0,0,0.1))"
                                };
                                const rowStyle = {
                                    display: "flex", alignItems: "center", padding: "8px 12px",
                                    background: "var(--app-bg-secondary, rgba(0,0,0,0.04))", borderRadius: "6px",
                                    marginBottom: "6px", border: "1px solid var(--app-border-color, rgba(0,0,0,0.08))", fontSize: "14px"
                                };
                                let itemList = [];
                                let npcList = [];
                                try {
                                    const obj = typeof req === "string" ? JSON.parse(req) : req;
                                    const itemArr = obj?.item ?? obj?.items ?? [];
                                    const npcArr = obj?.npc ?? obj?.npcs ?? [];
                                    if (Array.isArray(itemArr)) {
                                        itemList = itemArr.map((it, i) => {
                                            const id = it?.id ?? it?.item_id ?? "-";
                                            const name = it?.name ?? it?.item_name_kr ?? it?.item_name_en ?? "";
                                            const count = it?.count ?? "?";
                                            const display = name ? `${name} x ${count}` : `ID ${id} x ${count}`;
                                            return <div key={`req-item-${i}`} style={rowStyle}><span style={{ marginRight: "10px", color: "var(--app-muted-text-color, #666)", fontWeight: 600 }}>{i + 1}.</span><span>{display}</span></div>;
                                        });
                                    }
                                    if (Array.isArray(npcArr)) {
                                        npcList = npcArr.map((n, i) => {
                                            const id = n?.id ?? n?.npc_id ?? "-";
                                            const name = n?.name ?? n?.npc_name ?? "";
                                            const count = n?.count ?? "?";
                                            const display = name ? (count !== "?" ? `${name} 만나기 x ${count}` : `${name} 만나기`) : `NPC ID ${id}`;
                                            return <div key={`req-npc-${i}`} style={rowStyle}><span style={{ marginRight: "10px", color: "var(--app-muted-text-color, #666)", fontWeight: 600 }}>{i + 1}.</span><span>{display}</span></div>;
                                        });
                                    }
                                    if (obj?.itemLines && Array.isArray(obj.itemLines)) {
                                        itemList = obj.itemLines.map((line, i) => <div key={`req-line-${i}`} style={rowStyle}><span style={{ marginRight: "10px", color: "var(--app-muted-text-color, #666)", fontWeight: 600 }}>{i + 1}.</span><span>{line}</span></div>);
                                    }
                                    if (obj?.npcLines && Array.isArray(obj.npcLines)) {
                                        npcList = obj.npcLines.map((line, i) => <div key={`npc-line-${i}`} style={rowStyle}><span style={{ marginRight: "10px", color: "var(--app-muted-text-color, #666)", fontWeight: 600 }}>{i + 1}.</span><span>{line}</span></div>);
                                    }
                                } catch (_) { /* ignore */ }
                                if (itemList.length === 0 && npcList.length === 0) return null;
                                return (
                                    <div className="map-section">
                                        <h4>조건 (요구 아이템 · NPC)</h4>
                                        <div style={boxStyle}>
                                            {itemList.length > 0 && (
                                                <>
                                                    <div style={{ fontSize: "12px", color: "var(--app-muted-text-color)", marginBottom: "6px", fontWeight: 600 }}>요구 아이템</div>
                                                    {itemList}
                                                </>
                                            )}
                                            {npcList.length > 0 && (
                                                <>
                                                    <div style={{ fontSize: "12px", color: "var(--app-muted-text-color)", marginBottom: "6px", marginTop: itemList.length ? "12px" : 0, fontWeight: 600 }}>요구 NPC</div>
                                                    {npcList}
                                                </>
                                            )}
                                        </div>
                                    </div>
                                );
                            })()}
                            <div className="map-section">
                                <h4>보상</h4>
                                <div className="map-info-grid">
                                    {["reward_exp", "reward_mesos", "reward_fame",
                                        "random_item_reward", "random_item_reward_count", "random_item_reward_chance",
                                        "select_item_reward", "select_item_reward_count",
                                        "reward_item_1", "reward_item_name_1", "reward_item_count_1",
                                        "reward_item_2", "reward_item_name_2", "reward_item_count_2"
                                    ].map((k) => {
                                        const label = detailLabelMap[k] ?? k;
                                        const val = selectedQuest[k] ?? "";
                                        if (!val && String(val) !== "0") return null;
                                        return (
                                            <div key={k} className="map-info-item">
                                                <div className="map-info-label">{label}</div>
                                                <div className="map-info-value">{renderDetailValue(k, val)}</div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                            {["journal_0", "journal_1", "journal_2"].some((k) => selectedQuest[k]) && (
                                <div className="map-section">
                                    <h4>대화</h4>
                                    <div className="map-info-value" style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                                        {(() => {
                                            const parts = ["journal_0", "journal_1", "journal_2"]
                                                .map((k) => selectedQuest[k] ?? selectedQuest[k.replace(/_/g, "")])
                                                .filter((v) => v != null && String(v).trim() !== "");
                                            return renderDetailValue(null, parts.join("\n\n"));
                                        })()}
                                    </div>
                                </div>
                            )}
                            {(() => {
                                const rewards = selectedQuest?.rewards ?? selectedQuest?.rewardParsed;
                                if (!rewards) return null;
                                let list = null;
                                try {
                                    const obj = typeof rewards === "string" ? JSON.parse(rewards) : rewards;
                                    const arr = obj?.item ?? obj?.items ?? [];
                                    if (Array.isArray(arr) && arr.length > 0) {
                                        list = arr.map((it, i) => {
                                            const id = it?.id ?? it?.item_id ?? "-";
                                            const name = it?.name ?? it?.item_name_kr ?? it?.item_name_en ?? "";
                                            const count = it?.count ?? "?";
                                            const display = name ? `${name} x ${count}` : `ID ${id} x ${count}`;
                                            return (
                                                <div
                                                    key={i}
                                                    style={{
                                                        display: "flex",
                                                        alignItems: "center",
                                                        padding: "8px 12px",
                                                        background: "var(--app-bg-secondary, rgba(0,0,0,0.04))",
                                                        borderRadius: "6px",
                                                        marginBottom: "6px",
                                                        border: "1px solid var(--app-border-color, rgba(0,0,0,0.08))",
                                                        fontSize: "14px"
                                                    }}
                                                >
                                                    <span style={{ marginRight: "10px", color: "var(--app-muted-text-color, #666)", fontWeight: 600 }}>{i + 1}.</span>
                                                    <span>{display}</span>
                                                </div>
                                            );
                                        });
                                    }
                                } catch (_) { /* ignore */ }
                                if (!list || list.length === 0) return null;
                                return (
                                    <div className="map-section">
                                        <h4>아이템 목록 (보상)</h4>
                                        <div
                                            style={{
                                                marginTop: "8px",
                                                padding: "12px",
                                                background: "var(--app-bg-tertiary, #f8f9fa)",
                                                borderRadius: "8px",
                                                border: "1px solid var(--app-border-color, rgba(0,0,0,0.1))"
                                            }}
                                        >
                                            {list}
                                        </div>
                                    </div>
                                );
                            })()}
                            {["contents", "contents_kr", "category"].some((k) => selectedQuest[k]) && (
                                <div className="map-section">
                                    <h4>기타</h4>
                                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                                        {["contents", "contents_kr", "category"].map((k) => {
                                            const isContent = k === "contents" || k === "contents_kr";
                                            const val = selectedQuest[k] ?? selectedQuest[k?.replace(/_/g, "")];
                                            return (
                                                <div key={k} className="map-info-item">
                                                    <div className="map-info-label">{detailLabelMap[k] ?? k}</div>
                                                    {isContent ? (val ? renderQuestContent(val) : <div className="map-info-value">-</div>) : (
                                                        <div className="map-info-value" style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                                                            {renderDetailValue(k, val)}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
}
