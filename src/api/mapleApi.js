/** API 베이스 URL. 브라우저면 접속한 호스트(서버IP)의 19080 사용 → 같은 망 다른 PC에서도 API 통신 가능 */
const API_BASE_URL =
    typeof import.meta.env?.VITE_API_BASE_URL === "string" && import.meta.env.VITE_API_BASE_URL
        ? import.meta.env.VITE_API_BASE_URL
        : typeof window !== "undefined" && window?.location?.hostname
            ? `http://${window.location.hostname}:19080/api`
            : "http://localhost:19080/api";

/** 서버 루트(정적 리소스용). resources/static/ 하위는 루트로 서빙됨. 상대 경로면 현재 origin 사용 */
export const API_ORIGIN =
    API_BASE_URL.startsWith("http")
        ? API_BASE_URL.replace(/\/api\/?$/, "") || "http://localhost:19080"
        : (typeof window !== "undefined" ? window.location.origin : "");

/**
 * 몬스터 이미지(GIF) URL 반환 (resources/static/monster-moves/{mob_id}.gif)
 * - 입력: mobId(string|number)
 * - 출력: string URL, 없으면 null
 */
export function getMonsterImageUrl(mobId) {
    if (mobId == null || mobId === "") return null;
    return `${API_ORIGIN}/monster-moves/${encodeURIComponent(String(mobId))}.gif`;
}

/**
 * 맵 미니맵 이미지 URL 반환 (resources/static/minimaps/{mapId}.png)
 * - 입력: mapId(string|number)
 * - 출력: string URL
 */
export function getMapImageUrl(mapId) {
    if (mapId == null || mapId === "") return null;
    return `${API_ORIGIN}/minimaps/${encodeURIComponent(String(mapId))}.png`;
}

/**
 * NPC 이미지(PNG) URL 반환 (resources/static/npcs/{npc_id}.png)
 * - 입력: npcId(string|number)
 * - 출력: string URL, 없으면 null
 */
export function getNpcImageUrl(npcId) {
    // 조건문: npcId가 비어있으면 이미지 URL을 만들지 않음
    if (npcId == null || npcId === "") return null;
    return `${API_ORIGIN}/npcs/${encodeURIComponent(String(npcId))}.png`;
}

/**
 * 아이템 이미지(PNG) URL 반환 (resources/static/items/{item_id}.png)
 * - 입력: itemId(string|number)
 * - 출력: string URL, 없으면 null
 */
export function getItemImageUrl(itemId) {
    if (itemId == null || itemId === "") return null;
    return `${API_ORIGIN}/items/${encodeURIComponent(String(itemId))}.png`;
}

/**
 * 쿼리 파라미터를 만들기 위해 값이 비어있는 키를 제거합니다.
 * - 입력: params(object)
 * - 출력: object (undefined / "" 제거된 객체)
 */
function buildCleanParams(params = {}) {
    // 조건문: params가 객체가 아니면 빈 객체로 처리
    if (!params || typeof params !== "object") return {};

    // 루프: undefined / "" 값은 제외해서 쿼리를 깔끔하게 유지
    return Object.fromEntries(
        Object.entries(params)
            // 조건문: value가 undefined 또는 빈 문자열이면 제외
            .filter(([, value]) => value !== undefined && value !== "")
    );
}

/**
 * URLSearchParams 쿼리를 생성합니다.
 * - 입력: params(object)
 * - 출력: string (querystring, leading '?' 없음)
 */
function buildQuery(params = {}) {
    const cleanParams = buildCleanParams(params);
    return new URLSearchParams(cleanParams).toString();
}

/* =========================
   아이템
========================= */

/**
 * 아이템 목록 조회 API 호출
 * - 입력: params(object)
 * - 출력: Promise(JSON)
 */
export async function fetchItems(params = {}) {
    const query = buildQuery(params);

    const response = await fetch(`${API_BASE_URL}/items?${query}`);
    // 조건문: HTTP 에러면 예외 발생
    if (!response.ok) {
        throw new Error("아이템 조회 실패");
    }

    return response.json();
}

/**
 * 아이템 카테고리/서브카테고리 옵션 조회
 * - 입력: params(object, optional) - 예: { world }
 * - 출력: Promise(JSON)
 */
export async function fetchItemOptions(params = {}) {
    const query = buildQuery(params);

    // 조건문: query가 있으면 ?query 를 붙여 호출
    const url = query ? `${API_BASE_URL}/items/options?${query}` : `${API_BASE_URL}/items/options`;
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error("아이템 옵션 조회 실패");
    }
    return response.json();
}

/* =========================
   고확 리스트
========================= */
export async function fetchShoutList(params) {
    const query = buildQuery(params);

    const response = await fetch(
        `${API_BASE_URL}/shouts?${query}`
    );

    if (!response.ok) {
        throw new Error("고확 리스트 조회 실패");
    }

    return response.json();
}

/* =========================
   크로노스토리 - 맵/몬스터/NPC
========================= */

/**
 * 크로노스토리 맵 목록 조회
 * - 입력: params(object) 예: { page, size, keyword }
 * - 출력: Promise(JSON)
 */
export async function fetchChronostoryMaps(params = {}) {
    const query = buildQuery(params);

    const url = query
        ? `${API_BASE_URL}/chronostory/maps?${query}`
        : `${API_BASE_URL}/chronostory/maps`;

    const response = await fetch(url);

    // 조건문: HTTP 에러면 예외 발생
    if (!response.ok) {
        throw new Error("크로노스토리 맵 조회 실패");
    }

    return response.json();
}

/**
 * 크로노스토리 맵 상세 + 해당 맵의 몬스터/NPC 목록 묶음 조회
 * - 입력: mapId(string|number)
 * - 출력: Promise(JSON)
 */
export async function fetchChronostoryMapBundle(mapId) {
    const safeMapId = String(mapId ?? "").trim();

    // 조건문: mapId가 없으면 호출 불가
    if (!safeMapId) {
        throw new Error("mapId가 없습니다.");
    }

    const response = await fetch(`${API_BASE_URL}/chronostory/maps/${encodeURIComponent(safeMapId)}`);

    if (!response.ok) {
        throw new Error("크로노스토리 맵 상세 조회 실패");
    }

    return response.json();
}

/**
 * 크로노스토리 몬스터 상세 정보 조회
 * - 입력: mobId(string|number)
 * - 출력: Promise(JSON)
 */
export async function fetchChronostoryMobDetail(mobId) {
    const safeMobId = String(mobId ?? "").trim();

    // 조건문: mobId가 없으면 호출 불가
    if (!safeMobId) {
        throw new Error("mobId가 없습니다.");
    }

    const response = await fetch(`${API_BASE_URL}/chronostory/maps/mobs/${encodeURIComponent(safeMobId)}`);

    if (!response.ok) {
        throw new Error("크로노스토리 몬스터 상세 조회 실패");
    }

    return response.json();
}

/**
 * 크로노스토리 NPC 상세 정보 조회
 * - mapId가 있으면 출현 맵 목록을 해당 맵만 조회(선택한 맵 기준)
 * - 입력: npcId(string|number), mapId(string|number, 선택)
 * - 출력: Promise(JSON)
 */
export async function fetchChronostoryNpcDetail(npcId, mapId) {
    const safeNpcId = String(npcId ?? "").trim();

    // 조건문: npcId가 없으면 호출 불가
    if (!safeNpcId) {
        throw new Error("npcId가 없습니다.");
    }

    const url = new URL(`${API_BASE_URL}/chronostory/maps/npcs/${encodeURIComponent(safeNpcId)}`);
    if (mapId != null && String(mapId).trim() !== "") {
        url.searchParams.set("mapId", String(mapId).trim());
    }
    const response = await fetch(url.toString());
    if (!response.ok) {
        throw new Error("크로노스토리 NPC 상세 조회 실패");
    }
    return response.json();
}

/**
 * 크로노스토리 가챠 드롭(아이템) 목록 조회 - chronostory_gachapon_drop 테이블
 * - 입력: params(object) 예: { page, size, keyword }
 * - 출력: Promise(JSON) { data: { items, totalElements, page, size, totalPages } }
 */
export async function fetchChronostoryGachaponDrops(params = {}) {
    const query = buildQuery(params);
    const url = query ? `${API_BASE_URL}/chronostory/gachapon-drops?${query}` : `${API_BASE_URL}/chronostory/gachapon-drops`;
    const response = await fetch(url);
    if (!response.ok) throw new Error("가챠 드롭 목록 조회 실패");
    return response.json();
}

/**
 * 크로노스토리 가챠 드롭 machine_name 목록 (조회 조건 드롭다운용, GROUP BY 기준)
 * - 출력: Promise(JSON) { data: string[] }
 */
export async function fetchChronostoryGachaponDropMachineNames() {
    const response = await fetch(`${API_BASE_URL}/chronostory/gachapon-drops/machine-names`);
    if (!response.ok) throw new Error("machine_name 목록 조회 실패");
    return response.json();
}

/**
 * 크로노스토리 퀘스트 DB 목록 조회 (테이블 저장 데이터)
 * - 입력: params(object) 예: { page, size, keyword }
 * - 출력: Promise(JSON) { data: { items, totalElements, page, size, totalPages } }
 */
export async function fetchChronostoryQuests(params = {}) {
    const query = buildQuery(params);
    const url = query ? `${API_BASE_URL}/chronostory/quests?${query}` : `${API_BASE_URL}/chronostory/quests`;
    const response = await fetch(url);
    if (!response.ok) throw new Error("퀘스트 목록 조회 실패");
    return response.json();
}

/**
 * 크로노스토리 퀘스트 DB CSV 임포트
 * - 입력: file(File), clearFirst(boolean) true면 기존 데이터 삭제 후 삽입
 * - 출력: Promise(JSON) { data: { importedCount, cleared, message } }
 */
export async function fetchChronostoryQuestsImport(file, clearFirst = false) {
    if (!file || !(file instanceof File)) throw new Error("파일을 선택해주세요.");
    const formData = new FormData();
    formData.append("file", file);
    formData.append("clearFirst", String(clearFirst));
    const response = await fetch(`${API_BASE_URL}/chronostory/quests/import`, {
        method: "POST",
        body: formData
    });
    if (!response.ok) throw new Error("CSV 임포트 실패");
    return response.json();
}

/**
 * 크로노스토리 몬스터 검색(한글명 기준)
 * - 입력: params(object) 예: { page, size, keyword }
 * - 출력: Promise(JSON)
 */
export async function fetchChronostoryMonsters(params = {}) {
    const query = buildQuery(params);

    const url = query
        ? `${API_BASE_URL}/chronostory/monsters?${query}`
        : `${API_BASE_URL}/chronostory/monsters`;

    const response = await fetch(url);

    // 조건문: HTTP 에러면 예외 발생
    if (!response.ok) {
        throw new Error("크로노스토리 몬스터 검색 실패");
    }

    return response.json();
}

/**
 * 크로노스토리 NPC 검색(한글명 기준)
 * - 입력: params(object) 예: { page, size, keyword }
 * - 출력: Promise(JSON)
 */
export async function fetchChronostoryNpcs(params = {}) {
    const query = buildQuery(params);

    const url = query
        ? `${API_BASE_URL}/chronostory/npcs?${query}`
        : `${API_BASE_URL}/chronostory/npcs`;

    const response = await fetch(url);

    // 조건문: HTTP 에러면 예외 발생
    if (!response.ok) {
        throw new Error("크로노스토리 NPC 검색 실패");
    }

    return response.json();
}

/* =========================
   메이플랜드 - 맵/몬스터/NPC
========================= */

/**
 * 메이플랜드 맵 목록 조회
 * - 입력: params(object) 예: { page, size, keyword }
 * - 출력: Promise(JSON)
 */
export async function fetchMaplelandMaps(params = {}) {
    const query = buildQuery(params);

    const url = query
        ? `${API_BASE_URL}/mapleland/maps?${query}`
        : `${API_BASE_URL}/mapleland/maps`;

    const response = await fetch(url);

    // 조건문: HTTP 에러면 예외 발생
    if (!response.ok) {
        throw new Error("메이플랜드 맵 조회 실패");
    }

    return response.json();
}

/**
 * 메이플랜드 NPC 상세 정보 조회
 * - 입력: npcId(string|number)
 * - 출력: Promise(JSON)
 */
export async function fetchMaplelandNpcDetail(npcId) {
    const safeNpcId = String(npcId ?? "").trim();

    // 조건문: npcId가 없으면 호출 불가
    if (!safeNpcId) {
        throw new Error("npcId가 없습니다.");
    }

    const response = await fetch(`${API_BASE_URL}/mapleland/maps/npcs/${encodeURIComponent(safeNpcId)}`);
    if (!response.ok) {
        throw new Error("메이플랜드 NPC 상세 조회 실패");
    }
    return response.json();
}

/**
 * 메이플랜드 맵 상세 + 해당 맵의 몬스터/NPC 목록 묶음 조회
 * - 입력: mapId(string|number)
 * - 출력: Promise(JSON)
 */
export async function fetchMaplelandMapBundle(mapId) {
    const safeMapId = String(mapId ?? "").trim();

    // 조건문: mapId가 없으면 호출 불가
    if (!safeMapId) {
        throw new Error("mapId가 없습니다.");
    }

    const response = await fetch(`${API_BASE_URL}/mapleland/maps/${encodeURIComponent(safeMapId)}`);

    if (!response.ok) {
        throw new Error("메이플랜드 맵 상세 조회 실패");
    }

    return response.json();
}

/**
 * 메이플랜드 몬스터 상세 정보 조회
 * - 입력: mobId(string|number)
 * - 출력: Promise(JSON)
 */
export async function fetchMaplelandMobDetail(mobId) {
    const safeMobId = String(mobId ?? "").trim();

    // 조건문: mobId가 없으면 호출 불가
    if (!safeMobId) {
        throw new Error("mobId가 없습니다.");
    }

    const response = await fetch(`${API_BASE_URL}/mapleland/maps/mobs/${encodeURIComponent(safeMobId)}`);

    if (!response.ok) {
        throw new Error("메이플랜드 몬스터 상세 조회 실패");
    }

    return response.json();
}

/**
 * 메이플랜드 몬스터 검색(한글명 기준)
 * - 입력: params(object) 예: { page, size, keyword }
 * - 출력: Promise(JSON)
 */
export async function fetchMaplelandMonsters(params = {}) {
    const query = buildQuery(params);

    const url = query
        ? `${API_BASE_URL}/mapleland/monsters?${query}`
        : `${API_BASE_URL}/mapleland/monsters`;

    const response = await fetch(url);

    // 조건문: HTTP 에러면 예외 발생
    if (!response.ok) {
        throw new Error("메이플랜드 몬스터 검색 실패");
    }

    return response.json();
}

/**
 * 메이플랜드 NPC 검색(한글명 기준)
 * - 입력: params(object) 예: { page, size, keyword }
 * - 출력: Promise(JSON)
 */
export async function fetchMaplelandNpcs(params = {}) {
    const query = buildQuery(params);

    const url = query
        ? `${API_BASE_URL}/mapleland/npcs?${query}`
        : `${API_BASE_URL}/mapleland/npcs`;

    const response = await fetch(url);

    // 조건문: HTTP 에러면 예외 발생
    if (!response.ok) {
        throw new Error("메이플랜드 NPC 검색 실패");
    }

    return response.json();
}

/* =========================
   메이플랜드 - mobs / mob_move
========================= */

/**
 * 메이플랜드 mobs 목록 조회(검색 + 페이징)
 * - 입력: params(object) 예: { page, size, keyword }
 * - 출력: Promise(JSON)
 */
export async function fetchMaplelandMobs(params = {}) {
    const query = buildQuery(params);

    const url = query
        ? `${API_BASE_URL}/mapleland/mobs?${query}`
        : `${API_BASE_URL}/mapleland/mobs`;

    const response = await fetch(url);

    // 조건문: HTTP 에러면 예외 발생
    if (!response.ok) {
        throw new Error("메이플랜드 mobs 조회 실패");
    }

    return response.json();
}

/**
 * 메이플랜드 mob 상세 조회
 * - 입력: mobId(string|number)
 * - 출력: Promise(JSON)
 */
export async function fetchMaplelandMob(mobId) {
    const safeMobId = String(mobId ?? "").trim();

    // 조건문: mobId가 없으면 호출 불가
    if (!safeMobId) {
        throw new Error("mobId가 없습니다.");
    }

    const response = await fetch(`${API_BASE_URL}/mapleland/mobs/${encodeURIComponent(safeMobId)}`);
    if (!response.ok) {
        throw new Error("메이플랜드 mob 상세 조회 실패");
    }
    return response.json();
}

/**
 * 메이플랜드 mob_move 목록 조회(필터: mobId, mapId)
 * - 입력: params(object) 예: { page, size, mobId, mapId }
 * - 출력: Promise(JSON)
 */
export async function fetchMaplelandMobMoves(params = {}) {
    const query = buildQuery(params);

    const url = query
        ? `${API_BASE_URL}/mapleland/mob-moves?${query}`
        : `${API_BASE_URL}/mapleland/mob-moves`;

    const response = await fetch(url);

    // 조건문: HTTP 에러면 예외 발생
    if (!response.ok) {
        throw new Error("메이플랜드 mob_move 조회 실패");
    }

    return response.json();
}

/**
 * 크로노스토리 아이템 상세 정보 조회
 * - 입력: itemId(string|number)
 * - 출력: Promise(JSON)
 */
export async function fetchChronostoryItemDetail(itemId) {
    const safeItemId = String(itemId ?? "").trim();

    // 조건문: itemId가 없으면 호출 불가
    if (!safeItemId) {
        throw new Error("itemId가 없습니다.");
    }

    const response = await fetch(`${API_BASE_URL}/chronostory/maps/items/${encodeURIComponent(safeItemId)}`);
    if (!response.ok) {
        throw new Error("크로노스토리 아이템 상세 조회 실패");
    }
    return response.json();
}

/**
 * 메이플랜드 아이템 상세 정보 조회
 * - 입력: itemId(string|number)
 * - 출력: Promise(JSON)
 */
export async function fetchMaplelandItemDetail(itemId) {
    const safeItemId = String(itemId ?? "").trim();

    // 조건문: itemId가 없으면 호출 불가
    if (!safeItemId) {
        throw new Error("itemId가 없습니다.");
    }

    const response = await fetch(`${API_BASE_URL}/mapleland/maps/items/${encodeURIComponent(safeItemId)}`);
    if (!response.ok) {
        throw new Error("메이플랜드 아이템 상세 조회 실패");
    }
    return response.json();
}

/**
 * 특정 mob의 이동 데이터 목록 조회(간편)
 * - 입력: mobId(string|number), params(object, optional) 예: { mapId }
 * - 출력: Promise(JSON)
 */
export async function fetchMaplelandMovesByMob(mobId, params = {}) {
    const safeMobId = String(mobId ?? "").trim();

    // 조건문: mobId가 없으면 호출 불가
    if (!safeMobId) {
        throw new Error("mobId가 없습니다.");
    }

    const query = buildQuery(params);
    const url = query
        ? `${API_BASE_URL}/mapleland/mobs/${encodeURIComponent(safeMobId)}/moves?${query}`
        : `${API_BASE_URL}/mapleland/mobs/${encodeURIComponent(safeMobId)}/moves`;

    const response = await fetch(url);
    if (!response.ok) {
        throw new Error("메이플랜드 mob moves 조회 실패");
    }
    return response.json();
}