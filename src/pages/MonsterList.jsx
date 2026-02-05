import { useEffect, useRef, useState } from "react";
import { useWorld } from "../contexts/WorldContext";
import {
    fetchChronostoryMonsters,
    fetchChronostoryMobDetail,
    fetchChronostoryItemDetail,
    fetchMaplelandMonsters,
    fetchMaplelandMobDetail,
    fetchMaplelandItemDetail,
    getMonsterImageUrl,
    getItemImageUrl
} from "../api/mapleApi";

/**
 * 몬스터 전용 페이지: 검색 + 목록 + 상세(능력치·드롭 아이템)
 */
export default function MonsterList() {
    const { world } = useWorld();
    const isChronoStoryWorld = world === "크로노스토리";
    const isMapleLandWorld = world === "메이플랜드";
    const isSupportedWorld = isChronoStoryWorld || isMapleLandWorld;

    const [keywordInput, setKeywordInput] = useState("");
    const [keyword, setKeyword] = useState("");
    const [monsterResults, setMonsterResults] = useState([]);
    const [listLoading, setListLoading] = useState(false);
    const [listError, setListError] = useState(null);

    const [selectedRow, setSelectedRow] = useState(null);
    const [selectedRowIndex, setSelectedRowIndex] = useState(null);
    const [mobDetail, setMobDetail] = useState(null);
    const [mobDetailLoading, setMobDetailLoading] = useState(false);
    const [mobDetailError, setMobDetailError] = useState(null);

    const [itemDetail, setItemDetail] = useState(null);
    const [itemDetailLoading, setItemDetailLoading] = useState(false);
    const [itemDetailError, setItemDetailError] = useState(null);
    const [itemDetailOpen, setItemDetailOpen] = useState(false);

    const listRequestIdRef = useRef(0);

    function getFirstValue(row, keys) {
        if (!row || !Array.isArray(keys)) return undefined;
        for (const key of keys) {
            if (!key) continue;
            const value = row[key];
            if (value !== undefined && value !== null && String(value).trim() !== "") return value;
        }
        return undefined;
    }

    function getMapNameFromRow(mapRow) {
        if (!mapRow) return "(이름 없음)";
        const nameCandidate =
            mapRow.name ?? mapRow.map_name ?? mapRow.mapName ?? mapRow.mapname ??
            mapRow.map_name_kr ?? mapRow.mapNameKr ?? mapRow.mapnamekr ?? null;
        if (nameCandidate != null) {
            const s = String(nameCandidate).trim();
            if (s) return s;
        }
        return "(이름 없음)";
    }

    function getTownAndMapFromRow(mapRow) {
        if (!mapRow) return { town: null, map: "(이름 없음)" };
        const townRaw = mapRow.town_name_kr ?? mapRow.townNameKr ?? mapRow.townnamekr ?? null;
        const town = townRaw && String(townRaw).trim() !== "" ? String(townRaw).trim() : null;
        return { town, map: getMapNameFromRow(mapRow) };
    }

    function getMonsterDisplay(monsterRow) {
        const nameKrRaw = getFirstValue(monsterRow, ["monster_name_kr", "monsterNameKr", "name_kr", "mob_name_kr", "nameKr", "name"]);
        const nameEnRaw = getFirstValue(monsterRow, ["monster_name_en", "mob_name_en", "nameEn"]);
        const levelRaw = getFirstValue(monsterRow, ["monster_level", "monsterLevel", "level"]);
        const xpRaw = getFirstValue(monsterRow, ["base_xp", "baseXp", "xp", "exp", "experience"]);
        const hpRaw = getFirstValue(monsterRow, ["hp"]);
        const physicalDefenseRaw = getFirstValue(monsterRow, ["physical_defense"]);
        const magicDefenseRaw = getFirstValue(monsterRow, ["magic_defense"]);
        const nameKr = nameKrRaw ? String(nameKrRaw).trim() : "(이름 없음)";
        const nameEn = nameEnRaw ? String(nameEnRaw).trim() : "(이름 없음)";
        const level = Number.isFinite(Number(levelRaw)) ? Number(levelRaw) : null;
        const xp = Number.isFinite(Number(xpRaw)) ? Number(xpRaw) : null;
        const hp = hpRaw ? Number(hpRaw) : 0;
        const physicalDefense = physicalDefenseRaw ? Number(physicalDefenseRaw) : 0;
        const magicDefense = magicDefenseRaw ? Number(magicDefenseRaw) : 0;
        return { nameKr, nameEn, level, xp, hp, physicalDefense, magicDefense };
    }

    function getMonsterRowKey(monsterRow, index) {
        if (!monsterRow) return `monster-${index}`;
        const candidate =
            monsterRow.id ?? monsterRow.monster_id ?? monsterRow.monsterId ?? monsterRow.mob_id ?? monsterRow.mobId ??
            getFirstValue(monsterRow, ["monster_name_kr", "monsterNameKr", "name_kr", "mob_name_kr", "nameKr", "name"]) ?? null;
        if (candidate == null) return `monster-${index}`;
        const s = String(candidate).trim();
        return s || `monster-${index}`;
    }

    function formatNumber(value) {
        if (typeof value !== "number" || !Number.isFinite(value)) return "-";
        return value.toLocaleString();
    }

    function getKoreanLabelForMonsterDetailKey(key) {
        if (!key) return "";
        const labelMap = {
            town_name_kr: "타운(한글)", town_name_en: "타운(영문)",
            map_name_kr: "맵(한글)", map_name_en: "맵(영문)",
            monster_name_en: "몬스터(영문)", eva: "회피율", acc: "명중률"
        };
        return labelMap[key] ?? key;
    }

    function buildMonsterDetailEntries(monsterRow) {
        if (!monsterRow) return [];
        const display = getMonsterDisplay(monsterRow);
        const fixed = [
            { label: "몬스터(한글)", value: display.nameKr },
            { label: "몬스터(영문)", value: display.nameEn },
            { label: "레벨", value: formatNumber(display.level) },
            { label: "경험치", value: formatNumber(display.xp) },
            { label: "체력", value: formatNumber(display.hp) },
            { label: "물리 방어력", value: formatNumber(display.physicalDefense) },
            { label: "마법 방어력", value: formatNumber(display.magicDefense) }
        ];
        const excludedDetailKeys = new Set([
            "source_csv_url", "source_pubhtml_url", "fetched_at", "sheet_gid", "id", "mob_id", "mobId", "world",
            "detail_mob_id", "mob_name_en", "description_kr", "description_en", "create_dt", "update_dt",
            "hp", "physical_defense", "magic_defense", "physical_attack", "magic_attack", "moveSpeed",
            "base_xp", "baseXp", "xp", "exp", "experience", "monster_level", "monsterLevel", "level",
            "monster_name_kr", "monsterNameKr", "name_kr", "mob_name_kr", "nameKr", "name",
            "monster_name_en", "monsterNameEn", "nameEn"
        ]);
        const extras = [];
        for (const [key, raw] of Object.entries(monsterRow)) {
            if (excludedDetailKeys.has(key)) continue;
            if (typeof raw === "object" || raw === null || raw === undefined) continue;
            const value = String(raw).trim();
            if (!value) continue;
            extras.push({ label: getKoreanLabelForMonsterDetailKey(key), value });
            if (extras.length >= 10) break;
        }
        return [...fixed, ...extras];
    }

    function handleSearch(e) {
        e.preventDefault();
        setKeyword(keywordInput.trim());
    }

    function handleSelectMonsterRow(row, index) {
        setSelectedRow(row);
        setSelectedRowIndex(index);
        const mobId = row?.mob_id ?? row?.mobId ?? row?.id ?? null;
        setMobDetail(null);
        setMobDetailError(null);
        if (!mobId) {
            setMobDetailLoading(false);
            return;
        }
        setMobDetailLoading(true);
        const fetchMobDetail = isMapleLandWorld ? fetchMaplelandMobDetail : isChronoStoryWorld ? fetchChronostoryMobDetail : null;
        if (fetchMobDetail) {
            fetchMobDetail(mobId)
                .then(res => {
                    setMobDetail(res?.data ?? res);
                })
                .catch(err => {
                    setMobDetailError(err?.message || "몬스터 상세 조회 실패");
                    setMobDetail(null);
                })
                .finally(() => setMobDetailLoading(false));
        } else {
            setMobDetailLoading(false);
        }
    }

    function handleClickDropItem(itemId) {
        if (!itemId) return;
        const safeItemId = String(itemId).trim();
        if (!safeItemId) return;
        setItemDetailOpen(true);
        setItemDetailLoading(true);
        setItemDetailError(null);
        setItemDetail(null);
        const fetchItemDetail = isChronoStoryWorld ? fetchChronostoryItemDetail : isMapleLandWorld ? fetchMaplelandItemDetail : null;
        if (!fetchItemDetail) {
            setItemDetailError("지원되지 않는 월드입니다.");
            setItemDetailLoading(false);
            return;
        }
        fetchItemDetail(safeItemId)
            .then(res => {
                const payload = res?.data ?? res;
                setItemDetail(payload?.itemDetail ?? payload);
                setItemDetailError(null);
            })
            .catch(err => {
                setItemDetailError(err?.message || "아이템 상세 조회 실패");
                setItemDetail(null);
            })
            .finally(() => setItemDetailLoading(false));
    }

    function handleCloseItemDetail() {
        setItemDetailOpen(false);
        setItemDetail(null);
        setItemDetailError(null);
    }

    const getItemDetailLabel = (key) => {
        const labelMap = {
            item_id: "아이템 ID", world: "월드", item_name_en: "아이템명(영문)", item_name_kr: "아이템명(한글)",
            sale_price: "판매가", max_stack_count: "최대 스택 수", type: "타입", sub_type: "서브 타입"
        };
        return labelMap[key] ?? key;
    };

    useEffect(() => {
        if (!isSupportedWorld) {
            setMonsterResults([]);
            setListLoading(false);
            return;
        }
        listRequestIdRef.current += 1;
        const currentId = listRequestIdRef.current;
        let cancelled = false;
        setListLoading(true);
        setListError(null);
        const fetchMonsters = isMapleLandWorld ? fetchMaplelandMonsters : fetchChronostoryMonsters;
        fetchMonsters({ page: 0, size: 200, keyword: keyword && keyword.trim() ? keyword.trim() : undefined })
            .then(res => {
                if (cancelled || currentId !== listRequestIdRef.current) return;
                const list = res?.data?.items ?? res?.items ?? [];
                setMonsterResults(Array.isArray(list) ? list : []);
            })
            .catch(err => {
                if (cancelled || currentId !== listRequestIdRef.current) return;
                setListError(err?.message || "몬스터 검색 실패");
                setMonsterResults([]);
            })
            .finally(() => {
                if (!cancelled && currentId === listRequestIdRef.current) setListLoading(false);
            });
        return () => { cancelled = true; };
    }, [isSupportedWorld, world, keyword, isMapleLandWorld]);

    if (!isSupportedWorld) {
        return (
            <div className="map-page">
                <div className="map-header">
                    <h2>몬스터</h2>
                    <p className="map-subtitle">상단에서 월드를 <b>메이플랜드</b> 또는 <b>크로노스토리</b>로 선택해주세요.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="map-page">
            <div className="map-header">
                <h2>몬스터</h2>
                <p className="map-subtitle">몬스터 이름으로 검색한 뒤 목록에서 선택하면 상세(능력치·드롭)를 볼 수 있습니다.</p>
                <p className="map-subtitle">선택된 월드: <b>{world}</b></p>
            </div>

            <div className="map-grid monster-list-grid">
                <section className="map-card map-list-card">
                    <div className="map-card-header">
                        <h3>몬스터 검색</h3>
                        <span className="map-badge">{monsterResults.length}개</span>
                    </div>
                    <form className="map-search" onSubmit={handleSearch}>
                        <input
                            className="map-search-input"
                            value={keywordInput}
                            onChange={(e) => setKeywordInput(e.target.value)}
                            placeholder="몬스터 한글명 검색 (예: 리게이터)"
                            style={{ borderRight: "1px solid var(--app-border)" }}
                        />
                        <button className="btn btn-primary" type="submit" disabled={listLoading}>검색</button>
                    </form>
                    {listLoading && <div className="map-empty">로딩 중...</div>}
                    {listError && <div className="map-error">{listError}</div>}
                    {!listLoading && !listError && keyword !== "" && monsterResults.length === 0 && (
                        <div className="map-empty">조회 결과가 없습니다.</div>
                    )}
                    {!listLoading && !listError && monsterResults.length > 0 && (
                        <div className="map-list">
                            {monsterResults.map((row, index) => {
                                const display = getMonsterDisplay(row);
                                const { town, map: mapName } = getTownAndMapFromRow(row);
                                const rowKey = getMonsterRowKey(row, index);
                                const isSelected = selectedRow && getMonsterRowKey(selectedRow, selectedRowIndex) === rowKey;
                                return (
                                    <button
                                        key={row?.id ?? rowKey}
                                        type="button"
                                        className={`map-list-item ${isSelected ? "selected" : ""}`}
                                        onClick={() => handleSelectMonsterRow(row, index)}
                                    >
                                        <div className="map-list-name">
                                            <div style={{ fontWeight: 800, lineHeight: 1.2 }}>
                                                {display.nameKr} (Lv.{display.level ?? "-"} / XP {display.xp ?? "-"})
                                            </div>
                                            {town != null && (
                                                <div style={{ fontSize: "12px", color: "var(--app-muted-text-color)", marginTop: "2px" }}>{town}</div>
                                            )}
                                            <div style={{ fontSize: "12px", color: "var(--app-muted-text-color)", marginTop: "2px" }}>{mapName}</div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                    {!listLoading && keyword === "" && monsterResults.length === 0 && (
                        <div className="map-empty">몬스터 목록을 불러오는 중이거나 데이터가 없습니다. 검색어를 입력하면 필터할 수 있습니다.</div>
                    )}
                </section>

                <section className="map-card map-detail-card map-monster-detail-card">
                    <div className="map-card-header">
                        <h3>몬스터 상세</h3>
                        <span className="map-badge">{selectedRow ? "선택됨" : "미선택"}</span>
                    </div>
                    <div className="map-card-body">
                        {!selectedRow && (
                            <div className="map-empty">왼쪽에서 몬스터를 선택해주세요.</div>
                        )}
                        {selectedRow && mobDetailLoading && (
                            <div className="map-empty">몬스터 상세 로딩 중...</div>
                        )}
                        {selectedRow && mobDetailError && (
                            <div className="map-error">{mobDetailError}</div>
                        )}
                        {selectedRow && !mobDetailLoading && !mobDetailError && mobDetail && (
                            <div className="map-kv">
                                <div style={{
                                    display: "grid",
                                    gridTemplateColumns: "minmax(0, 1fr) minmax(280px, 1fr)",
                                    gap: "24px",
                                    alignItems: "start"
                                }}>
                                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                                        {mobDetail.mob && (
                                            <>
                                                {(() => {
                                                    const mobId = mobDetail.mob?.mob_id ?? mobDetail.mob?.mobId ?? null;
                                                    const imgUrl = getMonsterImageUrl(mobId);
                                                    return imgUrl ? (
                                                        <div style={{ flexShrink: 0, width: "160px", height: "160px", borderRadius: "8px", overflow: "hidden", border: "1px solid var(--app-border)", background: "var(--app-surface)" }}>
                                                            <img src={imgUrl} alt={mobDetail.mob?.monster_name_kr ?? mobDetail.mob?.monsterNameKr ?? "몬스터"} style={{ height: "100%", width: "auto", maxWidth: "100%", objectFit: "contain", display: "block" }} onError={(e) => { if (e.target?.parentElement) e.target.parentElement.style.display = "none"; }} />
                                                        </div>
                                                    ) : null;
                                                })()}
                                                <div className="map-kv-label" style={{ fontWeight: "bold", marginBottom: "4px" }}>몬스터 능력치</div>
                                                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 160px))", gap: "8px" }}>
                                                    {buildMonsterDetailEntries(mobDetail.mob).map((entry, idx) => (
                                                        <div
                                                            key={`mob-${entry.label}-${idx}`}
                                                            style={{ padding: "10px", border: "1px solid var(--app-border)", borderRadius: "8px", background: "var(--app-surface)", boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)" }}
                                                        >
                                                            <div style={{ fontSize: "11px", color: "var(--app-muted-text-color)", marginBottom: "4px", fontWeight: "700" }}>{entry.label}</div>
                                                            <div style={{ fontSize: "13px", color: "var(--app-text-color)", fontWeight: "600" }}>{entry.value}</div>
                                                        </div>
                                                    ))}
                                                </div>
                                                {isChronoStoryWorld && mobDetail.spawnMaps && mobDetail.spawnMaps.length > 0 && (
                                                    <>
                                                        <div className="map-kv-label" style={{ fontWeight: "bold", marginBottom: "6px", marginTop: "8px" }}>출몰 지역</div>
                                                        <ul style={{ margin: 0, paddingLeft: "20px", fontSize: "13px", color: "var(--app-text-color)", lineHeight: 1.6 }}>
                                                            {mobDetail.spawnMaps.map((loc, idx) => {
                                                                const townKr = loc?.town_name_kr ?? loc?.townNameKr ?? "";
                                                                const mapKr = loc?.map_name_kr ?? loc?.mapNameKr ?? "";
                                                                const mapEn = loc?.map_name_en ?? loc?.mapNameEn ?? "";
                                                                const label = townKr && mapKr ? `${townKr} - ${mapKr}` : mapKr || mapEn || "-";
                                                                const sub = mapEn && mapKr !== mapEn ? ` (${mapEn})` : "";
                                                                return <li key={`spawn-${idx}`}>{label}{sub}</li>;
                                                            })}
                                                        </ul>
                                                    </>
                                                )}
                                            </>
                                        )}
                                    </div>
                                    <div>
                                        <div className="map-kv-label" style={{ fontWeight: "bold", marginBottom: "12px" }}>드롭 아이템</div>
                                        {isChronoStoryWorld && mobDetail.publicTableSet && mobDetail.publicTableSet.length > 0 ? (
                                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "8px" }}>
                                                {mobDetail.publicTableSet.map((drop, idx) => {
                                                    const serverItemName = drop?.ServerItemName ?? drop?.serveritemname ?? "-";
                                                    const itemId = drop?.ItemID ?? drop?.itemid ?? null;
                                                    const matchedItem = itemId && Array.isArray(mobDetail.itemList)
                                                        ? mobDetail.itemList.find(item => (item?.item_id ?? item?.itemId) != null && String(item?.item_id ?? item?.itemId) === String(itemId))
                                                        : null;
                                                    const itemNameKr = matchedItem?.item_name_kr ?? matchedItem?.itemNameKr ?? "";
                                                    const displayName = itemNameKr ? `${itemNameKr} (${serverItemName})` : serverItemName;
                                                    const isMeso = String(serverItemName).toLowerCase().includes("meso");
                                                    const qtyLabel = isMeso ? "메소" : "개수";
                                                    const chance = drop?.Chance ?? drop?.chance ?? null;
                                                    const minQty = drop?.MinQTY ?? drop?.minqty ?? null;
                                                    const maxQty = drop?.MaxQTY ?? drop?.maxqty ?? null;
                                                    const avgQty = drop?.AvgQty ?? drop?.avgqty ?? null;
                                                    const questId = drop?.QuestID ?? drop?.questid ?? null;
                                                    return (
                                                        <div
                                                            key={`drop-${idx}`}
                                                            style={{ padding: "10px", border: "1px solid var(--app-border)", borderRadius: "8px", background: "var(--app-surface)", cursor: itemId ? "pointer" : "default" }}
                                                            onClick={() => itemId && handleClickDropItem(itemId)}
                                                        >
                                                            <div style={{ fontSize: "12px", fontWeight: "700" }}>{displayName}</div>
                                                            {chance != null && <div style={{ fontSize: "11px", marginTop: "2px" }}>확률: {typeof chance === "number" ? chance.toFixed(2) : String(chance)}%</div>}
                                                            {(minQty != null || maxQty != null) && <div style={{ fontSize: "11px", marginTop: "2px" }}>{qtyLabel}: {minQty ?? "?"} ~ {maxQty ?? "?"}</div>}
                                                            {avgQty != null && <div style={{ fontSize: "11px", marginTop: "2px" }}>평균 {qtyLabel}: {typeof avgQty === "number" ? avgQty.toFixed(2) : String(avgQty)}</div>}
                                                            {questId != null && <div style={{ fontSize: "11px", color: "var(--app-muted-text-color)", marginTop: "2px" }}>퀘스트ID: {String(questId)}</div>}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        ) : !isChronoStoryWorld && mobDetail.mobDrops && mobDetail.mobDrops.length > 0 ? (
                                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "8px" }}>
                                                {mobDetail.mobDrops.map((drop, idx) => {
                                                    const itemNameKr = drop.item_name_kr ?? drop.itemNameKr ?? "";
                                                    const itemNameEn = drop.item_name_en ?? drop.itemNameEn ?? "";
                                                    const dropRate = drop.drop_rate ?? drop.dropRate ?? drop.chance ?? null;
                                                    const dropItemId = drop.item_id ?? drop.itemId ?? null;
                                                    const matchedItem = dropItemId && Array.isArray(mobDetail.itemList)
                                                        ? mobDetail.itemList.find(item => String(item?.item_id ?? item?.itemId) === String(dropItemId))
                                                        : null;
                                                    const salePrice = matchedItem?.sale_price ?? matchedItem?.salePrice ?? null;
                                                    return (
                                                        <div
                                                            key={`drop-${idx}`}
                                                            style={{ padding: "10px", border: "1px solid var(--app-border)", borderRadius: "8px", background: "var(--app-surface)", cursor: "pointer" }}
                                                            onClick={() => dropItemId && handleClickDropItem(dropItemId)}
                                                        >
                                                            <div style={{ fontSize: "12px", fontWeight: "700" }}>
                                                                {itemNameKr ? <><div style={{ fontWeight: "800" }}>{itemNameKr}</div>{itemNameEn && <div style={{ fontSize: "11px" }}>({itemNameEn})</div>}</> : (itemNameEn || "-")}
                                                            </div>
                                                            {dropRate != null && <div style={{ fontSize: "11px", marginTop: "2px" }}>드롭 확률: {typeof dropRate === "number" ? dropRate.toFixed(2) : String(dropRate)}%</div>}
                                                            {salePrice != null && <div style={{ fontSize: "11px", marginTop: "2px" }}>판매가: {typeof salePrice === "number" ? salePrice.toLocaleString() : String(salePrice)}</div>}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <div className="map-empty">드롭 정보가 없습니다.</div>
                                        )}
                                    </div>
                                </div>
                                {mobDetail.publicTableSet && mobDetail.publicTableSet.length > 0 && (
                                    <div style={{ marginTop: "20px" }}>
                                        <div className="map-kv-label" style={{ fontWeight: "bold", marginBottom: "12px" }}>드롭 테이블 (InGame)</div>
                                        <div className="map-monster-table-wrap" style={{ overflowX: "auto" }}>
                                            <table className="map-table">
                                                <thead>
                                                    <tr>
                                                        <th>DropperID</th><th>MobName</th><th>QuestID</th><th>ItemID</th><th>ServerItemName</th><th>Chance</th><th>MinQTY</th><th>MaxQTY</th><th>AvgQty</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {mobDetail.publicTableSet.map((row, idx) => (
                                                        <tr key={`public-${idx}`}>
                                                            <td>{row?.DropperID ?? row?.dropperid ?? "-"}</td>
                                                            <td>{row?.MobName ?? row?.mobname ?? "-"}</td>
                                                            <td>{row?.QuestID ?? row?.questid ?? "-"}</td>
                                                            <td>{row?.ItemID ?? row?.itemid ?? "-"}</td>
                                                            <td>{row?.ServerItemName ?? row?.serveritemname ?? "-"}</td>
                                                            <td>{(() => { const c = row?.Chance ?? row?.chance; if (c == null) return "-"; const n = Number(c); return Number.isFinite(n) ? n.toFixed(2) + "%" : String(c); })()}</td>
                                                            <td>{row?.MinQTY ?? row?.minqty ?? "-"}</td>
                                                            <td>{row?.MaxQTY ?? row?.maxqty ?? "-"}</td>
                                                            <td>{row?.AvgQty ?? row?.avgqty ?? "-"}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                        {selectedRow && !mobDetailLoading && !mobDetailError && !mobDetail && (
                            <div className="map-empty">몬스터 상세 정보가 없습니다.</div>
                        )}
                    </div>
                </section>
            </div>

            {itemDetailOpen && (
                <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10000, padding: "20px" }} onClick={handleCloseItemDetail}>
                    <div style={{ backgroundColor: "var(--app-bg)", borderRadius: "12px", padding: "24px", maxWidth: "800px", width: "100%", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 4px 20px rgba(0,0,0,0.3)", border: "1px solid var(--app-border)" }} onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                            <h3 style={{ margin: 0 }}>아이템 상세</h3>
                            <button onClick={handleCloseItemDetail} style={{ background: "transparent", border: "none", fontSize: "24px", cursor: "pointer" }}>×</button>
                        </div>
                        {itemDetailLoading && <div>로딩 중...</div>}
                        {itemDetailError && <div style={{ color: "#ef4444" }}>{itemDetailError}</div>}
                        {!itemDetailLoading && !itemDetailError && itemDetail && (
                            <>
                                {itemDetail.item_id != null && (
                                    <div style={{ marginBottom: "20px", textAlign: "center" }}>
                                        <img src={getItemImageUrl(itemDetail.item_id)} alt={itemDetail.item_name_kr || "아이템"} style={{ maxWidth: "100%" }} onError={(e) => { e.target.style.display = "none"; }} />
                                    </div>
                                )}
                                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "8px" }}>
                                    {Object.entries(itemDetail).map(([key, value]) => {
                                        if (value === null || value === undefined) return null;
                                        if (["class_beginner", "class_warrior", "class_magician", "class_bowman", "class_thief", "class_pirate", "item_file_path"].includes(key)) return null;
                                        const displayValue = typeof value === "number" ? value.toLocaleString() : typeof value === "boolean" ? (value ? "예" : "아니오") : (value || "-");
                                        return (
                                            <div key={key} style={{ padding: "10px", border: "1px solid var(--app-border)", borderRadius: "8px", background: "var(--app-surface)" }}>
                                                <div style={{ fontSize: "11px", color: "var(--app-muted-text-color)", marginBottom: "4px" }}>{getItemDetailLabel(key)}</div>
                                                <div style={{ fontSize: "13px" }}>{String(displayValue)}</div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </>
                        )}
                        {!itemDetailLoading && !itemDetailError && !itemDetail && <div>아이템 상세 정보가 없습니다.</div>}
                    </div>
                </div>
            )}
        </div>
    );
}
