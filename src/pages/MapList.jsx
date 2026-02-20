import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useWorld } from "../contexts/WorldContext";
import { WORLD_SUGGESTIONS } from "../constants/worldOptions";
import {
    fetchChronostoryMapBundle,
    fetchChronostoryMaps,
    fetchChronostoryMobDetail,
    fetchChronostoryNpcDetail,
    fetchChronostoryNpcs,
    fetchChronostoryItemDetail,
    getMonsterImageUrl,
    getMapImageUrl,
    getNpcImageUrl,
    getItemImageUrl,
    fetchMaplelandMapBundle,
    fetchMaplelandMaps,
    fetchMaplelandMobDetail,
    fetchMaplelandNpcDetail,
    fetchMaplelandNpcs,
    fetchMaplelandItemDetail
} from "../api/mapleApi";

/**
 * 맵 페이지(맵 선택 시 몬스터/NPC 함께 표시)
 * - 입력: 없음
 * - 출력: JSX(Element)
 */
export default function MapList() {
    const [searchParams] = useSearchParams();
    const { world, setWorld } = useWorld();

    // 조건문: 지원 월드(게임) 여부 판별
    const isChronoStoryWorld = world === "크로노스토리";
    const isMapleLandWorld = world === "메이플랜드";
    const isSupportedWorld = isChronoStoryWorld || isMapleLandWorld;

    /** URL의 world 쿼리와 동기화: 크로노스토리/메이플랜드 섹션에서 진입 시 선택 월드 반영 */
    useEffect(() => {
        const worldParam = searchParams.get("world");
        if (worldParam && Array.isArray(WORLD_SUGGESTIONS) && WORLD_SUGGESTIONS.includes(worldParam)) {
            setWorld(worldParam);
        }
    }, [searchParams, setWorld]);

    // 검색 입력(타이핑 중)
    const [keywordInput, setKeywordInput] = useState("");
    // 확정된 검색 키워드(조회에 사용)
    const [keyword, setKeyword] = useState("");

    // 검색 타입: town(타운/맵 목록), npc(NPC) — 몬스터는 /monsters 페이지에서 검색
    const [searchType, setSearchType] = useState("town");

    // 맵 목록(타운 검색 결과)
    const [maps, setMaps] = useState([]);
    // NPC 검색 결과
    const [npcResults, setNpcResults] = useState([]);
    const [listLoading, setListLoading] = useState(false);
    const [listError, setListError] = useState(null);

    // 선택된 맵 키(맵 id 또는 map_name_en 등)
    const [selectedMapKey, setSelectedMapKey] = useState(null);

    // 선택된 맵 상세(맵 + 몬스터 + NPC)
    const [bundle, setBundle] = useState(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [detailError, setDetailError] = useState(null);

    // 상세 영역에서 선택된 몬스터(클릭 시 우측 박스에 표시)
    const [selectedMonsterKey, setSelectedMonsterKey] = useState(null);
    const [selectedMonsterRow, setSelectedMonsterRow] = useState(null);

    // 상세 영역에서 선택된 NPC(클릭 시 우측 박스에 표시)
    const [selectedNpcKey, setSelectedNpcKey] = useState(null);
    const [selectedNpcRow, setSelectedNpcRow] = useState(null);
    
    // 몬스터 상세 정보 (클릭 시 API로 조회)
    const [mobDetail, setMobDetail] = useState(null);
    const [mobDetailLoading, setMobDetailLoading] = useState(false);
    const [mobDetailError, setMobDetailError] = useState(null);

    // NPC 상세 정보 (클릭 시 API로 조회)
    const [npcDetail, setNpcDetail] = useState(null);
    const [npcDetailLoading, setNpcDetailLoading] = useState(false);
    const [npcDetailError, setNpcDetailError] = useState(null);

    // 아이템 상세 정보 (드롭 아이템 클릭 시 팝업으로 표시)
    const [itemDetail, setItemDetail] = useState(null);
    const [itemDetailLoading, setItemDetailLoading] = useState(false);
    const [itemDetailError, setItemDetailError] = useState(null);
    const [itemDetailOpen, setItemDetailOpen] = useState(false);

    /** 출몰 지역에서 선택한 맵 인덱스 (클릭 시 해당 이미지만 표시, null이면 전체) */
    const [selectedSpawnIndex, setSelectedSpawnIndex] = useState(null);
    /** 맵 이미지 로드 실패한 map_id 집합 (맵 박스에서 제외) */
    const [failedMapIds, setFailedMapIds] = useState(() => new Set());
    /** 상세(맵 정보) 영역의 맵 이미지 로드 실패 여부 */
    const [detailMapImageFailed, setDetailMapImageFailed] = useState(false);
    /** 맵 목록 현재 페이지 (1-based, 페이지 형식) */
    const [mapListPage, setMapListPage] = useState(1);
    /** NPC 검색 목록 현재 페이지 (1-based) */
    const [npcListPage, setNpcListPage] = useState(1);
    const LIST_PAGE_SIZE = 10;
    /** 맵 목록 필터: 각각 전체 | 보이기 | 숨기기 */
    const [filterNpc, setFilterNpc] = useState("all");
    const [filterMonster, setFilterMonster] = useState("all");
    const [filterQuest, setFilterQuest] = useState("all");

    // 중복 요청 방지를 위한 요청 ID 추적
    const listRequestIdRef = useRef(0);
    const detailRequestIdRef = useRef(0);

    /**
     * 맵 row에서 id 후보를 찾아 문자열로 반환합니다.
     * - 입력: mapRow(object)
     * - 출력: string | null
     */
    function getMapIdFromRow(mapRow) {
        // 조건문: mapRow가 없으면 null
        if (!mapRow) return null;

        // 맵 상세 조회 시 map_id로 넘기기 위해 map_id 우선 (idx/id 아님)
        const candidate =
            mapRow.map_id ??
            mapRow.mapId ??
            mapRow.mapid ??
            mapRow.id ??
            mapRow.map_code ??
            mapRow.mapCode ??
            mapRow.mapno ??
            mapRow.map_no ??
            null;

        // 조건문: 값이 없으면 null
        if (candidate === null || candidate === undefined) return null;

        const safe = String(candidate).trim();
        return safe ? safe : null;
    }

    /**
     * 맵 row에서 표시용 이름을 추출합니다.
     * - 입력: mapRow(object)
     * - 출력: string
     */
    function getMapNameFromRow(mapRow) {
        // 조건문: mapRow가 없으면 fallback
        if (!mapRow) return "(이름 없음)";

        // 타운(마을) 이름(한글) - 목록 표시용(검색 기준과 동일한 필드)
        const townNameKr = mapRow.town_name_kr ?? mapRow.townNameKr ?? mapRow.townnamekr ?? null;

        const nameCandidate =
            mapRow.name ??
            mapRow.map_name ??
            mapRow.mapName ??
            mapRow.mapname ??
            mapRow.map_name_kr ??
            mapRow.mapNameKr ??
            mapRow.mapnamekr ??
            null;

        // 조건문: 이름 후보가 있으면 문자열로 반환
        if (nameCandidate !== null && nameCandidate !== undefined) {
            const safeName = String(nameCandidate).trim();
            if (safeName) return safeName;
        }

        // fallback: id로 표시
        return getMapIdFromRow(mapRow) || "(이름 없음)";
    }

    /**
     * 맵 row에서 타운/맵 텍스트를 분리해서 반환합니다.
     * - 입력: mapRow(object)
     * - 출력: { town: string|null, map: string }
     */
    function getTownAndMapFromRow(mapRow) {
        if (!mapRow) return { town: null, map: "(이름 없음)" };

        const townRaw = mapRow.town_name_kr ?? mapRow.townNameKr ?? mapRow.townnamekr ?? null;
        const town = townRaw && String(townRaw).trim() !== "" ? String(townRaw).trim() : null;

        const mapName = getMapNameFromRow(mapRow);
        return { town, map: mapName || "(이름 없음)" };
    }

    /**
     * 맵 목록(타운/맵) 표시용: map_name_kr(map_name_en) 형식 문자열 반환. id는 표시하지 않음.
     * - 입력: mapRow(object)
     * - 출력: string
     */
    function getMapListDisplayLabel(mapRow) {
        if (!mapRow) return "(이름 없음)";

        const mapNameKr = mapRow.map_name_kr ?? mapRow.mapNameKr ?? mapRow.mapnamekr ?? mapRow.map_name ?? mapRow.mapName ?? "";
        const mapNameEn = mapRow.map_name_en ?? mapRow.mapNameEn ?? mapRow.mapnameen ?? "";

        const kr = String(mapNameKr).trim();
        const en = String(mapNameEn).trim();

        // 조건문: 영문이 있으면 map_name_kr(map_name_en), 없으면 map_name_kr만
        if (en) return `${kr || "(이름 없음)"}(${en})`;
        return kr || "(이름 없음)";
    }

    /**
     * 맵 목록(타운/맵) 표시용: 한글/영문을 분리해서 반환 (2줄 렌더링용)
     * - 입력: mapRow(object)
     * - 출력: { kr: string, en: string }
     */
    function getMapListDisplayParts(mapRow) {
        // 조건문: mapRow가 없으면 기본값 반환
        if (!mapRow) return { kr: "(이름 없음)", en: "" };

        const mapNameKr = mapRow.map_name_kr ?? mapRow.mapNameKr ?? mapRow.mapnamekr ?? mapRow.map_name ?? mapRow.mapName ?? "";
        const mapNameEn = mapRow.map_name_en ?? mapRow.mapNameEn ?? mapRow.mapnameen ?? "";

        const kr = String(mapNameKr).trim() || "(이름 없음)";
        const en = String(mapNameEn).trim();

        return { kr, en };
    }

    /**
     * 검색 폼 submit 핸들러
     * - 입력: submit 이벤트
     * - 출력: 없음(상태 업데이트)
     */
    function handleSearch(e) {
        e.preventDefault();
        setKeyword(keywordInput.trim());
    }

    /**
     * 검색 타입 변경 핸들러
     * - 입력: change 이벤트
     * - 출력: 없음(상태 업데이트)
     */
    function handleChangeSearchType(e) {
        const nextType = e.target.value;

        // 조건문: 허용된 타입만 반영 (몬스터는 사이드바에서 검색)
        if (!["town", "npc"].includes(nextType)) return;

        setSearchType(nextType);
        // 조건문: 타입 변경 시 키워드/선택/상세 초기화(UX, 몬스터 결과는 사이드바에서 유지)
        setKeywordInput("");
        setKeyword("");
        setSelectedMapKey(null);
        setBundle(null);
        setListError(null);
        setDetailError(null);
        setMaps([]);
        setNpcResults([]);
        setMapListPage(1);
        setNpcListPage(1);
    }

    /**
     * 맵 선택(클릭) 핸들러
     * - 입력: mapRow(object)
     * - 출력: 없음(상태 업데이트)
     */
    function handleSelectMap(mapRow) {
        const nextMapId = getMapIdFromRow(mapRow);

        // 조건문: id를 추출할 수 없으면 선택 불가
        if (!nextMapId) return;

        // 조건문: 다른 맵을 선택하면 기존 몬스터 상세 선택은 원상태(미선택)로 초기화
        setSelectedMonsterKey(null);
        setSelectedMonsterRow(null);
        setSelectedNpcKey(null);
        setSelectedNpcRow(null);
        setMobDetail(null);
        setNpcDetail(null);
        setSelectedMapKey(nextMapId);
    }

    /**
     * 몬스터/NPC 검색 결과 row에서 맵 key(map_name_en 또는 id)를 추출합니다.
     * - 입력: row(object)
     * - 출력: string | null
     */
    function getMapKeyFromSearchRow(row) {
        // 조건문: row가 없으면 null
        if (!row) return null;

        // 우선순위: map_name_en(가장 안정적) -> map_id/id
        const candidate =
            row.map_name_en ??
            row.mapNameEn ??
            row.mapnameen ??
            row.map_id ??
            row.mapId ??
            row.id ??
            null;

        // 조건문: 값이 없으면 null
        if (candidate === null || candidate === undefined) return null;

        const safe = String(candidate).trim();
        return safe ? safe : null;
    }

    /**
     * 몬스터 검색 결과 클릭 핸들러
     * - 맵 상세 로드 + 선택한 몬스터 상세를 우측에 표시
     * - 입력: monsterRow(object), index(number)
     * - 출력: 없음(상태 업데이트)
     */
    function handleSelectMonsterRow(monsterRow, index) {
        const nextMapKey = getMapKeyFromSearchRow(monsterRow);
        if (!nextMapKey) return;

        const monsterKey = getMonsterRowKey(monsterRow, index ?? 0);
        const mobId = monsterRow.mob_id ?? monsterRow.mobId ?? monsterRow.id ?? null;

        // NPC 선택 해제
        setSelectedNpcKey(null);
        setSelectedNpcRow(null);
        setNpcDetail(null);
        // 맵 선택 → 맵 상세(가운데) 로드
        setSelectedMapKey(nextMapKey);
        // 선택한 몬스터로 설정 → 우측 상세에 표시
        setSelectedMonsterKey(monsterKey);
        setSelectedMonsterRow(monsterRow);

        // 몬스터 상세 API 호출 (우측 패널에 표시)
        if (mobId) {
            setMobDetailLoading(true);
            setMobDetailError(null);
            setMobDetail(null);
            const fetchMobDetail = isMapleLandWorld ? fetchMaplelandMobDetail : isChronoStoryWorld ? fetchChronostoryMobDetail : null;
            if (fetchMobDetail) {
                fetchMobDetail(mobId)
                    .then(res => {
                        const payload = res?.data ?? res;
                        setMobDetail(payload);
                    })
                    .catch(err => {
                        setMobDetailError(err?.message || "몬스터 상세 정보 조회 중 오류가 발생했습니다.");
                        setMobDetail(null);
                    })
                    .finally(() => setMobDetailLoading(false));
            }
        } else {
            setMobDetail(null);
        }
    }

    /**
     * NPC 검색 결과 클릭 핸들러
     * - 맵 상세 로드 + 선택한 NPC 상세를 우측에 표시
     * - 입력: npcRow(object)
     * - 출력: 없음(상태 업데이트)
     */
    function handleSelectNpcRow(npcRow) {
        const nextKey = getMapKeyFromSearchRow(npcRow);
        if (!nextKey) return;

        const npcKey = getNpcRowKey(npcRow, 0);
        const npcId = npcRow.npc_id ?? npcRow.npcId ?? npcRow.id ?? null;

        setSelectedMonsterKey(null);
        setSelectedMonsterRow(null);
        setMobDetail(null);
        setSelectedMapKey(nextKey);
        setSelectedNpcKey(npcKey);
        setSelectedNpcRow(npcRow);

        if (npcId) {
            setNpcDetailLoading(true);
            setNpcDetailError(null);
            setNpcDetail(null);
            if (isChronoStoryWorld) {
                fetchChronostoryNpcDetail(npcId, nextKey)
                    .then((res) => {
                        const payload = res?.data ?? res;
                        setNpcDetail(payload);
                    })
                    .catch((err) => {
                        setNpcDetailError(err?.message || "NPC 상세 정보 조회 중 오류가 발생했습니다.");
                        setNpcDetail(null);
                    })
                    .finally(() => setNpcDetailLoading(false));
            } else if (isMapleLandWorld) {
                fetchMaplelandNpcDetail(npcId)
                    .then((res) => {
                        const payload = res?.data ?? res;
                        setNpcDetail(payload);
                    })
                    .catch((err) => {
                        setNpcDetailError(err?.message || "NPC 상세 정보 조회 중 오류가 발생했습니다.");
                        setNpcDetail(null);
                    })
                    .finally(() => setNpcDetailLoading(false));
            } else {
                setNpcDetailLoading(false);
            }
        } else {
            setNpcDetail(null);
        }
    }

    // 맵 목록 조회
    /* eslint-disable react-hooks/set-state-in-effect */
    useEffect(() => {
        // 조건문: 지원 월드가 아니면 목록 초기화
        if (!isSupportedWorld) {
            setMaps([]);
            setMonsterResults([]);
            setNpcResults([]);
            setSelectedMapKey(null);
            setBundle(null);
            setListError(null);
            setDetailError(null);
            // 조건문: 월드가 바뀌면 몬스터 선택도 초기화
            setSelectedMonsterKey(null);
            setSelectedMonsterRow(null);
            setSelectedNpcKey(null);
            setSelectedNpcRow(null);
            setMobDetail(null);
            setNpcDetail(null);
            return;
        }

        // 중복 요청 방지: 요청 ID 증가 및 현재 요청 ID 저장
        listRequestIdRef.current += 1;
        const currentRequestId = listRequestIdRef.current;
        let isCancelled = false;

        setListLoading(true);
        setListError(null);
        setMapListPage(1);
        setNpcListPage(1);

        // 조건문: 검색 타입에 따라 서로 다른 API 호출
        if (searchType === "town") {
            const fetchMaps = isMapleLandWorld ? fetchMaplelandMaps : fetchChronostoryMaps;
            fetchMaps({
                page: 0,
                size: 200,
                keyword: keyword || undefined
            })
                .then(res => {
                    // 조건문: 요청이 취소되었거나 더 최신 요청이 있으면 무시
                    if (isCancelled || currentRequestId !== listRequestIdRef.current) return;
                    const payload = res?.data ?? res;
                    const list = payload?.items ?? [];

                    // 조건문: 배열이 아니면 빈 배열 처리
                    if (!Array.isArray(list)) {
                        setMaps([]);
                    } else {
                        setMaps(list);
                    }
                    setMapListPage(1);
                    setNpcResults([]);
                })
                .catch(err => {
                    // 조건문: 요청이 취소되었거나 더 최신 요청이 있으면 무시
                    if (isCancelled || currentRequestId !== listRequestIdRef.current) return;
                    setListError(err?.message || "맵 조회 중 오류가 발생했습니다.");
                })
                .finally(() => {
                    // 조건문: 현재 요청이 최신 요청일 때만 로딩 상태 업데이트
                    if (!isCancelled && currentRequestId === listRequestIdRef.current) {
                        setListLoading(false);
                    }
                });
        } else {
            const fetchNpcs = isMapleLandWorld ? fetchMaplelandNpcs : fetchChronostoryNpcs;
            fetchNpcs({
                page: 0,
                size: 200,
                keyword: keyword || undefined
            })
                .then(res => {
                    // 조건문: 요청이 취소되었거나 더 최신 요청이 있으면 무시
                    if (isCancelled || currentRequestId !== listRequestIdRef.current) return;
                    const payload = res?.data ?? res;
                    const list = payload?.items ?? [];

                    // 조건문: 배열이 아니면 빈 배열 처리
                    if (!Array.isArray(list)) {
                        setNpcResults([]);
                    } else {
                        setNpcResults(list);
                    }
                    setNpcListPage(1);
                    setMaps([]);
                })
                .catch(err => {
                    // 조건문: 요청이 취소되었거나 더 최신 요청이 있으면 무시
                    if (isCancelled || currentRequestId !== listRequestIdRef.current) return;
                    setListError(err?.message || "NPC 검색 중 오류가 발생했습니다.");
                })
                .finally(() => {
                    // 조건문: 현재 요청이 최신 요청일 때만 로딩 상태 업데이트
                    if (!isCancelled && currentRequestId === listRequestIdRef.current) {
                        setListLoading(false);
                    }
                });
        }

        // cleanup: 컴포넌트 언마운트 시 또는 dependency 변경 시 이전 요청 취소
        return () => {
            isCancelled = true;
        };
    }, [isSupportedWorld, world, keyword, searchType, isMapleLandWorld]); // isMapleLandWorld도 포함 (안정성)
    /* eslint-enable react-hooks/set-state-in-effect */

    // 선택된 맵 상세 조회(맵 + 몬스터 + NPC)
    /* eslint-disable react-hooks/set-state-in-effect */
    useEffect(() => {
        // 조건문: 지원 월드가 아니거나 선택된 맵이 없으면 초기화
        if (!isSupportedWorld || !selectedMapKey) {
            setBundle(null);
            setDetailError(null);
            setDetailMapImageFailed(false);
            // 조건문: 맵이 바뀌면 몬스터 선택도 초기화
            setSelectedMonsterKey(null);
            setSelectedMonsterRow(null);
            setSelectedNpcKey(null);
            setSelectedNpcRow(null);
            setMobDetail(null);
            setNpcDetail(null);
            return;
        }

        // 중복 요청 방지: 요청 ID 증가 및 현재 요청 ID 저장
        detailRequestIdRef.current += 1;
        const currentRequestId = detailRequestIdRef.current;
        let isCancelled = false;

        setDetailLoading(true);
        setDetailError(null);

        const fetchBundle = isMapleLandWorld ? fetchMaplelandMapBundle : fetchChronostoryMapBundle;
        fetchBundle(selectedMapKey)
            .then(res => {
                // 조건문: 요청이 취소되었거나 더 최신 요청이 있으면 무시
                if (isCancelled || currentRequestId !== detailRequestIdRef.current) return;
                const payload = res?.data ?? res;
                setBundle(payload);
                setDetailMapImageFailed(false);
            })
            .catch(err => {
                // 조건문: 요청이 취소되었거나 더 최신 요청이 있으면 무시
                if (isCancelled || currentRequestId !== detailRequestIdRef.current) return;
                setDetailError(err?.message || "맵 상세 조회 중 오류가 발생했습니다.");
            })
            .finally(() => {
                // 조건문: 현재 요청이 최신 요청일 때만 로딩 상태 업데이트
                if (!isCancelled && currentRequestId === detailRequestIdRef.current) {
                    setDetailLoading(false);
                }
            });

        // cleanup: 컴포넌트 언마운트 시 또는 dependency 변경 시 이전 요청 취소
        return () => {
            isCancelled = true;
        };
    }, [isSupportedWorld, world, selectedMapKey, isMapleLandWorld]); // isMapleLandWorld도 포함 (안정성)
    /* eslint-enable react-hooks/set-state-in-effect */

    // 몬스터를 바꾸면 출몰 맵 선택·실패 맵 초기화
    useEffect(() => {
        setSelectedSpawnIndex(null);
        setFailedMapIds(new Set());
    }, [selectedMonsterRow]);

    // 맵 클릭 시 몹 목록: mob_id가 null이면 목록에 표시하지 않음
    const monsterList = useMemo(() => {
        const list = bundle?.mobSpawns ?? [];
        const arr = Array.isArray(list) ? list : [];
        return arr.filter((row) => {
            const mobId = row?.mob_id ?? row?.mobId ?? null;
            return mobId != null && String(mobId).trim() !== "";
        });
    }, [bundle]);

    const npcList = useMemo(() => {
        const list = bundle?.npcs ?? [];
        return Array.isArray(list) ? list : [];
    }, [bundle]);

    function getNpcRowKey(npcRow, index) {
        if (!npcRow) return `npc-${index}`;
        const candidate =
            npcRow.id ??
            npcRow.npc_id ??
            npcRow.npcId ??
            npcRow.detail_npc_id ??
            getFirstValue(npcRow, ["npc_name_kr", "npcNameKr", "name_kr", "nameKr", "name"]) ??
            null;
        if (candidate === null || candidate === undefined) return `npc-${index}`;
        const safe = String(candidate).trim();
        return safe ? safe : `npc-${index}`;
    }

    /**
     * 상세 영역의 몬스터 row를 고유하게 식별하는 key를 생성합니다.
     * - 입력: monsterRow(object), index(number)
     * - 출력: string
     */
    function getMonsterRowKey(monsterRow, index) {
        // 조건문: monsterRow가 없으면 index 기반 fallback
        if (!monsterRow) return `monster-${index}`;

        const candidate =
            monsterRow.id ??
            monsterRow.monster_id ??
            monsterRow.monsterId ??
            monsterRow.mob_id ??
            monsterRow.mobId ??
            getFirstValue(monsterRow, ["monster_name_kr", "monsterNameKr", "name_kr", "mob_name_kr", "nameKr", "name"]) ??
            null;

        // 조건문: 후보가 없으면 index 기반 fallback
        if (candidate === null || candidate === undefined) return `monster-${index}`;

        const safe = String(candidate).trim();
        return safe ? safe : `monster-${index}`;
    }

    /**
     * 상세 영역의 몬스터 row 클릭 핸들러
     * - 입력: monsterRow(object), index(number)
     * - 출력: 없음(상태 업데이트)
     */
    function handleClickMonsterInDetail(monsterRow, index) {
        const nextKey = getMonsterRowKey(monsterRow, index);
        setSelectedMonsterKey(nextKey);
        setSelectedMonsterRow(monsterRow);
        // NPC 선택은 해제
        setSelectedNpcKey(null);
        setSelectedNpcRow(null);
        setNpcDetail(null);
        
        // mob_id 추출
        const mobId = monsterRow.mob_id ?? monsterRow.mobId ?? monsterRow.id ?? null;
        if (mobId) {
            // 몬스터 상세 정보 조회
            setMobDetailLoading(true);
            setMobDetailError(null);
            setMobDetail(null);
            
            const fetchMobDetail = isMapleLandWorld 
                ? fetchMaplelandMobDetail 
                : isChronoStoryWorld 
                    ? fetchChronostoryMobDetail 
                    : null;
            
            if (fetchMobDetail) {
                fetchMobDetail(mobId)
                    .then(res => {
                        const payload = res?.data ?? res;
                        setMobDetail(payload);
                    })
                    .catch(err => {
                        setMobDetailError(err?.message || "몬스터 상세 정보 조회 중 오류가 발생했습니다.");
                        setMobDetail(null);
                    })
                    .finally(() => {
                        setMobDetailLoading(false);
                    });
            }
        }
    }

    function handleClickNpcInDetail(npcRow, index) {
        const nextKey = getNpcRowKey(npcRow, index);
        setSelectedNpcKey(nextKey);
        setSelectedNpcRow(npcRow);
        // 몬스터 선택은 해제
        setSelectedMonsterKey(null);
        setSelectedMonsterRow(null);
        setMobDetail(null);

        const npcId = npcRow.npc_id ?? npcRow.npcId ?? npcRow.id ?? null;
        if (!npcId) return;

        setNpcDetailLoading(true);
        setNpcDetailError(null);
        setNpcDetail(null);

        // 크로노스토리: 선택한 map_id를 함께 전달해 출현 맵 목록을 해당 맵만 조회
        if (isChronoStoryWorld) {
            fetchChronostoryNpcDetail(npcId, selectedMapKey)
                .then(res => {
                    const payload = res?.data ?? res;
                    setNpcDetail(payload);
                })
                .catch(err => {
                    setNpcDetailError(err?.message || "NPC 상세 정보 조회 중 오류가 발생했습니다.");
                    setNpcDetail(null);
                })
                .finally(() => setNpcDetailLoading(false));
        } else if (isMapleLandWorld && fetchMaplelandNpcDetail) {
            fetchMaplelandNpcDetail(npcId)
                .then(res => {
                    const payload = res?.data ?? res;
                    setNpcDetail(payload);
                })
                .catch(err => {
                    setNpcDetailError(err?.message || "NPC 상세 정보 조회 중 오류가 발생했습니다.");
                    setNpcDetail(null);
                })
                .finally(() => setNpcDetailLoading(false));
        }
    }

    /**
     * 키보드(Enter/Space)로도 몬스터 row를 선택할 수 있게 합니다.
     * - 입력: keydown 이벤트, monsterRow(object), index(number)
     * - 출력: 없음(상태 업데이트)
     */
    function handleMonsterRowKeyDown(e, monsterRow, index) {
        // 조건문: 이벤트가 없으면 무시
        if (!e) return;

        // 조건문: Enter/Space만 처리
        if (e.key !== "Enter" && e.key !== " ") return;

        e.preventDefault();
        handleClickMonsterInDetail(monsterRow, index);
    }

    /**
     * 드롭 아이템 클릭 핸들러 (팝업으로 아이템 상세 표시)
     * - 입력: itemId(string|number)
     * - 출력: 없음(상태 업데이트)
     */
    function handleClickDropItem(itemId) {
        if (!itemId) return;

        const safeItemId = String(itemId).trim();
        if (!safeItemId) return;

        // 팝업 열기 및 로딩 시작
        setItemDetailOpen(true);
        setItemDetailLoading(true);
        setItemDetailError(null);
        setItemDetail(null);

        // API 호출
        const fetchItemDetail = isChronoStoryWorld 
            ? fetchChronostoryItemDetail 
            : isMapleLandWorld 
            ? fetchMaplelandItemDetail 
            : null;

        if (!fetchItemDetail) {
            setItemDetailError("지원되지 않는 월드입니다.");
            setItemDetailLoading(false);
            return;
        }

        fetchItemDetail(safeItemId)
            .then((res) => {
                const payload = res?.data ?? res;
                console.log("아이템 상세 응답:", payload);
                // payload.itemDetail이 있으면 사용, 없으면 payload 자체가 itemDetail일 수 있음
                const itemDetailData = payload?.itemDetail ?? payload;
                setItemDetail(itemDetailData || null);
                setItemDetailError(null);
            })
            .catch((err) => {
                console.error("아이템 상세 조회 실패:", err);
                setItemDetailError(err?.message || "아이템 상세 정보 조회 중 오류가 발생했습니다.");
                setItemDetail(null);
            })
            .finally(() => {
                setItemDetailLoading(false);
            });
    }

    /**
     * 아이템 상세 팝업 닫기 핸들러
     */
    function handleCloseItemDetail() {
        setItemDetailOpen(false);
        setItemDetail(null);
        setItemDetailError(null);
    }

    /**
     * 아이템 상세 필드명을 한글로 변환
     * - 입력: key(string)
     * - 출력: string(한글 레이블)
     */
    function getItemDetailLabel(key) {
        const labelMap = {
            // 기본 정보
            item_id: "아이템 ID",
            world: "월드",
            item_type_id: "아이템 타입 ID",
            item_name_en: "아이템명(영문)",
            item_name_kr: "아이템명(한글)",
            sale_price: "판매가",
            max_stack_count: "최대 스택 수",
            untradeable: "거래 불가",
            item_description: "아이템 설명",
            type: "타입",
            sub_type: "서브 타입",
            item_file_path: "아이템 파일 경로",
            // 상세 정보
            category: "카테고리",
            req_level: "요구 레벨",
            req_str: "요구 힘",
            req_dex: "요구 민첩",
            req_int: "요구 지능",
            req_luk: "요구 운",
            req_fam: "요구 가족",
            // 직업 제한
            class_beginner: "초보자",
            class_warrior: "전사",
            class_magician: "마법사",
            class_bowman: "궁수",
            class_thief: "도적",
            class_pirate: "해적",
            // 스탯
            attack_speed: "공격 속도",
            str_stat: "힘 스탯",
            dex_stat: "민첩 스탯",
            int_stat: "지능 스탯",
            luk_stat: "운 스탯",
            watk: "물리 공격력",
            matk: "마법 공격력",
            accuracy: "명중률",
            avoidability: "회피율",
            speed: "이동 속도",
            jump: "점프력",
            hp: "HP",
            mp: "MP",
            wdef: "물리 방어력",
            mdef: "마법 방어력",
            upgrades: "업그레이드 가능 횟수",
            // 변동 범위
            var_str_min: "힘 변동 최소",
            var_str_max: "힘 변동 최대",
            var_dex_min: "민첩 변동 최소",
            var_dex_max: "민첩 변동 최대",
            var_int_min: "지능 변동 최소",
            var_int_max: "지능 변동 최대",
            var_luk_min: "운 변동 최소",
            var_luk_max: "운 변동 최대",
            var_watk_min: "물리 공격력 변동 최소",
            var_watk_max: "물리 공격력 변동 최대",
            var_matk_min: "마법 공격력 변동 최소",
            var_matk_max: "마법 공격력 변동 최대",
            var_accuracy_min: "명중률 변동 최소",
            var_accuracy_max: "명중률 변동 최대",
            var_avoidability_min: "회피율 변동 최소",
            var_avoidability_max: "회피율 변동 최대",
            var_speed_min: "이동 속도 변동 최소",
            var_speed_max: "이동 속도 변동 최대",
            var_jump_min: "점프력 변동 최소",
            var_jump_max: "점프력 변동 최대",
            var_hp_min: "HP 변동 최소",
            var_hp_max: "HP 변동 최대",
            var_mp_min: "MP 변동 최소",
            var_mp_max: "MP 변동 최대",
            var_wdef_min: "물리 방어력 변동 최소",
            var_wdef_max: "물리 방어력 변동 최대",
            var_mdef_min: "마법 방어력 변동 최소",
            var_mdef_max: "마법 방어력 변동 최대",
            // 추가 속성
            extra_attr_each: "추가 속성 각",
            extra_attack_each: "추가 공격력 각",
            extra_speed_each: "추가 이동 속도 각",
            extra_jump_each: "추가 점프력 각",
            extra_accuracy_each: "추가 명중률 각",
            extra_def_each: "추가 방어력 각",
            extra_attr_max: "추가 속성 최대",
            extra_attack_max: "추가 공격력 최대",
            extra_speed_max: "추가 이동 속도 최대",
            extra_jump_max: "추가 점프력 최대",
            extra_accuracy_max: "추가 명중률 최대",
            extra_def_max: "추가 방어력 최대"
        };
        return labelMap[key] || key;
    }

    /**
     * 몬스터 상세 패널에 표시할 key-value 목록을 생성합니다.
     * - 입력: monsterRow(object)
     * - 출력: { label: string, value: string }[]
     */
    function buildMonsterDetailEntries(monsterRow) {
        // 조건문: 데이터가 없으면 빈 배열
        if (!monsterRow) return [];

        const display = getMonsterDisplay(monsterRow);
        // console.log("display ==> ", display);

        const fixed = [
            { label: "몬스터(한글)", value: display.nameKr },
            { label: "몬스터(영문)", value: display.nameEn },
            { label: "레벨", value: formatNumber(display.level) },
            { label: "경험치", value: formatNumber(display.xp) },
            { label: "체력", value: formatNumber(display.hp) },
            { label: "물리 방어력", value: formatNumber(display.physicalDefense) },
            { label: "마법 방어력", value: formatNumber(display.magicDefense) }
        ];

        // 메타/원본 출처 컬럼은 UI에서 제외(사용자 요청: source_csv_url, source_pubhtml_url, fetched_at, sheet_gid, id, mob_id)
        const excludedDetailKeys = new Set(
            ["source_csv_url",
                "source_pubhtml_url",
                "fetched_at",
                "sheet_gid",
                "id",
                "mob_id",
                "mobId",
                "world",
                "detail_mob_id", 
                "mob_name_en",
                "description_kr", "description_en","create_dt","update_dt","hp","physical_defense","magic_defense","physical_attack","magic_attack","moveSpeed","base_xp","baseXp","xp","exp","experience",
                "monster_level", "monsterLevel", "level", "base_xp", "baseXp", "xp", "exp", "experience", "description_kr", "description_en","create_dt","update_dt"
            ]
        );

        // 루프: row의 나머지 primitive 필드를 최대 10개까지 추가(가독성)
        const extras = [];
        for (const [key, raw] of Object.entries(monsterRow)) {
            // 조건문: 메타/원본 출처 컬럼은 스킵
            if (excludedDetailKeys.has(key)) continue;

            // 조건문: 이미 노출한 값(이름/레벨/경험치 등)은 스킵 (몬스터(영문) 중복 방지: monster_name_en 포함)
            if (["monster_name_kr", "monsterNameKr", "name_kr", "mob_name_kr", "nameKr", "name", "monster_name_en", "monsterNameEn", "mob_name_en", "nameEn", "monster_level", "monsterLevel", "level", "base_xp", "baseXp", "xp", "exp", "experience", "description_kr", "description_en", "create_dt", "update_dt", "hp", "physical_defense", "magic_defense"].includes(key)) {
                continue;
            }

            // 조건문: null/undefined는 스킵
            if (raw === null || raw === undefined) continue;

            // 조건문: 객체/배열은 패널에서 제외(너무 길어짐)
            if (typeof raw === "object") continue;

            const value = String(raw).trim();
            if (!value) continue;

            // 조건문: 사람이 읽기 좋은 한글 라벨로 변환(요청된 key들은 한글 타이틀로 표시)
            const label = getKoreanLabelForMonsterDetailKey(key);
            extras.push({ label, value });

            // 조건문: 너무 길어지지 않도록 최대 10개 제한
            if (extras.length >= 10) break;
        }

        return [...fixed, ...extras];
    }

    /**
     * 몬스터 상세 패널에 노출되는 key를 한글 라벨로 변환합니다.
     * - 입력: key(string)
     * - 출력: string (변환된 라벨 또는 원본 key)
     */
    function getKoreanLabelForMonsterDetailKey(key) {
        // 조건문: key가 비어있으면 빈 문자열 반환
        if (!key) return "";

        // key -> 한글 타이틀 매핑(사용자 요청, chronostory_monster_reference 컬럼 포함)
        const labelMap = {
            town_name_kr: "타운(한글)",
            town_name_en: "타운(영문)",
            map_name_kr: "맵(한글)",
            map_name_en: "맵(영문)",
            monster_name_en: "몬스터(영문)",
            eva: "회피율",
            acc: "명중률"
        };

        return labelMap[key] ?? key;
    }

    /**
     * 객체에서 첫 번째로 존재하는(값이 있는) key의 값을 반환합니다.
     * - 입력: row(object), keys(string[])
     * - 출력: any | undefined
     */
    function getFirstValue(row, keys) {
        // 조건문: row가 없거나 keys가 배열이 아니면 undefined
        if (!row || !Array.isArray(keys)) return undefined;

        // 루프: 후보 key를 순서대로 확인
        for (const key of keys) {
            // 조건문: key가 비어있으면 스킵
            if (!key) continue;
            const value = row[key];
            if (value !== undefined && value !== null && String(value).trim() !== "") {
                return value;
            }
        }
        return undefined;
    }

    /**
     * 몬스터 row에서 표시용 정보를 추출합니다.
     * - 입력: monsterRow(object)
     * - 출력: { nameKr: string, level: number|null, xp: number|null }
     */
    function getMonsterDisplay(monsterRow) {
        // console.log("monsterRow ==> ", monsterRow);

        const nameKrRaw = getFirstValue(monsterRow, ["monster_name_kr", "monsterNameKr", "name_kr", "mob_name_kr", "nameKr", "name"]);
        const nameEnRaw = getFirstValue(monsterRow, ["monster_name_en", "mob_name_en", "nameEn"]);
        const levelRaw = getFirstValue(monsterRow, ["monster_level", "monsterLevel", "level"]);
        const xpRaw = getFirstValue(monsterRow, ["base_xp", "baseXp", "xp", "exp", "experience"]);

        const nameKr = nameKrRaw ? String(nameKrRaw).trim() : "(이름 없음)";
        const nameEn = nameEnRaw ? String(nameEnRaw).trim() : "(이름 없음)";


        
        const hpRaw = getFirstValue(monsterRow, ["hp"]);
        const physicalDefenseRaw = getFirstValue(monsterRow, ["physical_defense"]);
        const magicDefenseRaw = getFirstValue(monsterRow, ["magic_defense"]);

        const hp = hpRaw ? Number(hpRaw) : 0;
        const physicalDefense = physicalDefenseRaw ? Number(physicalDefenseRaw) : 0;
        const magicDefense = magicDefenseRaw ? Number(magicDefenseRaw) : 0;

        // 조건문: 숫자 변환 실패 시 null
        const level = Number.isFinite(Number(levelRaw)) ? Number(levelRaw) : null;
        const xp = Number.isFinite(Number(xpRaw)) ? Number(xpRaw) : null;

        // const descriptionKr = descriptionKrRaw ? String(descriptionKrRaw).trim() : null;
        // const descriptionEn = descriptionEnRaw ? String(descriptionEnRaw).trim() : null;
        

        return { nameKr, nameEn, level, xp,  hp, physicalDefense, magicDefense };
    }

    /**
     * NPC row에서 표시용 정보를 추출합니다.
     * - 입력: npcRow(object)
     * - 출력: { nameKr: string }
     */
    function getNpcDisplay(npcRow) {
        const nameKrRaw = getFirstValue(npcRow, ["npc_name_kr", "npcNameKr", "name_kr", "nameKr", "name"]);
        const nameEnRaw = getFirstValue(npcRow, ["npc_name_en", "npcNameEn", "name_en", "nameEn"]);
        const nameKr = nameKrRaw ? String(nameKrRaw).trim() : "(이름 없음)";
        const nameEn = nameEnRaw ? String(nameEnRaw).trim() : "";
        return { nameKr, nameEn };
    }

    function buildNpcDetailEntries(npcRow) {
        if (!npcRow) return [];

        const display = getNpcDisplay(npcRow);
        const fixed = [
            { label: "NPC(한글)", value: display.nameKr || "-" },
            ...(display.nameEn ? [{ label: "NPC(영문)", value: display.nameEn }] : [])
        ];

        const excluded = new Set([
            "id",
            "npc_id",
            "npcId",
            "world",
            "source_csv_url",
            "source_pubhtml_url",
            "fetched_at",
            "sheet_gid"
        ]);

        const extras = [];
        for (const [key, raw] of Object.entries(npcRow)) {
            if (excluded.has(key)) continue;
            if (raw === null || raw === undefined) continue;
            if (typeof raw === "object") continue;
            const value = String(raw).trim();
            if (!value) continue;
            // 이미 노출한 이름은 스킵
            if (["npc_name_kr", "npcNameKr", "name_kr", "nameKr", "name", "npc_name_en", "npcNameEn", "name_en", "nameEn"].includes(key)) {
                continue;
            }
            extras.push({ label: key, value });
            if (extras.length >= 8) break;
        }

        return [...fixed, ...extras];
    }

    /**
     * chronostory_map_npc 한 행을 NPC 상세와 동일한 카드용 엔트리로 변환 (한글 라벨)
     * - 입력: row (map_id, npc_id, town_name_en/kr, map_name_en/kr, npc_name_en/kr)
     * - 출력: [{ label, value }]
     */
    function buildChronostoryNpcMapEntries(row) {
        if (!row) return [];
        const get = (...keys) => {
            for (const k of keys) {
                const v = row[k];
                if (v != null && String(v).trim() !== "") return String(v).trim();
            }
            return null;
        };
        const entries = [];
        // 맵 ID, NPC ID는 화면에 표시하지 않음
        const townKr = get("town_name_kr", "townNameKr");
        if (townKr) entries.push({ label: "마을명(한글)", value: townKr });
        const townEn = get("town_name_en", "townNameEn");
        if (townEn) entries.push({ label: "마을명(영문)", value: townEn });
        const mapKr = get("map_name_kr", "mapNameKr");
        if (mapKr) entries.push({ label: "맵명(한글)", value: mapKr });
        const mapEn = get("map_name_en", "mapNameEn");
        if (mapEn) entries.push({ label: "맵명(영문)", value: mapEn });
        const npcKr = get("npc_name_kr", "npcNameKr");
        if (npcKr) entries.push({ label: "NPC(한글)", value: npcKr });
        const npcEn = get("npc_name_en", "npcNameEn");
        if (npcEn) entries.push({ label: "NPC(영문)", value: npcEn });
        return entries;
    }

    /**
     * #b ~ #k 구간을 파란색으로 렌더합니다. (#b 시작, #k까지 파란색)
     * - 입력: str(string) — 퀘스트 내용 등
     * - 출력: string 또는 JSX(파란색 span 포함)
     */
    function parseBlueSegments(str) {
        if (typeof str !== "string") return str;
        if (!str.includes("#b")) return str;
        const parts = [];
        let remaining = str;
        let key = 0;
        while (remaining.includes("#b")) {
            const idx = remaining.indexOf("#b");
            if (idx > 0) parts.push(<span key={key++}>{remaining.slice(0, idx)}</span>);
            remaining = remaining.slice(idx + 2);
            const kIdx = remaining.indexOf("#k");
            if (kIdx === -1) {
                parts.push(<span key={key++} style={{ color: "#2563eb" }}>{remaining}</span>);
                remaining = "";
            } else {
                parts.push(<span key={key++} style={{ color: "#2563eb" }}>{remaining.slice(0, kIdx)}</span>);
                remaining = remaining.slice(kIdx + 2);
            }
        }
        if (remaining) parts.push(<span key={key++}>{remaining}</span>);
        return parts;
    }

    /**
     * chronostory_quest_npc 한 행을 카드용 엔트리로 변환 (한글 라벨)
     * - 입력: row (quest_id, npc_id, quest_name, req_job, req_level, contents, requirements, rewards)
     * - 출력: [{ label, value }]
     */
    function buildChronostoryQuestNpcEntries(row) {
        if (!row) return [];
        const get = (...keys) => {
            for (const k of keys) {
                const v = row[k];
                if (v != null && String(v).trim() !== "") return String(v).trim();
            }
            return null;
        };
        const entries = [];
        // 퀘스트 ID, NPC ID는 화면에 표시하지 않음 (퀘스트명: quest_name_kr(quest_name) 형식, quest_name_en 없음)
        const questNameKr = get("quest_name_kr", "questNameKr");
        const questName = get("quest_name", "questName");
        const questNameDisplay = questNameKr
            ? (questName ? `${questNameKr}(${questName})` : questNameKr)
            : questName;
        if (questNameDisplay) entries.push({ label: "퀘스트명", value: questNameDisplay });
        const reqJob = get("req_job", "reqJob");
        if (reqJob) entries.push({ label: "요구 직업", value: reqJob });
        const reqLevel = get("req_level", "reqLevel");
        if (reqLevel) entries.push({ label: "요구 레벨", value: reqLevel });
        // 보상: 서버에서 rewardsParsed(expText=경험치, mesoText=메소, itemLines) 있으면 보기 쉽게 표시, 없으면 원본 (내용보다 먼저 표시)
        const rewardsParsed = row.rewardsParsed;
        if (rewardsParsed) {
            const parts = [];
            if (rewardsParsed.expText) parts.push(rewardsParsed.expText);
            if (rewardsParsed.mesoText) parts.push(rewardsParsed.mesoText);
            if (Array.isArray(rewardsParsed.itemLines) && rewardsParsed.itemLines.length > 0) {
                parts.push(...rewardsParsed.itemLines);
            }
            if (parts.length > 0) entries.push({ label: "보상", value: parts.join("\n") });
        } else {
            const rewards = get("rewards", "Rewards");
            if (rewards) entries.push({ label: "보상", value: rewards });
        }
        // 요구사항: 서버에서 requirementsParsed(itemLines, npcLines) 있으면 보상처럼 보기 쉽게 표시, 없으면 원본
        const requirementsParsed = row.requirementsParsed;
        if (requirementsParsed) {
            const parts = [];
            if (Array.isArray(requirementsParsed.itemLines) && requirementsParsed.itemLines.length > 0) {
                parts.push(...requirementsParsed.itemLines);
            }
            if (Array.isArray(requirementsParsed.npcLines) && requirementsParsed.npcLines.length > 0) {
                parts.push(...requirementsParsed.npcLines);
            }
            if (parts.length > 0) entries.push({ label: "요구사항", value: parts.join("\n") });
        } else {
            const requirements = get("requirements", "Requirements");
            if (requirements) entries.push({ label: "요구사항", value: requirements });
        }
        // 퀘스트 내용: 리터럴 \n 을 줄바꿈으로 치환
        const toLineBreak = (s) => (typeof s === "string" ? s.replace(/\\n/g, "\n") : s);
        const contents = get("contents", "Contents");
        if (contents) entries.push({ label: "내용", value: toLineBreak(contents) });
        const contentsKr = get("contents_kr", "contentsKr");
        if (contentsKr) entries.push({ label: "내용(한글)", value: toLineBreak(contentsKr) });
        return entries;
    }

    /**
     * 숫자를 보기 좋게 포맷합니다.
     * - 입력: value(number|null)
     * - 출력: string
     */
    function formatNumber(value) {
        // 조건문: null/NaN이면 '-' 처리
        if (typeof value !== "number" || !Number.isFinite(value)) return "-";
        return value.toLocaleString();
    }

    /** 맵 목록 필터 적용 (NPC/몬스터/퀘스트 각각 보이기·숨기기)
     * - 보이기: 해당 항목이 있는 맵만 표시 (해당 없는 맵은 리스트에서 제외)
     * - 숨기기: 해당 항목이 있는 맵을 리스트에서 제외 (해당 없는 맵만 표시) */
    const filteredMaps = useMemo(() => {
        if (!Array.isArray(maps) || maps.length === 0) return [];
        return maps.filter((row) => {
            // NPC 존재 여부: hasNpc 없으면 npcCount > 0 으로 보완 (메이플랜드 등 API 호환)
            const npcCnt = Number(row?.npcCount ?? row?.npc_count ?? 0);
            const hasNpc = Boolean(row?.hasNpc) || (Number.isFinite(npcCnt) && npcCnt >= 1);
            // 몬스터 존재 여부: hasMonsters 없으면 monsterCount > 0 으로 보완
            const monCnt = Number(row?.monsterCount ?? row?.monster_count ?? 0);
            const hasMonsters = Boolean(row?.hasMonsters) || (Number.isFinite(monCnt) && monCnt >= 1);
            // 퀘스트 개수: API 필드(questCount/quest_count)를 숫자로 변환, NaN/비정상 값은 0으로 간주
            const rawQuest = row?.questCount ?? row?.quest_count ?? 0;
            const questCount = Number(rawQuest);
            const hasQuest = Number.isFinite(questCount) && questCount >= 1;
            // 보이기 선택 시: 해당 없는 맵은 리스트에서 제외 (해당 있는 맵만 표시)
            if (filterNpc === "show" && !hasNpc) return false;
            if (filterMonster === "show" && !hasMonsters) return false;
            if (filterQuest === "show" && !hasQuest) return false;
            // 숨기기 선택 시: 해당 있는 맵은 리스트에서 제외 (해당 없는 맵만 표시)
            if (filterNpc === "hide" && hasNpc) return false;
            if (filterMonster === "hide" && hasMonsters) return false;
            if (filterQuest === "hide" && hasQuest) return false;
            return true;
        });
    }, [maps, filterNpc, filterMonster, filterQuest]);

    // 페이지네이션: 총 페이지 수 및 현재 페이지(범위 보정)
    const totalMapPages = Math.max(1, Math.ceil(filteredMaps.length / LIST_PAGE_SIZE));
    const totalNpcPages = Math.max(1, Math.ceil(npcResults.length / LIST_PAGE_SIZE));
    const mapPage = Math.min(Math.max(1, mapListPage), totalMapPages);
    const npcPage = Math.min(Math.max(1, npcListPage), totalNpcPages);
    const mapListSlice = filteredMaps.slice((mapPage - 1) * LIST_PAGE_SIZE, mapPage * LIST_PAGE_SIZE);
    const npcListSlice = npcResults.slice((npcPage - 1) * LIST_PAGE_SIZE, npcPage * LIST_PAGE_SIZE);

    return (
        <div className="map-page">
            <div className="map-header">
                <h2>맵</h2>
                <p className="map-subtitle">맵을 선택하면 해당 맵의 몬스터 / NPC 정보를 같이 보여줍니다.</p>
                {isSupportedWorld && (
                    <p className="map-subtitle" style={{ color: "var(--app-muted-text-color)", fontSize: "0.9em" }}>
                        목록 음영: <span style={{ backgroundColor: "rgba(255,0,0,0.3)", padding: "0 6px" }}>빨간색</span> = 몬스터·NPC 둘 다 있음, <span style={{ backgroundColor: "rgba(255,255,0,0.3)", padding: "0 6px" }}>노란색</span> = 몬스터만, <span style={{ backgroundColor: "rgba(0,0,255,0.3)", padding: "0 6px" }}>파란색</span> = NPC만
                    </p>
                )}
                <p className="map-subtitle">선택된 월드: <b>{world}</b></p>
            </div>

            {/* 조건문: 지원하지 않는 월드면 안내만 표시 */}
            {!isSupportedWorld && (
                <div className="map-notice">
                    현재 월드에서는 준비중입니다. 사이드바 메이플 그룹에서 월드를 <b>메이플랜드</b> 또는 <b>크로노스토리</b>로 선택해주세요.
                </div>
            )}

            {isSupportedWorld && (
                <div className="map-grid">
                    {/* 좌측: 맵 목록 */}
                    <section className="map-card map-list-card">
                        <div className="map-card-header">
                            <h3>
                                {searchType === "town" ? "맵 목록" : "NPC 검색"}
                            </h3>
                            <span className="map-badge">
                                {searchType === "town" ? `${filteredMaps.length}개` : `${npcResults.length}개`}
                                {searchType === "town" && (filterNpc !== "all" || filterMonster !== "all" || filterQuest !== "all") && ` (전체 ${maps.length}개 중)`}
                                {searchType === "town" && totalMapPages > 1 && ` (${mapPage}/${totalMapPages}페이지)`}
                                {searchType === "npc" && totalNpcPages > 1 && ` (${npcPage}/${totalNpcPages}페이지)`}
                            </span>
                        </div>

                        <form className="map-search" onSubmit={handleSearch}>
                            <select
                                className="map-search-select"
                                value={searchType}
                                onChange={handleChangeSearchType}
                            >
                                <option value="town">타운(맵)</option>
                                <option value="npc">NPC</option>
                            </select>
                            <input
                                className="map-search-input"
                                value={keywordInput}
                                onChange={(e) => setKeywordInput(e.target.value)}
                                placeholder={
                                    searchType === "town"
                                        ? "타운(마을) 이름 검색 (예: 커닝시티)"
                                            : "NPC 한글명 검색"
                                }
                            />
                            <button className="btn btn-primary" type="submit" disabled={listLoading}>
                                검색
                            </button>
                        </form>

                        {/* 맵 목록일 때만: NPC / 몬스터 / 퀘스트 필터 select 3개 (공간 활용, 잘리지 않도록) */}
                        {searchType === "town" && maps.length > 0 && (
                            <div className="map-list-filters">
                                <label style={{ fontSize: "13px", whiteSpace: "nowrap" }}>
                                    <span style={{ color: "var(--app-muted-text-color)", marginRight: "4px" }}>NPC</span>
                                    <select
                                        className="map-search-select"
                                        value={filterNpc}
                                        onChange={(e) => { setFilterNpc(e.target.value); setMapListPage(1); }}
                                    >
                                        <option value="all">전체</option>
                                        <option value="show">보이기</option>
                                        <option value="hide">숨기기</option>
                                    </select>
                                </label>
                                <label style={{ fontSize: "13px", whiteSpace: "nowrap" }}>
                                    <span style={{ color: "var(--app-muted-text-color)", marginRight: "4px" }}>몬스터</span>
                                    <select
                                        className="map-search-select"
                                        value={filterMonster}
                                        onChange={(e) => { setFilterMonster(e.target.value); setMapListPage(1); }}
                                    >
                                        <option value="all">전체</option>
                                        <option value="show">보이기</option>
                                        <option value="hide">숨기기</option>
                                    </select>
                                </label>
                                <label style={{ fontSize: "13px", whiteSpace: "nowrap" }}>
                                    <span style={{ color: "var(--app-muted-text-color)", marginRight: "4px" }}>퀘스트</span>
                                    <select
                                        className="map-search-select"
                                        value={filterQuest}
                                        onChange={(e) => { setFilterQuest(e.target.value); setMapListPage(1); }}
                                    >
                                        <option value="all">전체</option>
                                        <option value="show">보이기</option>
                                        <option value="hide">숨기기</option>
                                    </select>
                                </label>
                            </div>
                        )}

                        {listLoading && <div className="map-empty">로딩 중...</div>}
                        {listError && <div className="map-error">{listError}</div>}

                        {!listLoading && !listError && searchType === "town" && maps.length === 0 && (
                            <div className="map-empty">조회 결과가 없습니다.</div>
                        )}

                        {!listLoading && !listError && searchType === "npc" && npcResults.length === 0 && (
                            <div className="map-empty">조회 결과가 없습니다.</div>
                        )}

                        {/* 타운(맵) 검색 결과: map_name_kr(map_name_en) 형식, 몬스터/NPC 존재 여부에 따른 배경 음영 */}
                        {!listLoading && !listError && searchType === "town" && maps.length > 0 && (
                            <>
                            <div className="map-list-and-pagination">
                            <div className="map-list">
                                {/* 루프: 맵 목록 렌더 (필터 + 현재 페이지 구간) */}
                                {mapListSlice.map((row, index) => {
                                    const id = getMapIdFromRow(row) || `row-${index}`;
                                    // 입력: row(맵 데이터) -> 출력: { kr, en } (2줄 렌더링용)
                                    const displayParts = getMapListDisplayParts(row);
                                    const isSelected = id === selectedMapKey;
                                    const hasMonsters = Boolean(row?.hasMonsters);
                                    const hasNpc = Boolean(row?.hasNpc);
                                    // 맵별 NPC/몬스터/퀘스트 개수 (API: monsterCount, npcCount, questCount)
                                    const npcCount = Number(row?.npcCount ?? row?.npc_count ?? 0);
                                    const monsterCount = Number(row?.monsterCount ?? row?.monster_count ?? 0);
                                    const questCount = Number(row?.questCount ?? row?.quest_count ?? 0);
                                    // 조건문: 몬스터·NPC 둘 다 있으면 빨간 30%, 몬스터만 노란 30%, NPC만 파란 30%
                                    let itemBg = undefined;
                                    if (hasMonsters && hasNpc) itemBg = "rgba(255, 0, 0, 0.3)";
                                    else if (hasMonsters) itemBg = "rgba(255, 255, 0, 0.3)";
                                    else if (hasNpc) itemBg = "rgba(0, 0, 255, 0.3)";

                                    return (
                                        <button
                                            key={id}
                                            type="button"
                                            className={`map-list-item ${isSelected ? "selected" : ""}`}
                                            style={itemBg ? { backgroundColor: itemBg } : undefined}
                                            onClick={() => handleSelectMap(row)}
                                        >
                                            <div className="map-list-name">
                                                <div style={{ fontWeight: 800, lineHeight: 1.2 }}>{displayParts.kr}</div>
                                                {/* 조건문: 영문명이 있을 때만 두 번째 줄로 표시 */}
                                                {displayParts.en && (
                                                    <div style={{ fontSize: "12px", color: "var(--app-muted-text-color)", marginTop: "2px" }}>
                                                        ({displayParts.en})
                            </div>
                        )}
                                            </div>
                                            {/* 맵별 NPC/몬스터/퀘스트 개수 표시 — 1개 이상일 때 해당 글자만 진하게·잘 보이게 */}
                                            <div className="map-list-meta" style={{ marginTop: "6px", fontSize: "12px" }}>
                                                <span style={{
                                                    fontWeight: npcCount >= 1 ? 700 : 400,
                                                    color: npcCount >= 1 ? "var(--app-text-color)" : "var(--app-muted-text-color)"
                                                }}>NPC {npcCount}명</span>
                                                <span style={{ color: "var(--app-muted-text-color)", margin: "0 4px" }}>·</span>
                                                <span style={{
                                                    fontWeight: monsterCount >= 1 ? 700 : 400,
                                                    color: monsterCount >= 1 ? "var(--app-text-color)" : "var(--app-muted-text-color)"
                                                }}>몬스터 {monsterCount}종</span>
                                                <span style={{ color: "var(--app-muted-text-color)", margin: "0 4px" }}>·</span>
                                                <span style={{
                                                    fontWeight: questCount >= 1 ? 700 : 400,
                                                    color: questCount >= 1 ? "var(--app-text-color)" : "var(--app-muted-text-color)"
                                                }}>퀘스트 {questCount}개</span>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                            {/* 맵 목록 페이지네이션: 처음 / 이전 / 페이지 번호 / 다음 / 끝 */}
                            {totalMapPages > 1 && (
                                <div className="map-pagination" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", flexWrap: "wrap" }}>
                                    <button
                                        type="button"
                                        className="map-btn"
                                        disabled={mapPage <= 1}
                                        onClick={() => setMapListPage(1)}
                                    >
                                        처음
                                    </button>
                                    <button
                                        type="button"
                                        className="map-btn"
                                        disabled={mapPage <= 1}
                                        onClick={() => setMapListPage((p) => Math.max(1, p - 1))}
                                    >
                                        이전
                                    </button>
                                    <span style={{ fontSize: "13px", color: "var(--app-muted-text-color)" }}>
                                        {mapPage} / {totalMapPages}
                                    </span>
                                    <button
                                        type="button"
                                        className="map-btn"
                                        disabled={mapPage >= totalMapPages}
                                        onClick={() => setMapListPage((p) => Math.min(totalMapPages, p + 1))}
                                    >
                                        다음
                                    </button>
                                    <button
                                        type="button"
                                        className="map-btn"
                                        disabled={mapPage >= totalMapPages}
                                        onClick={() => setMapListPage(totalMapPages)}
                                    >
                                        끝
                                    </button>
                                </div>
                            )}
                            </div>
                            {filteredMaps.length === 0 && (
                                <div className="map-empty">해당 조건에 맞는 맵이 없습니다.</div>
                            )}
                            </>
                        )}

                        {/* NPC 검색 결과 */}
                        {!listLoading && !listError && searchType === "npc" && npcResults.length > 0 && (
                            <>
                            <div className="map-list-and-pagination">
                            <div className="map-list">
                                {/* 루프: NPC 검색 결과 렌더 (현재 페이지 구간) */}
                                {npcListSlice.map((row, index) => {
                                    const display = getNpcDisplay(row);
                                    const townKr = row?.town_name_kr ?? "-";
                                    const mapKr = row?.map_name_kr ?? "-";
                                    const mapKey = getMapKeyFromSearchRow(row) || `npc-${index}`;

                                    const isSelected = mapKey === selectedMapKey;

                                    return (
                                        <button
                                            key={row?.id ?? mapKey}
                                            type="button"
                                            className={`map-list-item ${isSelected ? "selected" : ""}`}
                                            onClick={() => handleSelectNpcRow(row)}
                                        >
                                            <div className="map-list-name">{display.nameKr}</div>
                                            <div className="map-list-meta">{townKr} - {mapKr}</div>
                                        </button>
                                    );
                                })}
                            </div>
                            {/* NPC 목록 페이지네이션: 처음 / 이전 / 페이지 번호 / 다음 / 끝 */}
                            {totalNpcPages > 1 && (
                                <div className="map-pagination" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", flexWrap: "wrap" }}>
                                    <button
                                        type="button"
                                        className="map-btn"
                                        disabled={npcPage <= 1}
                                        onClick={() => setNpcListPage(1)}
                                    >
                                        처음
                                    </button>
                                    <button
                                        type="button"
                                        className="map-btn"
                                        disabled={npcPage <= 1}
                                        onClick={() => setNpcListPage((p) => Math.max(1, p - 1))}
                                    >
                                        이전
                                    </button>
                                    <span style={{ fontSize: "13px", color: "var(--app-muted-text-color)" }}>
                                        {npcPage} / {totalNpcPages}
                                    </span>
                                    <button
                                        type="button"
                                        className="map-btn"
                                        disabled={npcPage >= totalNpcPages}
                                        onClick={() => setNpcListPage((p) => Math.min(totalNpcPages, p + 1))}
                                    >
                                        다음
                                    </button>
                                    <button
                                        type="button"
                                        className="map-btn"
                                        disabled={npcPage >= totalNpcPages}
                                        onClick={() => setNpcListPage(totalNpcPages)}
                                    >
                                        끝
                                    </button>
                                </div>
                            )}
                            </div>
                            </>
                        )}
                    </section>

                    {/* 가운데: 맵 상세(맵 + 몬스터 + NPC) */}
                    <section className="map-card map-detail-card">
                        <div className="map-card-header">
                            <h3>상세</h3>
                            <span className="map-badge">
                                몬스터 {monsterList.length} / NPC {npcList.length}
                            </span>
                        </div>

                        {!selectedMapKey && (
                            <div className="map-empty">
                                왼쪽에서 {searchType === "town" ? "맵" : "NPC"}를 선택해주세요. (몬스터 검색은 상단 메뉴 ‘몬스터’에서 이용할 수 있습니다.)
                            </div>
                        )}

                        {selectedMapKey && detailLoading && (
                            <div className="map-empty">상세 로딩 중...</div>
                        )}

                        {selectedMapKey && detailError && (
                            <div className="map-error">{detailError}</div>
                        )}

                        {selectedMapKey && !detailLoading && !detailError && bundle && (
                            <div className="map-detail">
                                <div className="map-section">
                                    <h4>맵 정보</h4>
                                    {/* 맵 이미지: minimaps/{map_id}.png, 로드 실패 시 숨김 */}
                                    {(selectedMapKey || bundle?.map?.map_id) && !detailMapImageFailed && getMapImageUrl(bundle?.map?.map_id ?? selectedMapKey) && (
                                        <div className="map-detail-image-wrap" style={{ marginBottom: "12px" }}>
                                            <img
                                                src={getMapImageUrl(bundle?.map?.map_id ?? selectedMapKey)}
                                                alt={bundle?.map?.map_name_kr || bundle?.map?.map_name_en || `맵 ${selectedMapKey}`}
                                                style={{ maxWidth: "100%", height: "auto", borderRadius: "8px", display: "block" }}
                                                onError={() => setDetailMapImageFailed(true)}
                                            />
                                        </div>
                                    )}
                                    <div className="map-info-grid">
                                        <div className="map-info-item">
                                            <div className="map-info-label">타운(한글)</div>
                                            <div className="map-info-value">{bundle?.map?.town_name_kr ?? "-"}</div>
                                        </div>
                                        <div className="map-info-item">
                                            <div className="map-info-label">맵(한글)</div>
                                            <div className="map-info-value">{bundle?.map?.map_name_kr ?? "-"}</div>
                                        </div>
                                        <div className="map-info-item">
                                            <div className="map-info-label">타운(영문)</div>
                                            <div className="map-info-value">{bundle?.map?.town_name_en ?? "-"}</div>
                                        </div>
                                        <div className="map-info-item">
                                            <div className="map-info-label">맵(영문)</div>
                                            <div className="map-info-value">{bundle?.map?.map_name_en ?? "-"}</div>
                                        </div>
                                    </div>
                                </div>

                                <div className="map-section">
                                    <h4>몬스터</h4>
                                    {monsterList.length === 0 ? (
                                        <div className="map-empty">몬스터 정보가 없습니다.</div>
                                    ) : (
                                        <>
                                            <div className="map-monster-table-wrap">
                                                <table className="map-table">
                                                    <thead>
                                                    <tr>
                                                        <th>몬스터(한글)</th>
                                                        <th style={{ width: 90 }}>레벨</th>
                                                        <th style={{ width: 120 }}>경험치</th>
                                                    </tr>
                                                    </thead>
                                                    <tbody>
                                                    {/* 루프: 몬스터 목록 렌더 */}
                                                    {monsterList.map((row, index) => {
                                                        const display = getMonsterDisplay(row);
                                                        // console.log("display ;;;: ", display);
                                                        const rowKey = getMonsterRowKey(row, index);
                                                        const isSelected = rowKey === selectedMonsterKey;

                                                        return (
                                                            <tr
                                                                key={rowKey}
                                                                className={`map-click-row ${isSelected ? "selected" : ""}`}
                                                                onClick={() => handleClickMonsterInDetail(row, index)}
                                                                onKeyDown={e => handleMonsterRowKeyDown(e, row, index)}
                                                                role="button"
                                                                tabIndex={0}
                                                            >
                                                                <td>
                                                                    {display.nameKr}
                                                                </td>
                                                                <td>{formatNumber(display.level)}</td>
                                                                <td>{formatNumber(display.xp)}</td>
                                                            </tr>
                                                        );
                                                    })}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </>
                                    )}
                                </div>

                                <div className="map-section">
                                    <h4>NPC</h4>
                                    {npcList.length === 0 ? (
                                        <div className="map-empty">NPC 정보가 없습니다.</div>
                                    ) : (
                                        <>
                                            <table className="map-table">
                                                <thead>
                                                <tr>
                                                    <th>NPC(한글)</th>
                                                    <th style={{ width: "90px" }}>퀘스트 개수</th>
                                                </tr>
                                                </thead>
                                                <tbody>
                                                {/* 루프: NPC 목록 렌더 — 퀘스트 있으면 개수·색상 표시 */}
                                                {npcList.map((row, index) => {
                                                    const display = getNpcDisplay(row);
                                                    const rowKey = getNpcRowKey(row, index);
                                                    const isSelected = rowKey === selectedNpcKey;
                                                    const questCount = row?.quest_count ?? row?.questCount ?? 0;
                                                    const hasQuests = Number(questCount) > 0;
                                                    // 조건문: 퀘스트가 있는 NPC는 주황색 음영으로 강조
                                                    // 조건문: 선택된 동안(isSelected)에는 기존 음영색과 무관하게 파란색 음영으로 표시
                                                    const rowBg = isSelected
                                                        ? "rgba(59, 130, 246, 0.22)"
                                                        : hasQuests
                                                            ? "rgba(249, 115, 22, 0.18)"
                                                            : undefined;
                                                    return (
                                                        <tr
                                                            key={rowKey}
                                                            className={`map-click-row ${isSelected ? "selected" : ""}`}
                                                            style={rowBg ? { backgroundColor: rowBg } : undefined}
                                                            onClick={() => handleClickNpcInDetail(row, index)}
                                                            role="button"
                                                            tabIndex={0}
                                                        >
                                                            <td>{display.nameKr}</td>
                                                            <td style={{ textAlign: "center", fontSize: "12px", color: hasQuests ? "var(--app-text-color)" : "var(--app-muted-text-color)" }}>
                                                                {hasQuests ? `퀘스트 ${questCount}개` : "-"}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                                </tbody>
                                            </table>
                                        </>
                                    )}
                                </div>
                            </div>
                        )}
                    </section>

                    {/* 오른쪽: 상세(몬스터/NPC) 전용 박스(요구사항: 3개 레이아웃) */}
                    <section className="map-card map-monster-detail-card">
                        <div className="map-card-header">
                            <h3>{selectedNpcRow ? "NPC 상세" : "몬스터 상세"}</h3>
                            <span className="map-badge">
                                {(selectedMonsterRow || selectedNpcRow) ? "선택됨" : "미선택"}
                            </span>
                        </div>
                        {/* 카드 본문: 내부만 스크롤되도록 래퍼로 감싸 페이지 스크롤 방지 */}
                        <div className="map-card-body">
                        {!selectedMapKey && (
                            <div className="map-empty">
                                먼저 왼쪽에서 맵(또는 몬스터)을 선택해주세요.
                            </div>
                        )}

                        {selectedMapKey && !detailLoading && !detailError && !bundle && (
                            <div className="map-empty">상세가 없습니다.</div>
                        )}

                        {selectedMapKey && (detailLoading || detailError) && (
                            <div className="map-empty">
                                {detailLoading ? "상세 로딩 중..." : detailError}
                            </div>
                        )}

                        {selectedMapKey && !detailLoading && !detailError && bundle && !selectedMonsterRow && !selectedNpcRow && (
                            <div className="map-empty">
                                가운데 ‘몬스터’ 또는 ‘NPC’ 목록에서 항목을 클릭하면 상세 정보가 표시됩니다.
                            </div>
                        )}

                        {selectedMapKey && !detailLoading && !detailError && bundle && selectedMonsterRow && !selectedNpcRow && (
                            <div className="map-kv">
                                {mobDetailLoading && (
                                    <div className="map-empty">몬스터 상세 정보 로딩 중...</div>
                                )}
                                {mobDetailError && (
                                    <div className="map-error">{mobDetailError}</div>
                                )}
                                {!mobDetailLoading && !mobDetailError && mobDetail && (
                                    <>
                                        {/* 레이아웃: 왼쪽 = 몬스터 능력치, 오른쪽 = 드롭템 (모바일에서는 1열로 쌓임) */}
                                        <div className="map-monster-detail-grid" style={{ 
                                            display: "grid", 
                                            gridTemplateColumns: "minmax(0, 1fr) minmax(280px, 1fr)", 
                                            gap: "24px", 
                                            alignItems: "start"
                                        }}>
                                            {/* 왼쪽: 선택한 몬스터 능력치 (이미지 + 스탯) */}
                                            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                                                {mobDetail.mob && (
                                                    <>
                                                        {/* 몬스터 이미지 */}
                                                        {(() => {
                                                            const mobId = mobDetail.mob?.mob_id ?? mobDetail.mob?.mobId ?? null;
                                                            const imgUrl = getMonsterImageUrl(mobId);
                                                            return imgUrl ? (
                                                                <div style={{ flexShrink: 0, width: "160px", height: "160px", borderRadius: "8px", overflow: "hidden", border: "1px solid var(--app-border)", background: "var(--app-surface)" }}>
                                                                    <img src={imgUrl} alt={mobDetail.mob?.monster_name_kr ?? mobDetail.mob?.monsterNameKr ?? "몬스터"} style={{ height: "100%", width: "auto", maxWidth: "100%", objectFit: "contain", display: "block" }} onError={(e) => { if (e.target?.parentElement) e.target.parentElement.style.display = "none"; }} />
                                                                </div>
                                                            ) : null;
                                                        })()}
                                                        {/* 능력치 카드 그리드 */}
                                                        <div className="map-kv-label" style={{ fontWeight: "bold", marginBottom: "4px" }}>몬스터 능력치</div>
                                                        <div className="map-card-body-stats-grid">
                                                            {buildMonsterDetailEntries(mobDetail.mob).map((entry, idx) => (
                                                                <div
                                                                    key={`mob-${entry.label}-${idx}`}
                                                                    style={{ padding: "10px", border: "1px solid var(--app-border)", borderRadius: "8px", background: "var(--app-surface)", boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)", transition: "all 0.2s ease" }}
                                                                    onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(59, 130, 246, 0.05)"; e.currentTarget.style.borderColor = "rgba(59, 130, 246, 0.3)"; e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 2px 4px rgba(0, 0, 0, 0.08)"; }}
                                                                    onMouseLeave={(e) => { e.currentTarget.style.background = "var(--app-surface)"; e.currentTarget.style.borderColor = "var(--app-border)"; e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 1px 2px rgba(0, 0, 0, 0.05)"; }}
                                                                >
                                                                    <div style={{ fontSize: "11px", color: "var(--app-muted-text-color)", marginBottom: "4px", fontWeight: "700" }}>{entry.label}</div>
                                                                    <div style={{ fontSize: "13px", color: "var(--app-text-color)", fontWeight: "600" }}>{entry.value}</div>
                                    </div>
                                ))}
                            </div>
                                                        {isChronoStoryWorld && mobDetail.spawnMaps && mobDetail.spawnMaps.length > 0 && (
                                                            <>
                                                                <div className="map-kv-label" style={{ fontWeight: "bold", marginBottom: "8px", marginTop: "8px" }}>출몰 지역</div>
                                                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", alignItems: "start", minWidth: 0 }}>
                                                                    <div style={{ border: "1px solid var(--app-border)", borderRadius: "8px", padding: "10px 12px", background: "var(--app-surface)", maxHeight: "320px", overflowY: "auto" }}>
                                                                        <div style={{ fontSize: "11px", color: "var(--app-muted-text-color)", marginBottom: "6px", fontWeight: 700 }}>리스트</div>
                                                                        <ul style={{ margin: 0, paddingLeft: 0, listStyle: "none", fontSize: "12px", color: "var(--app-text-color)", lineHeight: 1.6 }}>
                                                                            {mobDetail.spawnMaps.map((loc, idx) => {
                                                                                // map_file_path에 값이 있으면 클릭 가능. API에 없으면 map_id로 폴백
                                                                                const mapFilePath = loc?.map_file_path ?? loc?.mapFilePath;
                                                                                const mapFilePathProvided = loc?.map_file_path !== undefined || loc?.mapFilePath !== undefined;
                                                                                const hasMapFilePath = mapFilePath != null && String(mapFilePath).trim() !== "";
                                                                                const hasMapId = (loc?.map_id ?? loc?.mapId) != null && String(loc?.map_id ?? loc?.mapId).trim() !== "";
                                                                                const canSelect = mapFilePathProvided ? hasMapFilePath : hasMapId;
                                                                                const townKr = loc?.town_name_kr ?? loc?.townNameKr ?? "";
                                                                                const mapKr = loc?.map_name_kr ?? loc?.mapNameKr ?? "";
                                                                                const mapEn = loc?.map_name_en ?? loc?.mapNameEn ?? "";
                                                                                const label = townKr && mapKr ? `${townKr} - ${mapKr}` : mapKr || mapEn || "-";
                                                                                const sub = mapEn && mapKr !== mapEn ? ` (${mapEn})` : "";
                                                                                const isSelected = canSelect && selectedSpawnIndex === idx;
                                                                                return (
                                                                                    <li
                                                                                        key={`spawn-${idx}`}
                                                                                        role={canSelect ? "button" : undefined}
                                                                                        tabIndex={canSelect ? 0 : undefined}
                                                                                        onClick={() => canSelect && setSelectedSpawnIndex(idx)}
                                                                                        onKeyDown={canSelect ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setSelectedSpawnIndex(idx); } } : undefined}
                                                                                        style={{
                                                                                            padding: "6px 10px", marginBottom: "2px", borderRadius: "6px",
                                                                                            cursor: canSelect ? "pointer" : "default",
                                                                                            backgroundColor: isSelected ? "rgba(59, 130, 246, 0.2)" : "transparent",
                                                                                            border: isSelected ? "1px solid rgba(59, 130, 246, 0.5)" : "1px solid transparent",
                                                                                            opacity: canSelect ? 1 : 0.6
                                                                                        }}
                                                                                    >
                                                                                        {label}{sub}
                                                                                    </li>
                                                                                );
                                                                            })}
                                                                        </ul>
                                                                    </div>
                                                                    <div style={{ border: "1px solid var(--app-border)", borderRadius: "8px", padding: "10px", background: "var(--app-surface)", maxHeight: "320px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "8px", minHeight: "200px" }}>
                                                                        <div style={{ marginBottom: "4px" }}>
                                                                            <span style={{ fontSize: "11px", color: "var(--app-muted-text-color)", fontWeight: 700 }}>맵 이미지</span>
                                                                        </div>
                                                                        {(() => {
                                                                            const loc = selectedSpawnIndex != null ? mobDetail.spawnMaps[selectedSpawnIndex] : null;
                                                                            const mapId = loc?.map_id ?? loc?.mapId ?? null;
                                                                            const hasSelection = selectedSpawnIndex !== null && mapId;
                                                                            const isFailed = hasSelection && failedMapIds.has(String(mapId));
                                                                            const mapKr = loc?.map_name_kr ?? loc?.mapNameKr ?? "";
                                                                            if (hasSelection) {
                                                                                return (
                                                                                    <div style={{ textAlign: "center", padding: "8px", backgroundColor: "rgba(59, 130, 246, 0.08)", borderRadius: "8px", border: "1px solid rgba(59, 130, 246, 0.3)" }}>
                                                                                        {isFailed ? (
                                                                                            <div style={{ width: "100%", minHeight: "200px", border: "1px solid var(--app-border)", borderRadius: "6px", background: "var(--app-bg)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", color: "var(--app-muted-text-color)" }}>이미지 없음</div>
                                                                                        ) : (
                                                                                            <img
                                                                                                src={getMapImageUrl(mapId)}
                                                                                                alt={mapKr || `맵 ${mapId}`}
                                                                                                style={{ display: "block", maxWidth: "100%", height: "auto", maxHeight: "280px", objectFit: "contain", margin: "0 auto", border: "1px solid var(--app-border)", borderRadius: "6px", background: "var(--app-bg)" }}
                                                                                                onError={() => setFailedMapIds(prev => new Set(prev).add(String(mapId)))}
                                                                                            />
                                                                                        )}
                                                                                        <div style={{ fontSize: "12px", color: "var(--app-text-color)", marginTop: "8px", fontWeight: 600 }}>{mapKr || mapId || "-"}</div>
                                                                                    </div>
                                                                                );
                                                                            }
                                                                            return (
                                                                                <div style={{ fontSize: "12px", color: "var(--app-muted-text-color)", display: "flex", alignItems: "center", justifyContent: "center", minHeight: "180px", textAlign: "center" }}>
                                                                                    리스트에서 맵을 선택하면 이미지가 표시됩니다.
                                                                                </div>
                                                                            );
                                                                        })()}
                                                                    </div>
                                                                </div>
                                                            </>
                                                        )}
                                                    </>
                                                )}
                                            </div>

                                            {/* 오른쪽: 드롭 아이템 */}
                                            <div>
                                                <div className="map-kv-label" style={{ fontWeight: "bold", marginBottom: "12px" }}>드롭 아이템</div>
                                            {isChronoStoryWorld && mobDetail.publicTableSet && mobDetail.publicTableSet.length > 0 ? (
                                                <div style={{ 
                                                    display: "grid", 
                                                    gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", 
                                                    gap: "8px" 
                                                }}>
                                                    {mobDetail.publicTableSet.map((drop, idx) => {
                                                        const serverItemName = drop?.ServerItemName ?? drop?.serveritemname ?? "-";
                                                        const itemId = drop?.ItemID ?? drop?.itemid ?? null;
                                                        // itemList에서 ItemID로 매칭해 한글명 조회 → 표시: 한글(영어)
                                                        const matchedItem = itemId && Array.isArray(mobDetail.itemList)
                                                            ? mobDetail.itemList.find(item => {
                                                                const id = item?.item_id ?? item?.itemId ?? null;
                                                                return id != null && String(id) === String(itemId);
                                                            })
                                                            : null;
                                                        const itemNameKr = matchedItem?.item_name_kr ?? matchedItem?.itemNameKr ?? "";
                                                        const displayName = itemNameKr ? `${itemNameKr} (${serverItemName})` : serverItemName;
                                                        const isMeso = String(serverItemName).toLowerCase().includes("meso");
                                                        // Meso는 "메소", 그 외는 "개수" 라벨
                                                        const qtyLabel = isMeso ? "메소" : "개수";
                                                        // 서버에서 이미 비율 계산됨 (700 → 7)
                                                        const chance = drop?.Chance ?? drop?.chance ?? null;
                                                        const minQty = drop?.MinQTY ?? drop?.minqty ?? null;
                                                        const maxQty = drop?.MaxQTY ?? drop?.maxqty ?? null;
                                                        const avgQty = drop?.AvgQty ?? drop?.avgqty ?? null;
                                                        const questId = drop?.QuestID ?? drop?.questid ?? null;
                                                        return (
                                                            <div 
                                                                key={`public-drop-${idx}`} 
                                                                style={{ 
                                                                    padding: "10px", 
                                                                    border: "1px solid var(--app-border)", 
                                                                    borderRadius: "8px",
                                                                    background: "var(--app-surface)",
                                                                    boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
                                                                    transition: "all 0.2s ease",
                                                                    cursor: itemId ? "pointer" : "default"
                                                                }}
                                                                onClick={() => itemId && handleClickDropItem(itemId)}
                                                                onMouseEnter={(e) => {
                                                                    if (itemId) {
                                                                        e.currentTarget.style.background = "rgba(59, 130, 246, 0.05)";
                                                                        e.currentTarget.style.borderColor = "rgba(59, 130, 246, 0.3)";
                                                                        e.currentTarget.style.transform = "translateY(-1px)";
                                                                        e.currentTarget.style.boxShadow = "0 2px 4px rgba(0, 0, 0, 0.08)";
                                                                    }
                                                                }}
                                                                onMouseLeave={(e) => {
                                                                    e.currentTarget.style.background = "var(--app-surface)";
                                                                    e.currentTarget.style.borderColor = "var(--app-border)";
                                                                    e.currentTarget.style.transform = "translateY(0)";
                                                                    e.currentTarget.style.boxShadow = "0 1px 2px rgba(0, 0, 0, 0.05)";
                                                                }}
                                                            >
                                                                <div style={{ fontSize: "12px", color: "var(--app-text-color)", marginBottom: "4px", fontWeight: "700" }}>
                                                                    <div style={{ fontWeight: "800" }}>{displayName}</div>
                                                                </div>
                                                                {chance != null && (
                                                                    <div style={{ fontSize: "11px", color: "var(--app-text-color)", marginTop: "2px", fontWeight: "600" }}>
                                                                        확률: {typeof chance === "number" ? chance.toFixed(2) : String(chance)}%
                                                                    </div>
                                                                )}
                                                                {(minQty != null || maxQty != null) && (
                                                                    <div style={{ fontSize: "11px", color: "var(--app-text-color)", marginTop: "2px", fontWeight: "600" }}>
                                                                        {qtyLabel}: {minQty ?? "?"} ~ {maxQty ?? "?"}
                                                                    </div>
                                                                )}
                                                                {avgQty != null && (
                                                                    <div style={{ fontSize: "11px", color: "var(--app-text-color)", marginTop: "2px", fontWeight: "600" }}>
                                                                        평균 {qtyLabel}: {typeof avgQty === "number" ? avgQty.toFixed(2) : String(avgQty)}
                                                                    </div>
                                                                )}
                                                                {questId != null && (
                                                                    <div style={{ fontSize: "11px", color: "var(--app-muted-text-color)", marginTop: "2px" }}>
                                                                        퀘스트ID: {String(questId)}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            ) : !isChronoStoryWorld && mobDetail.mobDrops && mobDetail.mobDrops.length > 0 ? (
                                                <div style={{ 
                                                    display: "grid", 
                                                    gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", 
                                                    gap: "8px" 
                                                }}>
                                                    {mobDetail.mobDrops.map((drop, idx) => {
                                                        const itemNameKr = drop.item_name_kr ?? drop.itemNameKr ?? "";
                                                        const itemNameEn = drop.item_name_en ?? drop.itemNameEn ?? "";
                                                        const dropRate = drop.drop_rate ?? drop.dropRate ?? drop.chance ?? drop.probability ?? null;
                                                        
                                                        // itemList에서 item_id로 매칭되는 아이템 찾기
                                                        const dropItemId = drop.item_id ?? drop.itemId ?? null;
                                                        const matchedItem = dropItemId && Array.isArray(mobDetail.itemList)
                                                            ? mobDetail.itemList.find(item => {
                                                                const itemId = item.item_id ?? item.itemId ?? null;
                                                                return itemId !== null && String(itemId) === String(dropItemId);
                                                            })
                                                            : null;
                                                        
                                                        // 타입 매핑
                                                        const typeMap = {
                                                            "Eqp": "장비",
                                                            "use": "소비",
                                                            "Etc": "기타",
                                                            "Cash": "캐시"
                                                        };
                                                        
                                                        // 서브타입 매핑
                                                        const subTypeMap = {
                                                            "Cap": "모자",
                                                            "Weapon": "무기",
                                                            "Shoes": "신발"
                                                        };
                                                        
                                                        const itemType = matchedItem?.type ?? matchedItem?.item_type ?? null;
                                                        const itemSubType = matchedItem?.sub_type ?? matchedItem?.subType ?? null;
                                                        const salePrice = matchedItem?.sale_price ?? matchedItem?.salePrice ?? null;
                                                        
                                                        const typeLabel = itemType && typeMap[itemType] ? typeMap[itemType] : itemType;
                                                        const subTypeLabel = itemSubType && subTypeMap[itemSubType] ? subTypeMap[itemSubType] : itemSubType;
                                                        
                                                        return (
                                                            <div 
                                                                key={`drop-${idx}`} 
                                                                style={{ 
                                                                    padding: "10px", 
                                                                    border: "1px solid var(--app-border)", 
                                                                    borderRadius: "8px",
                                                                    background: "var(--app-surface)",
                                                                    boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
                                                                    transition: "all 0.2s ease",
                                                                    cursor: "pointer"
                                                                }}
                                                                onClick={() => dropItemId && handleClickDropItem(dropItemId)}
                                                                onMouseEnter={(e) => {
                                                                    e.currentTarget.style.background = "rgba(59, 130, 246, 0.05)";
                                                                    e.currentTarget.style.borderColor = "rgba(59, 130, 246, 0.3)";
                                                                    e.currentTarget.style.transform = "translateY(-1px)";
                                                                    e.currentTarget.style.boxShadow = "0 2px 4px rgba(0, 0, 0, 0.08)";
                                                                }}
                                                                onMouseLeave={(e) => {
                                                                    e.currentTarget.style.background = "var(--app-surface)";
                                                                    e.currentTarget.style.borderColor = "var(--app-border)";
                                                                    e.currentTarget.style.transform = "translateY(0)";
                                                                    e.currentTarget.style.boxShadow = "0 1px 2px rgba(0, 0, 0, 0.05)";
                                                                }}
                                                            >
                                                                <div style={{ fontSize: "12px", color: "var(--app-text-color)", marginBottom: "4px", fontWeight: "700" }}>
                                                                    {itemNameKr ? (
                                                                        <>
                                                                            <div style={{ fontWeight: "800" }}>{itemNameKr}</div>
                                                                            {itemNameEn && (
                                                                                <div style={{ fontSize: "11px", color: "var(--app-text-color)", marginTop: "2px", fontWeight: "600" }}>
                                                                                    ({itemNameEn})
                                                                                </div>
                                                                            )}
                                                                        </>
                                                                    ) : (
                                                                        <div style={{ fontWeight: "800" }}>{itemNameEn || "-"}</div>
                                                                    )}
                                                                </div>
                                                                {dropRate !== null && dropRate !== undefined && (
                                                                    <div style={{ fontSize: "11px", color: "var(--app-text-color)", marginTop: "2px", fontWeight: "600" }}>
                                                                        드롭 확률: {typeof dropRate === "number" ? dropRate.toFixed(2) : String(dropRate)}%
                                                                    </div>
                                                                )}
                                                                {salePrice !== null && salePrice !== undefined && (
                                                                    <div style={{ fontSize: "11px", color: "var(--app-text-color)", marginTop: "2px", fontWeight: "600" }}>
                                                                        판매가: {typeof salePrice === "number" ? salePrice.toLocaleString() : String(salePrice)}
                                                                    </div>
                                                                )}
                                                                {typeLabel && (
                                                                    <div style={{ fontSize: "11px", color: "var(--app-text-color)", marginTop: "2px", fontWeight: "600" }}>
                                                                        타입: {typeLabel}{subTypeLabel ? ` (${subTypeLabel})` : ""}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            ) : (
                                                <div className="map-empty">드롭 정보가 없습니다.</div>
                                            )}
                                            </div>
                                        </div>

                                        {/* 몬스터 상세 하단: chronostory_public_table_set (DropperID=mob_id, InGame=TRUE) */}
                                        {mobDetail.publicTableSet && mobDetail.publicTableSet.length > 0 && (
                                            <div style={{ marginTop: "20px" }}>
                                                <div className="map-kv-label" style={{ fontWeight: "bold", marginBottom: "12px" }}>드롭 테이블 (InGame)</div>
                                                <div className="map-monster-table-wrap" style={{ overflowX: "auto" }}>
                                                    <table className="map-table">
                                                        <thead>
                                                            <tr>
                                                                <th>DropperID</th>
                                                                <th>MobName</th>
                                                                <th>QuestID</th>
                                                                <th>ItemID</th>
                                                                <th>ServerItemName</th>
                                                                <th>Chance</th>
                                                                <th>MinQTY</th>
                                                                <th>MaxQTY</th>
                                                                <th>AvgQty</th>
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
                                                                    <td>{(() => {
                                                                        const c = row?.Chance ?? row?.chance;
                                                                        if (c == null) return "-";
                                                                        const num = Number(c);
                                                                        if (Number.isFinite(num)) return num.toFixed(2) + "%";
                                                                        return String(c);
                                                                    })()}</td>
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
                                    </>
                                )}
                                {!mobDetailLoading && !mobDetailError && !mobDetail && (
                                    <div className="map-empty">몬스터 상세 정보가 없습니다.</div>
                                )}
                            </div>
                        )}

                        {selectedMapKey && !detailLoading && !detailError && bundle && selectedNpcRow && !selectedMonsterRow && (
                            <div className="map-kv">
                                {npcDetailLoading && (
                                    <div className="map-empty">NPC 상세 정보 로딩 중...</div>
                                )}
                                {npcDetailError && (
                                    <div className="map-error">{npcDetailError}</div>
                                )}
                                {!npcDetailLoading && !npcDetailError && npcDetail && (
                                    <div style={{ minWidth: 0, maxWidth: "100%", overflow: "hidden" }}>
                                        {/* NPC 기본 정보: 왼쪽 이미지(resources/static/npcs/{npc_id}.png), 아래에 출현 맵/퀘스트 상세 */} 
                                        {(() => {
                                            // 입력: selectedNpcRow(행)에서 npcId 추출
                                            const npcId = selectedNpcRow?.npc_id ?? selectedNpcRow?.npcId ?? selectedNpcRow?.id ?? null;
                                            const imgUrl = getNpcImageUrl(npcId);
                                            // 출력: NPC 표시용 이름(한글/영문)
                                            const npcDisplay = getNpcDisplay(selectedNpcRow);
                                            const npcNameKr = npcDisplay?.nameKr ?? "NPC";
                                            const npcNameEn = npcDisplay?.nameEn ?? "";

                                            // 조건문: 이미지 URL이 없으면 렌더링하지 않음
                                            if (!imgUrl) return null;

                                            return (
                                                <div style={{ display: "flex", gap: "20px", alignItems: "flex-start", flexWrap: "wrap", marginBottom: "16px" }}>
                                                    {/* 왼쪽: NPC 이미지 */} 
                                                    <div
                                                        style={{
                                                            flexShrink: 0,
                                                            width: "160px",
                                                            height: "160px",
                                                            borderRadius: "8px",
                                                            overflow: "hidden",
                                                            border: "1px solid var(--app-border)",
                                                            background: "var(--app-surface)"
                                                        }}
                                                    >
                                                        <img
                                                            src={imgUrl}
                                                            alt={npcNameKr}
                                                            style={{ height: "100%", width: "auto", maxWidth: "100%", objectFit: "contain", display: "block" }}
                                                            // 조건문: 파일이 없으면 이미지 영역 자체를 숨김(깨진 이미지 방지)
                                                            onError={(e) => { if (e.target?.parentElement) e.target.parentElement.style.display = "none"; }}
                                                        />
                                                    </div>
                                                    {/* 오른쪽: 간단 정보 */} 
                                                    <div style={{ flex: "1", minWidth: "140px" }}>
                                                        <div className="map-kv-row" style={{ marginBottom: "8px" }}>
                                                            <div className="map-kv-label">NPC(한글)</div>
                                                            <div className="map-kv-value">{npcNameKr}</div>
                                                        </div>
                                                        <div className="map-kv-row">
                                                            <div className="map-kv-label">NPC(영문)</div>
                                                            <div className="map-kv-value">{npcNameEn || "-"}</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })()}

                                        {/* NPC 상세 박스: 출현 맵 카드 — 스크롤 없이 컨테이너 안에 맞춰 보기 좋게 */}
                                        {npcDetail.chronostoryNpcMaps && npcDetail.chronostoryNpcMaps.length > 0 ? (
                                            <div style={{ display: "flex", flexDirection: "column", gap: "16px", minWidth: 0 }}>
                                                {npcDetail.chronostoryNpcMaps.map((row, rowIdx) => {
                                                    const entries = buildChronostoryNpcMapEntries(row);
                                                    if (entries.length === 0) return null;
                                                    // 마을명(한글)·마을명(영문)·NPC(한글)·NPC(영문) 같은 열 폭으로 1줄, 맵명은 2줄
                                                    const byLabel = (l) => entries.find((e) => e.label === l);
                                                    const townKr = byLabel("마을명(한글)");
                                                    const townEn = byLabel("마을명(영문)");
                                                    const mapKr = byLabel("맵명(한글)");
                                                    const mapEn = byLabel("맵명(영문)");
                                                    const npcKr = byLabel("NPC(한글)");
                                                    const npcEn = byLabel("NPC(영문)");
                                                    const cardStyle = (extra = {}) => ({ padding: "12px 14px", border: "1px solid var(--app-border)", borderRadius: "8px", background: "var(--app-surface)", boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)", transition: "all 0.2s ease", minWidth: 0, height: "100%", boxSizing: "border-box", ...extra });
                                                    const renderCard = (entry, key) => entry ? (
                                                        <div key={key} style={cardStyle()}>
                                                            <div style={{ fontSize: "11px", color: "var(--app-muted-text-color)", marginBottom: "6px", fontWeight: "700" }}>{entry.label}</div>
                                                            <div style={{ fontSize: "13px", color: "var(--app-text-color)", fontWeight: "600", wordBreak: "break-word", overflowWrap: "break-word" }}>{entry.value}</div>
                                                        </div>
                                                    ) : <div key={key} />;
                                                    const hasRow1 = townKr || townEn || npcKr || npcEn;
                                                    const hasRow2 = mapKr || mapEn;
                                                    return (
                                                        <div key={`npc-map-${rowIdx}`} style={{ display: "flex", flexDirection: "column", gap: "12px", minWidth: 0, width: "100%" }}>
                                                            {hasRow1 && (
                                                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "12px", minWidth: 0, width: "100%", alignItems: "stretch" }}>
                                                                    {renderCard(townKr, `npc-map-${rowIdx}-town-kr`)}
                                                                    {renderCard(townEn, `npc-map-${rowIdx}-town-en`)}
                                                                    {renderCard(npcKr, `npc-map-${rowIdx}-npc-kr`)}
                                                                    {renderCard(npcEn, `npc-map-${rowIdx}-npc-en`)}
                                                                </div>
                                                            )}
                                                            {hasRow2 && (
                                                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "12px", minWidth: 0, width: "100%", alignItems: "stretch" }}>
                                                                    {renderCard(mapKr, `npc-map-${rowIdx}-map-kr`)}
                                                                    {renderCard(mapEn, `npc-map-${rowIdx}-map-en`)}
                                                                    <div />
                                                                    <div />
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <div className="map-empty">NPC 출현 맵 정보가 없습니다.</div>
                                        )}

                                        {/* 퀘스트 상세: chronostory_quest_npc — 퀘스트별 카드로 구분해 보기 좋게 */}
                                        <div style={{ marginTop: "20px" }}>
                                            <div className="map-kv-label" style={{ fontWeight: "bold", marginBottom: "12px" }}>
                                                퀘스트 상세 {npcDetail.chronostoryQuestNpc?.length > 0 ? `(${npcDetail.chronostoryQuestNpc.length}개)` : ""}
                                            </div>
                                            {npcDetail.chronostoryQuestNpc && npcDetail.chronostoryQuestNpc.length > 0 ? (
                                                <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                                                    {npcDetail.chronostoryQuestNpc.map((row, rowIdx) => {
                                                        const entries = buildChronostoryQuestNpcEntries(row);
                                                        if (entries.length === 0) return null;
                                                        const firstRowEntries = entries.filter((e) => e.label !== "내용" && e.label !== "내용(한글)");
                                                        const belowRowEntries = entries.filter((e) => e.label === "내용" || e.label === "내용(한글)");
                                                        const cardStyle = (entry) => ({
                                                            padding: "12px 14px",
                                                            border: "1px solid var(--app-border)",
                                                            borderRadius: "8px",
                                                            background: "var(--app-surface)",
                                                            boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
                                                            transition: "all 0.2s ease",
                                                            boxSizing: "border-box",
                                                            ...(entry.label === "요구 레벨" ? { maxWidth: "120px" } : {})
                                                        });
                                                        const labelStyle = { fontSize: "11px", color: "var(--app-muted-text-color)", marginBottom: "8px", fontWeight: "700" };
                                                        const valueStyle = (entry) => ({ fontSize: "13px", color: "var(--app-text-color)", fontWeight: "600", lineHeight: "1.5", whiteSpace: (typeof entry.value === "string" && entry.value.includes("\n")) ? "pre-line" : undefined });
                                                        const renderCard = (entry, extraStyle = {}) => (
                                                            <div style={{ ...cardStyle(entry), ...extraStyle }}>
                                                                <div style={labelStyle}>{entry.label}</div>
                                                                <div style={valueStyle(entry)}>
                                                                    {typeof entry.value === "string" && (entry.value.includes("#b") || entry.value.includes("#k"))
                                                                        ? parseBlueSegments(entry.value)
                                                                        : entry.value}
                                                                </div>
                                                            </div>
                                                        );
                                                        return (
                                                            <div
                                                                key={`quest-npc-${rowIdx}`}
                                                                style={{
                                                                    padding: "16px",
                                                                    border: "1px solid var(--app-border)",
                                                                    borderRadius: "12px",
                                                                    background: "rgba(59, 130, 246, 0.10)",
                                                                    display: "inline-flex",
                                                                    flexDirection: "column",
                                                                    gap: "20px",
                                                                    width: "max-content",
                                                                    maxWidth: "100%",
                                                                    minWidth: 0
                                                                }}
                                                            >
                                                                <div style={{ fontSize: "12px", fontWeight: "700", color: "var(--app-muted-text-color)", marginBottom: "4px" }}>
                                                                    퀘스트 {rowIdx + 1}
                                                                </div>
                                                                {firstRowEntries.length > 0 && (
                                                                    <div style={{ display: "flex", flexWrap: "wrap", gap: "20px", alignItems: "stretch" }}>
                                                                        {firstRowEntries.map((entry, ei) => (
                                                                            <div key={`quest-npc-${rowIdx}-top-${ei}`} style={{ flex: "0 1 auto", display: "flex" }}>
                                                                                {renderCard(entry, { height: "100%", minHeight: "100%" })}
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                                {/* 내용 박스: 1~3번째 박스(퀘스트명·요구 직업·요구 레벨) 길이까지 */}
                                                                {belowRowEntries.map((entry, ei) => (
                                                                    <div key={`quest-npc-${rowIdx}-below-${ei}`} style={{ minWidth: 0, width: "60%", maxWidth: "100%", boxSizing: "border-box" }}>
                                                                        {renderCard(entry)}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            ) : (
                                                <div className="map-empty">퀘스트 상세 정보가 없습니다.</div>
                                            )}
                                        </div>
                                    </div>
                                )}
                                {!npcDetailLoading && !npcDetailError && !npcDetail && (
                                    <div className="map-empty">NPC 상세 정보가 없습니다.</div>
                                )}
                            </div>
                        )}
                        </div>
                    </section>
                </div>
            )}

            {/* 아이템 상세 팝업 */}
            {itemDetailOpen && (
                <div
                    style={{
                        position: "fixed",
                        inset: 0,
                        backgroundColor: "rgba(0, 0, 0, 0.5)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        zIndex: 10000,
                        padding: "16px"
                    }}
                    onClick={handleCloseItemDetail}
                >
                    <div
                        style={{
                            backgroundColor: "var(--app-bg)",
                            borderRadius: "12px",
                            maxWidth: "720px",
                            width: "100%",
                            maxHeight: "88vh",
                            display: "flex",
                            flexDirection: "column",
                            overflow: "hidden",
                            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.25)",
                            border: "1px solid var(--app-border)"
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* 고정 헤더 */}
                        <div style={{
                            flexShrink: 0,
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            padding: "14px 20px",
                            borderBottom: "1px solid var(--app-border)",
                            background: "var(--app-surface)"
                        }}>
                            <h3 style={{ margin: 0, color: "var(--app-text-color)", fontSize: "18px", fontWeight: "700" }}>아이템 상세</h3>
                            <button
                                type="button"
                                onClick={handleCloseItemDetail}
                                style={{
                                    background: "transparent",
                                    border: "none",
                                    fontSize: "22px",
                                    lineHeight: 1,
                                    cursor: "pointer",
                                    color: "var(--app-muted-text-color)",
                                    padding: "4px",
                                    width: "32px",
                                    height: "32px",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    borderRadius: "6px"
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(0,0,0,0.08)"; e.currentTarget.style.color = "var(--app-text-color)"; }}
                                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--app-muted-text-color)"; }}
                            >
                                ×
                            </button>
                        </div>

                        {/* 스크롤 영역 */}
                        <div style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "20px" }}>
                            {itemDetailLoading && (
                                <div style={{ textAlign: "center", padding: "48px 24px", color: "var(--app-muted-text-color)", fontSize: "14px" }}>로딩 중...</div>
                            )}

                            {itemDetailError && (
                                <div style={{ padding: "24px", color: "#ef4444", textAlign: "center", fontSize: "14px" }}>{itemDetailError}</div>
                            )}

                            {!itemDetailLoading && !itemDetailError && itemDetail && (
                                <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 180px) 1fr", gap: "24px", alignItems: "start" }}>
                                    {/* 왼쪽: 이미지 + 카테고리 + 직업군 */}
                                    <div style={{ display: "flex", flexDirection: "column", gap: "12px", position: "sticky", top: 0 }}>
                                        {(itemDetail.item_id != null && itemDetail.item_id !== "") && (
                                            <div style={{
                                                padding: "10px",
                                                border: "1px solid var(--app-border)",
                                                borderRadius: "8px",
                                                background: "var(--app-surface)",
                                                textAlign: "center",
                                                lineHeight: 0
                                            }}>
                                                <img
                                                    src={getItemImageUrl(itemDetail.item_id)}
                                                    alt=""
                                                    style={{ display: "block", width: "100%", height: "auto", maxHeight: "140px", objectFit: "contain", margin: "0 auto" }}
                                                    onError={(e) => {
                                                        e.target.style.display = "none";
                                                        const wrap = e.target.parentElement;
                                                        if (wrap && !wrap.querySelector(".item-img-fallback")) {
                                                            const fallback = document.createElement("div");
                                                            fallback.className = "item-img-fallback";
                                                            fallback.style.cssText = "color: var(--app-muted-text-color); padding: 24px 12px; font-size: 12px;";
                                                            fallback.textContent = "이미지 없음";
                                                            wrap.appendChild(fallback);
                                                        }
                                                    }}
                                                />
                                            </div>
                                        )}
                                        {(() => {
                                            const typeMap = { eqp: "장비", use: "소비", etc: "기타", cash: "캐시", setup: "설치템", install: "설치템" };
                                            const rawType = itemDetail.type ?? itemDetail.item_type ?? itemDetail.category ?? null;
                                            const rawSub = itemDetail.sub_type ?? itemDetail.subType ?? null;
                                            const typeKey = rawType ? String(rawType).trim().toLowerCase() : "";
                                            const typeLabel = typeKey && typeMap[typeKey] ? typeMap[typeKey] : (rawType ? String(rawType) : null);
                                            const subLabel = rawSub ? String(rawSub) : null;
                                            const hasCategory = typeLabel || subLabel;
                                            if (!hasCategory) return null;
                                            return (
                                                <div style={{ padding: "10px 12px", border: "1px solid var(--app-border)", borderRadius: "8px", background: "var(--app-surface)" }}>
                                                    <div style={{ fontSize: "10px", color: "var(--app-muted-text-color)", marginBottom: "6px", fontWeight: "700", textTransform: "uppercase" }}>카테고리</div>
                                                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                                                        {typeLabel && <span style={{ padding: "3px 8px", borderRadius: "4px", background: "rgba(34, 197, 94, 0.12)", color: "var(--app-text-color)", fontSize: "11px", fontWeight: "600" }}>{typeLabel}</span>}
                                                        {subLabel && typeLabel !== subLabel && <span style={{ fontSize: "11px", color: "var(--app-muted-text-color)" }}>{subLabel}</span>}
                                                    </div>
                                                </div>
                                            );
                                        })()}
                                        {(itemDetail.class_beginner !== null || itemDetail.class_warrior !== null || itemDetail.class_magician !== null || itemDetail.class_bowman !== null || itemDetail.class_thief !== null || itemDetail.class_pirate !== null) && (
                                            <div style={{ padding: "10px 12px", border: "1px solid var(--app-border)", borderRadius: "8px", background: "var(--app-surface)" }}>
                                                <div style={{ fontSize: "10px", color: "var(--app-muted-text-color)", marginBottom: "6px", fontWeight: "700", textTransform: "uppercase" }}>직업군</div>
                                                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                                                    {itemDetail.class_beginner && <span style={{ padding: "3px 8px", borderRadius: "4px", background: "rgba(59, 130, 246, 0.12)", color: "var(--app-text-color)", fontSize: "11px", fontWeight: "600" }}>초보자</span>}
                                                    {itemDetail.class_warrior && <span style={{ padding: "3px 8px", borderRadius: "4px", background: "rgba(59, 130, 246, 0.12)", color: "var(--app-text-color)", fontSize: "11px", fontWeight: "600" }}>전사</span>}
                                                    {itemDetail.class_magician && <span style={{ padding: "3px 8px", borderRadius: "4px", background: "rgba(59, 130, 246, 0.12)", color: "var(--app-text-color)", fontSize: "11px", fontWeight: "600" }}>마법사</span>}
                                                    {itemDetail.class_bowman && <span style={{ padding: "3px 8px", borderRadius: "4px", background: "rgba(59, 130, 246, 0.12)", color: "var(--app-text-color)", fontSize: "11px", fontWeight: "600" }}>궁수</span>}
                                                    {itemDetail.class_thief && <span style={{ padding: "3px 8px", borderRadius: "4px", background: "rgba(59, 130, 246, 0.12)", color: "var(--app-text-color)", fontSize: "11px", fontWeight: "600" }}>도적</span>}
                                                    {itemDetail.class_pirate && <span style={{ padding: "3px 8px", borderRadius: "4px", background: "rgba(59, 130, 246, 0.12)", color: "var(--app-text-color)", fontSize: "11px", fontWeight: "600" }}>해적</span>}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* 오른쪽: 이름 + 상세 필드 */}
                                    <div style={{ minWidth: 0 }}>
                                        {(itemDetail.item_name_kr || itemDetail.item_name_en) && (
                                            <div style={{ marginBottom: "16px", paddingBottom: "12px", borderBottom: "1px solid var(--app-border)" }}>
                                                <div style={{ fontSize: "16px", fontWeight: "700", color: "var(--app-text-color)" }}>{itemDetail.item_name_kr || itemDetail.item_name_en}</div>
                                                {(itemDetail.item_name_kr && itemDetail.item_name_en) && (
                                                    <div style={{ fontSize: "12px", color: "var(--app-muted-text-color)", marginTop: "2px" }}>{itemDetail.item_name_en}</div>
                                                )}
                                            </div>
                                        )}
                                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "8px" }}>
                                            {Object.entries(itemDetail).map(([key, value]) => {
                                                if (value === null || value === undefined || (typeof value === "object" && Object.keys(value).length === 0)) return null;
                                                if (["meta", "item_id", "world", "item_file_path", "type", "item_type", "sub_type", "subType", "category", "class_beginner", "class_warrior", "class_magician", "class_bowman", "class_thief", "class_pirate", "item_name_kr", "item_name_en"].includes(key)) return null;
                                                let displayValue = value;
                                                if (typeof value === "number") displayValue = value.toLocaleString();
                                                else if (typeof value === "boolean") displayValue = value ? "예" : "아니오";
                                                else if (typeof value === "string") displayValue = value || "-";
                                                return (
                                                    <div key={key} style={{ padding: "8px 10px", border: "1px solid var(--app-border)", borderRadius: "6px", background: "var(--app-surface)" }}>
                                                        <div style={{ fontSize: "10px", color: "var(--app-muted-text-color)", marginBottom: "2px", fontWeight: "600" }}>{getItemDetailLabel(key)}</div>
                                                        <div style={{ fontSize: "12px", color: "var(--app-text-color)", fontWeight: "500" }}>{String(displayValue)}</div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {!itemDetailLoading && !itemDetailError && !itemDetail && (
                                <div style={{ textAlign: "center", padding: "48px 24px", color: "var(--app-muted-text-color)", fontSize: "14px" }}>아이템 상세 정보가 없습니다.</div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

