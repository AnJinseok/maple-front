import { useMemo, useState } from "react";
import ItemSelectModal from "../components/common/ItemSelectModal";

/**
 * 캐릭터 아이템 장착/능력치 페이지
 * - 입력: 없음(React 페이지 컴포넌트)
 * - 출력: JSX(Element)
 */
export default function EquipStats() {
    // 장착 슬롯 목록(고정)
    const SLOT_KEYS = ["무기", "모자", "상의", "하의", "장갑", "신발", "망토"];

    // 능력치 키(고정)
    const BASE_STAT_KEYS = ["힘", "민첩", "지력", "럭"];

    // 기본 능력치 최소값(메이플류 기본값 가정)
    const MIN_BASE_STAT = 4;

    // 인벤토리(더미 데이터 + API로 추가된 아이템 포함)
    const [inventoryItems, setInventoryItems] = useState(() => [
        {
            id: "item-weapon-1",
            name: "초보자의 검",
            slot: "무기",
            stats: { 공격력: 5, 힘: 1 }
        },
        {
            id: "item-weapon-2",
            name: "단단한 검",
            slot: "무기",
            stats: { 공격력: 12, 힘: 3 }
        },
        {
            id: "item-hat-1",
            name: "파란 모자",
            slot: "모자",
            stats: { 방어력: 3, 민첩: 1 }
        },
        {
            id: "item-top-1",
            name: "가죽 상의",
            slot: "상의",
            stats: { 방어력: 5, 힘: 1 }
        },
        {
            id: "item-bottom-1",
            name: "가죽 하의",
            slot: "하의",
            stats: { 방어력: 4 }
        },
        {
            id: "item-glove-1",
            name: "작업용 장갑",
            slot: "장갑",
            stats: { 공격력: 2, 민첩: 2 }
        },
        {
            id: "item-shoes-1",
            name: "가벼운 신발",
            slot: "신발",
            stats: { 이동속도: 5, 민첩: 1 }
        },
        {
            id: "item-cape-1",
            name: "초록 망토",
            slot: "망토",
            stats: { 힘: 1, 민첩: 1, 지력: 1, 럭: 1 }
        }
    ]);

    // 성별 선택 상태
    const [gender, setGender] = useState("male"); // male | female

    // 기본 능력치(입력 UI용)
    const [baseStats, setBaseStats] = useState(() => ({
        힘: MIN_BASE_STAT,
        민첩: MIN_BASE_STAT,
        지력: MIN_BASE_STAT,
        럭: MIN_BASE_STAT
    }));

    // 기본 능력치 입력값(문자열) - 입력 중 빈 값 허용을 위해 분리 관리
    const [baseStatInputs, setBaseStatInputs] = useState(() => ({
        힘: String(MIN_BASE_STAT),
        민첩: String(MIN_BASE_STAT),
        지력: String(MIN_BASE_STAT),
        럭: String(MIN_BASE_STAT)
    }));

    // 캐릭터 레벨(입력 UI용)
    const [characterLevel, setCharacterLevel] = useState(1);

    // 레벨 입력값(문자열) - 입력 중 빈 값 허용을 위해 분리 관리
    const [characterLevelInput, setCharacterLevelInput] = useState("1");

    // 슬롯별 장착 아이템(id) 상태
    const [equippedBySlot, setEquippedBySlot] = useState(() => ({}));

    // 현재 선택된 슬롯
    const [selectedSlot, setSelectedSlot] = useState("무기");

    // 현재 선택된 아이템(id)
    const [selectedItemId, setSelectedItemId] = useState(null);

    // 아이템 선택 모달 열림 상태
    const [itemModalOpen, setItemModalOpen] = useState(false);

    // 스킬 포인트(더미)
    const [skillPoints, setSkillPoints] = useState(10);

    // 스킬 트리(더미 구조)
    const [skillTree, setSkillTree] = useState(() => ({
        전사: [
            { id: "warrior-1", name: "파워 스트라이크", level: 0, maxLevel: 10, desc: "단일 공격 스킬" },
            { id: "warrior-2", name: "아이언 바디", level: 0, maxLevel: 10, desc: "방어력 증가 버프" }
        ],
        마법사: [
            { id: "mage-1", name: "매직 클로", level: 0, maxLevel: 10, desc: "기본 마법 공격" },
            { id: "mage-2", name: "MP 이터", level: 0, maxLevel: 10, desc: "MP 흡수" }
        ],
        궁수: [
            { id: "archer-1", name: "더블 샷", level: 0, maxLevel: 10, desc: "2연속 공격" },
            { id: "archer-2", name: "크리티컬 샷", level: 0, maxLevel: 10, desc: "크리티컬 확률 증가" }
        ],
        도적: [
            { id: "thief-1", name: "더블 스탭", level: 0, maxLevel: 10, desc: "2연속 찌르기" },
            { id: "thief-2", name: "다크 사이트", level: 0, maxLevel: 10, desc: "은신 상태" }
        ]
    }));

    /**
     * id로 아이템을 찾습니다.
     * - 입력: itemId(string)
     * - 출력: item(object) | undefined
     */
    function getItemById(itemId) {
        // 조건문: itemId가 없으면(undefined/null) 바로 undefined 반환
        if (!itemId) return undefined;

        // 배열 순회: id가 일치하는 아이템을 찾음
        return inventoryItems.find(item => item.id === itemId);
    }

    /**
     * API 아이템을 인벤토리 아이템 형태로 변환합니다.
     * - 입력: apiItem(object), slotKey(string)
     * - 출력: inventoryItem(object)
     */
    function mapApiItemToInventoryItem(apiItem, slotKey) {
        // 조건문: apiItem이 없으면 undefined
        if (!apiItem) return undefined;

        // API 아이템 id는 숫자(Long)라서 prefix를 붙여 string으로 통일
        const inventoryId = `api-${apiItem.id ?? apiItem.itemCode}`;

        // 스탯 매핑(현재는 공격력만 우선 반영)
        const stats = {};

        // 조건문: 공격력 필드가 있으면 공격력으로 반영
        if (typeof apiItem.attack === "number") {
            stats["공격력"] = apiItem.attack;
        }

        return {
            id: inventoryId,
            name: apiItem.name,
            // 요청대로 선택 슬롯 기준으로 장착 가능하게 처리(추후 category 기반 매핑 가능)
            slot: slotKey,
            stats
        };
    }

    /**
     * 모달에서 아이템을 선택했을 때 처리
     * - 입력: apiItem(object)
     * - 출력: 없음(상태 업데이트)
     */
    function handleSelectItemFromModal(apiItem) {
        const mapped = mapApiItemToInventoryItem(apiItem, selectedSlot);

        // 조건문: 변환 실패 시 종료
        if (!mapped) return;

        setInventoryItems(prev => {
            // 조건문: 같은 id가 이미 있으면 교체
            const exists = prev.some(item => item.id === mapped.id);
            if (exists) {
                return prev.map(item => (item.id === mapped.id ? mapped : item));
            }
            // 없으면 추가
            return [mapped, ...prev];
        });

        // 선택 아이템으로 세팅(장착 버튼은 기존대로 사용)
        setSelectedItemId(mapped.id);
    }

    /**
     * 성별 선택 핸들러
     * - 입력: nextGender("male" | "female")
     * - 출력: 없음(상태 업데이트)
     */
    function handleSelectGender(nextGender) {
        // 조건문: 동일 성별을 다시 누르면 변경하지 않음
        if (nextGender === gender) return;

        setGender(nextGender);
    }

    /**
     * 기본 능력치 변경 핸들러
     * - 입력: statName(string), nextValue(string)
     * - 출력: 없음(상태 업데이트)
     */
    function handleChangeBaseStat(statName, nextValue) {
        // 숫자 변환(빈 문자열 처리 포함)
        const parsed = Number(nextValue);

        setBaseStats(prev => {
            const next = { ...prev };

            // 조건문: 숫자가 아니면 0으로 처리(방어적)
            if (!Number.isFinite(parsed)) {
                next[statName] = 0;
                return next;
            }

            // 조건문: 0~999 범위로 제한(UX)
            const clamped = Math.max(0, Math.min(999, parsed));
            next[statName] = clamped;
            return next;
        });
    }

    /**
     * 기본 능력치 입력값 변경 핸들러(문자열 유지)
     * - 입력: statName(string), nextValue(string)
     * - 출력: 없음(상태 업데이트)
     */
    function handleChangeBaseStatInput(statName, nextValue) {
        // 조건문: 숫자만 입력 허용(빈 문자열은 허용)
        if (!/^\d*$/.test(nextValue)) return;

        setBaseStatInputs(prev => ({
            ...prev,
            [statName]: nextValue
        }));
    }

    /**
     * 기본 능력치 입력값을 확정(blur/enter 시점)합니다.
     * - 입력: statName(string)
     * - 출력: 없음(상태 업데이트)
     */
    function commitBaseStatInput(statName) {
        const inputValue = baseStatInputs?.[statName] ?? "";

        // 조건문: 빈 문자열이면 현재 값으로 되돌림
        if (inputValue.trim() === "") {
            setBaseStatInputs(prev => ({
                ...prev,
                [statName]: String(baseStats?.[statName] ?? MIN_BASE_STAT)
            }));
            return;
        }

        const parsed = Number(inputValue);

        // 조건문: 숫자가 아니면 현재 값으로 되돌림(방어적)
        if (!Number.isFinite(parsed)) {
            setBaseStatInputs(prev => ({
                ...prev,
                [statName]: String(baseStats?.[statName] ?? MIN_BASE_STAT)
            }));
            return;
        }

        const currentValue = baseStats?.[statName] ?? MIN_BASE_STAT;

        // 조건문: 최소값/최대값 제한
        const desiredClamped = Math.max(MIN_BASE_STAT, Math.min(999, parsed));
        const delta = desiredClamped - currentValue;

        // 현재 남는 스텟을 "현재 baseStats 기준"으로 다시 계산(커밋 시점 정합성)
        const currentAllocated = calculateAllocatedStatPoints(baseStats);
        const currentRemaining = Math.max(0, totalStatPoints - currentAllocated);

        // 증가하려는 경우: 남는 스텟 범위 내로만 허용
        let finalValue = desiredClamped;

        // 조건문: 증가 방향이면 남는 스텟만큼만 증가 가능
        if (delta > 0) {
            const allowedIncrease = Math.min(delta, currentRemaining);
            finalValue = currentValue + allowedIncrease;
        }

        // 감소는 그대로 허용(남는 스텟 환급 효과는 계산식으로 자동 반영)
        setBaseStats(prev => ({
            ...prev,
            [statName]: finalValue
        }));

        // 입력값도 확정 값으로 맞춤
        setBaseStatInputs(prev => ({
            ...prev,
            [statName]: String(finalValue)
        }));
    }

    /**
     * 레벨에 따라 지급되는 총 스텟 포인트를 계산합니다.
     * - 입력: level(number)
     * - 출력: number (레벨당 5씩 증가, 1레벨은 0)
     */
    function calculateTotalStatPointsByLevel(level) {
        // 조건문: 1레벨은 추가 스텟이 없음
        if (level <= 1) return 0;

        // 레벨업당 5씩 증가
        return (level - 1) * 5;
    }

    /**
     * 현재 기본 능력치에서 "찍은 스텟(추가분)" 합을 계산합니다.
     * - 입력: stats(object)
     * - 출력: number
     */
    function calculateAllocatedStatPoints(stats) {
        let allocated = 0;

        // 루프: 기본 능력치 4종을 순회하며 (현재값 - 최소값)을 누적
        BASE_STAT_KEYS.forEach(statName => {
            const currentValue = typeof stats?.[statName] === "number" ? stats[statName] : MIN_BASE_STAT;
            const extra = Math.max(0, currentValue - MIN_BASE_STAT);
            allocated += extra;
        });

        return allocated;
    }

    // 레벨 기준 총 스텟 포인트
    const totalStatPoints = useMemo(() => {
        return calculateTotalStatPointsByLevel(characterLevel);
    }, [characterLevel]);

    // 현재까지 찍은 스텟(추가분) 합계
    const allocatedStatPoints = useMemo(() => {
        return calculateAllocatedStatPoints(baseStats);
    }, [baseStats]);

    // 남는 스텟 = (레벨 지급) - (찍은 스텟)
    const remainingStatPoints = useMemo(() => {
        return Math.max(0, totalStatPoints - allocatedStatPoints);
    }, [allocatedStatPoints, totalStatPoints]);

    /**
     * 캐릭터 레벨 변경 핸들러
     * - 입력: nextValue(string)
     * - 출력: 없음(상태 업데이트)
     */
    function handleChangeCharacterLevel(nextValue) {
        // 조건문: 숫자만 입력 허용(빈 문자열은 허용)
        if (!/^\d*$/.test(nextValue)) return;

        // 입력 중간 상태를 그대로 유지(예: "" 또는 "2" 또는 "200")
        setCharacterLevelInput(nextValue);
    }

    /**
     * 레벨 입력값을 확정(blur 시점)합니다.
     * - 입력: 없음(상태 사용)
     * - 출력: 없음(상태 업데이트)
     */
    function commitCharacterLevelInput() {
        // 조건문: 빈 문자열이면 1로 되돌림
        if (characterLevelInput.trim() === "") {
            setCharacterLevel(1);
            setCharacterLevelInput("1");
            return;
        }

        const parsed = Number(characterLevelInput);

        // 조건문: 숫자가 아니면 1로 처리(방어적)
        if (!Number.isFinite(parsed)) {
            setCharacterLevel(1);
            setCharacterLevelInput("1");
            return;
        }

        // 조건문: 레벨 범위를 1~200으로 제한(UX)
        const clamped = Math.max(1, Math.min(200, parsed));
        setCharacterLevel(clamped);
        setCharacterLevelInput(String(clamped));

        // 조건문: 레벨이 내려갔을 때, 찍은 스텟이 허용치를 초과하면 자동으로 줄여 정합성 유지
        setBaseStats(prev => {
            const next = { ...prev };

            const allowed = calculateTotalStatPointsByLevel(clamped);
            let used = calculateAllocatedStatPoints(next);

            // 조건문: 이미 허용치 이하이면 그대로 유지
            if (used <= allowed) return next;

            // 루프: 초과분만큼 스탯을 내려서(최소값까지) 맞춤
            // - 내리는 순서는 럭 → 지력 → 민첩 → 힘 (원하면 바꿀 수 있음)
            const reduceOrder = ["럭", "지력", "민첩", "힘"];

            while (used > allowed) {
                let reducedThisRound = false;

                // 루프: 순서대로 1씩 내릴 수 있으면 내림
                for (let i = 0; i < reduceOrder.length && used > allowed; i += 1) {
                    const statName = reduceOrder[i];

                    // 조건문: 최소값보다 크면 1 감소
                    if (next[statName] > MIN_BASE_STAT) {
                        next[statName] -= 1;
                        used -= 1;
                        reducedThisRound = true;
                    }
                }

                // 조건문: 더 이상 내릴 수 없으면(방어적) 루프 탈출
                if (!reducedThisRound) break;
            }

            return next;
        });
    }

    /**
     * 특정 능력치를 1 올립니다(남는 스텟 필요).
     * - 입력: statName(string)
     * - 출력: 없음(상태 업데이트)
     */
    function handleIncreaseBaseStat(statName) {
        // 조건문: 남는 스텟이 없으면 증가 불가
        if (remainingStatPoints <= 0) return;

        const nextValue = (baseStats?.[statName] ?? MIN_BASE_STAT) + 1;

        setBaseStats(prev => ({
            ...prev,
            // 해당 스탯을 1 증가
            [statName]: (prev?.[statName] ?? MIN_BASE_STAT) + 1
        }));

        // 입력값도 함께 갱신
        setBaseStatInputs(prev => ({
            ...prev,
            [statName]: String(nextValue)
        }));
    }

    /**
     * 특정 능력치를 1 내립니다(최소값 이하로는 불가, 포인트 환급).
     * - 입력: statName(string)
     * - 출력: 없음(상태 업데이트)
     */
    function handleDecreaseBaseStat(statName) {
        const currentValue = baseStats?.[statName] ?? MIN_BASE_STAT;

        // 조건문: 최소값이면 감소 불가
        if (currentValue <= MIN_BASE_STAT) return;

        const nextValue = currentValue - 1;

        setBaseStats(prev => {
            const current = prev?.[statName] ?? MIN_BASE_STAT;

            // 조건문: 최소값이면 감소 불가
            if (current <= MIN_BASE_STAT) return prev;

            return {
                ...prev,
                // 해당 스탯을 1 감소
                [statName]: current - 1
            };
        });

        // 입력값도 함께 갱신
        setBaseStatInputs(prev => ({
            ...prev,
            [statName]: String(nextValue)
        }));
    }

    /**
     * 선택된 슬롯에 장착 가능한 아이템 목록을 계산합니다.
     * - 입력: 없음(상태 사용)
     * - 출력: item[] (배열)
     */
    const filteredInventoryItems = useMemo(() => {
        // 선택된 슬롯이 없으면(방어적) 전체를 반환
        if (!selectedSlot) return inventoryItems;

        // 선택 슬롯과 slot이 같은 아이템만 필터링
        return inventoryItems.filter(item => item.slot === selectedSlot);
    }, [inventoryItems, selectedSlot]);

    /**
     * 장착 아이템들의 능력치를 합산합니다.
     * - 입력: equippedMap(슬롯->아이템id)
     * - 출력: stats 합계 객체
     */
    function calculateTotalStats(equippedMap) {
        const totals = {};

        // 루프: 장착된 슬롯들을 순회하며 능력치를 누적
        Object.entries(equippedMap).forEach(([slotKey, itemId]) => {
            // 조건문: 슬롯에 아이템이 없으면 스킵
            if (!itemId) return;

            const item = getItemById(itemId);
            // 조건문: 아이템이 인벤토리에 없으면(방어적) 스킵
            if (!item) return;

            // 루프: 아이템 스탯을 순회하며 합산
            Object.entries(item.stats || {}).forEach(([statName, value]) => {
                // 조건문: 숫자가 아니면(방어적) 스킵
                if (typeof value !== "number") return;

                totals[statName] = (totals[statName] || 0) + value;
            });
        });

        return totals;
    }

    /**
     * 기본 능력치 + 장착 능력치를 합산합니다.
     * - 입력: 없음(상태 사용)
     * - 출력: stats 합계 객체
     */
    const totalStats = useMemo(() => {
        const equippedTotals = calculateTotalStats(equippedBySlot);
        const merged = { ...equippedTotals };

        // 루프: 기본 능력치를 합산
        BASE_STAT_KEYS.forEach(statName => {
            // 조건문: baseStats가 숫자가 아니면 0 처리(방어적)
            const baseValue = typeof baseStats?.[statName] === "number" ? baseStats[statName] : 0;
            merged[statName] = (merged[statName] || 0) + baseValue;
        });

        return merged;
    }, [BASE_STAT_KEYS, baseStats, equippedBySlot]);

    /**
     * 슬롯 선택 핸들러
     * - 입력: slotKey(string)
     * - 출력: 없음(상태 업데이트)
     */
    function handleSelectSlot(slotKey) {
        // 조건문: 같은 슬롯을 다시 클릭하면 유지
        if (slotKey === selectedSlot) return;

        setSelectedSlot(slotKey);
        // 슬롯을 바꾸면 아이템 선택도 초기화(UX)
        setSelectedItemId(null);
    }

    /**
     * 인벤 아이템 선택 핸들러
     * - 입력: itemId(string)
     * - 출력: 없음(상태 업데이트)
     */
    function handleSelectItem(itemId) {
        setSelectedItemId(itemId);
    }

    /**
     * 선택된 슬롯에 선택된 아이템을 장착합니다.
     * - 입력: 없음(상태 사용)
     * - 출력: 없음(상태 업데이트)
     */
    function handleEquipSelectedItem() {
        const item = getItemById(selectedItemId);

        // 조건문: 아이템이 없으면 장착 불가
        if (!item) return;

        // 조건문: 선택된 슬롯과 아이템 슬롯이 다르면 장착 불가
        if (item.slot !== selectedSlot) return;

        setEquippedBySlot(prev => ({
            ...prev,
            // 선택 슬롯에 아이템 장착
            [selectedSlot]: item.id
        }));
    }

    /**
     * 특정 슬롯 장착 해제
     * - 입력: slotKey(string)
     * - 출력: 없음(상태 업데이트)
     */
    function handleUnequipSlot(slotKey) {
        setEquippedBySlot(prev => ({
            ...prev,
            // 해당 슬롯을 비움
            [slotKey]: null
        }));
    }

    /**
     * 스킬 레벨을 올립니다(포인트 필요).
     * - 입력: categoryName(string), skillId(string)
     * - 출력: 없음(상태 업데이트)
     */
    function handleIncreaseSkillLevel(categoryName, skillId) {
        // 조건문: 포인트가 없으면 증가 불가
        if (skillPoints <= 0) return;

        setSkillTree(prev => {
            const next = { ...prev };
            const list = next?.[categoryName] || [];

            // 루프: 해당 스킬을 찾아 레벨 증가
            next[categoryName] = list.map(skill => {
                // 조건문: id가 다르면 그대로 반환
                if (skill.id !== skillId) return skill;

                // 조건문: 이미 maxLevel이면 증가 불가
                if (skill.level >= skill.maxLevel) return skill;

                return { ...skill, level: skill.level + 1 };
            });

            return next;
        });

        // 포인트 차감(최소 0 보장)
        setSkillPoints(prev => Math.max(0, prev - 1));
    }

    /**
     * 스킬 레벨을 내립니다(포인트 환급).
     * - 입력: categoryName(string), skillId(string)
     * - 출력: 없음(상태 업데이트)
     */
    function handleDecreaseSkillLevel(categoryName, skillId) {
        setSkillTree(prev => {
            const next = { ...prev };
            const list = next?.[categoryName] || [];

            let refunded = 0;

            // 루프: 해당 스킬을 찾아 레벨 감소
            next[categoryName] = list.map(skill => {
                // 조건문: id가 다르면 그대로 반환
                if (skill.id !== skillId) return skill;

                // 조건문: 레벨이 0이면 감소 불가
                if (skill.level <= 0) return skill;

                refunded = 1;
                return { ...skill, level: skill.level - 1 };
            });

            // 조건문: 감소에 성공했을 때만 포인트 환급
            if (refunded > 0) {
                setSkillPoints(prevPoints => prevPoints + refunded);
            }

            return next;
        });
    }

    /**
     * 스킬 포인트를 초기화합니다(더미 기능).
     * - 입력: 없음
     * - 출력: 없음(상태 업데이트)
     */
    function handleResetSkills() {
        // 루프: 모든 카테고리/스킬 레벨을 0으로 초기화
        setSkillTree(prev => {
            const next = {};

            Object.entries(prev).forEach(([categoryName, list]) => {
                next[categoryName] = (list || []).map(skill => ({
                    ...skill,
                    level: 0
                }));
            });

            return next;
        });

        // 포인트도 기본값으로 초기화
        setSkillPoints(10);
    }

    // 선택 아이템(표시용)
    const selectedItem = useMemo(() => getItemById(selectedItemId), [selectedItemId]);

    return (
        <div className="equip-page">
            <div className="equip-header">
                <h2 className="equip-title">아이템 능력치 장착</h2>
                <p className="equip-subtitle">성별을 선택하고, 아이템/능력치/스킬을 조합해 캐릭터를 구성하세요.</p>
            </div>

            {/* 아이템 선택 모달 */}
            <ItemSelectModal
                open={itemModalOpen}
                onClose={() => setItemModalOpen(false)}
                onSelect={handleSelectItemFromModal}
                characterLevel={characterLevel}
            />

            {/* 상단: 좌(캐릭터) + 우(능력치/아이템 리스트) */}
            <div className="equip-top">
                {/* 좌측: 캐릭터 모형 + 장착 슬롯 */}
                <section className="equip-card equip-card-character">
                    <div className="equip-card-header">
                        <h3>캐릭터</h3>
                        <span className="equip-badge">미리보기</span>
                    </div>

                    {/* 성별 선택 */}
                    <div className="equip-gender">
                        <button
                            type="button"
                            className={`btn btn-soft ${gender === "male" ? "active" : ""}`}
                            onClick={() => handleSelectGender("male")}
                        >
                            남자
                        </button>
                        <button
                            type="button"
                            className={`btn btn-soft ${gender === "female" ? "active" : ""}`}
                            onClick={() => handleSelectGender("female")}
                        >
                            여자
                        </button>
                    </div>

                    {/* 캐릭터 이미지 */}
                    <div className="equip-avatar">
                        <img
                            src={gender === "male" ? "/characters/male.png" : "/characters/female.png"}
                            alt={gender === "male" ? "남자 캐릭터" : "여자 캐릭터"}
                        />
                    </div>

                    {/* 장착 슬롯 */}
                    <div className="equip-slots">
                        {/* 루프: 슬롯 버튼 생성 */}
                        {SLOT_KEYS.map(slotKey => {
                            const equippedItem = getItemById(equippedBySlot[slotKey]);
                            const isSelected = slotKey === selectedSlot;

                            return (
                                <button
                                    key={slotKey}
                                    type="button"
                                    className={`equip-slot ${isSelected ? "selected" : ""}`}
                                    onClick={() => handleSelectSlot(slotKey)}
                                >
                                    <div className="equip-slot-top">
                                        <span className="equip-slot-name">{slotKey}</span>
                                        {/* 조건문: 장착 아이템이 있으면 해제 버튼 표시 */}
                                        {equippedItem && (
                                            <span
                                                className="equip-slot-unequip"
                                                onClick={(e) => {
                                                    // 조건문: 버튼 클릭 버블링 방지(슬롯 선택과 분리)
                                                    e.stopPropagation();
                                                    handleUnequipSlot(slotKey);
                                                }}
                                                role="button"
                                                tabIndex={0}
                                            >
                                                해제
                                            </span>
                                        )}
                                    </div>
                                    <div className="equip-slot-item">
                                        {equippedItem ? equippedItem.name : "비어있음"}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </section>

                {/* 우측: 능력치 + 아이템 리스트 */}
                <section className="equip-right">
                    {/* 레벨 입력: 기본 능력치 위로 이동 */}
                    <section className="equip-card equip-level-card">
                        <div className="equip-card-header">
                            <h3>레벨</h3>
                            <span className="equip-badge">입력</span>
                        </div>

                        <div className="equip-level-row">
                            <label className="equip-level">
                                <span className="equip-level-label">캐릭터 레벨</span>
                                <input
                                    className="equip-level-input"
                                    type="text"
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    value={characterLevelInput}
                                    onChange={(e) => handleChangeCharacterLevel(e.target.value)}
                                    onKeyDown={(e) => {
                                        // 조건문: Enter를 누르면 레벨 입력 확정
                                        if (e.key === "Enter") {
                                            e.currentTarget.blur();
                                        }
                                    }}
                                    onBlur={commitCharacterLevelInput}
                                />
                            </label>
                            <div className="equip-level-hint">1 ~ 200</div>
                        </div>
                    </section>

                    {/* 기본 능력치 */}
                    <section className="equip-card">
                        <div className="equip-card-header">
                            <h3>기본 능력치</h3>
                            {/* 남는 스텟 표시(레벨당 5씩 증가, 찍을 때마다 1씩 감소) */}
                            <span className="equip-badge">남는 스텟: {remainingStatPoints}</span>
                        </div>

                        <div className="equip-base-stats">
                            {/* 루프: 능력치 입력 생성 */}
                            {BASE_STAT_KEYS.map(statName => (
                                <label key={statName} className="equip-stat-input">
                                    <span className="equip-stat-label">{statName}</span>

                                    {/* 스텟 찍기 UI: - / 값 / + */}
                                    <div className="equip-stat-stepper">
                                        <button
                                            type="button"
                                            className="btn btn-outline equip-step-btn"
                                            onClick={() => handleDecreaseBaseStat(statName)}
                                            disabled={baseStats[statName] <= MIN_BASE_STAT}
                                        >
                                            -
                                        </button>

                                        <input
                                            className="equip-stat-field"
                                            type="number"
                                            value={baseStatInputs?.[statName] ?? String(baseStats[statName])}
                                            onChange={(e) => handleChangeBaseStatInput(statName, e.target.value)}
                                            onBlur={() => commitBaseStatInput(statName)}
                                            onKeyDown={(e) => {
                                                // 조건문: Enter를 누르면 입력 확정
                                                if (e.key === "Enter") {
                                                    e.currentTarget.blur();
                                                }
                                            }}
                                        />

                                        <button
                                            type="button"
                                            className="btn btn-outline equip-step-btn"
                                            onClick={() => handleIncreaseBaseStat(statName)}
                                            disabled={remainingStatPoints <= 0}
                                        >
                                            +
                                        </button>
                                    </div>
                                </label>
                            ))}
                        </div>
                    </section>

                    {/* 아이템 목록(선택 슬롯 기준) */}
                    <section className="equip-card">
                        <div className="equip-card-header">
                            <h3>아이템 목록</h3>
                            <span className="equip-badge">{selectedSlot}</span>
                        </div>

                        {/* 아이템 선택 팝업 열기 버튼 */}
                        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 10 }}>
                            <button
                                type="button"
                                className="btn btn-outline"
                                onClick={() => setItemModalOpen(true)}
                            >
                                팝업으로 검색
                            </button>
                        </div>

                        <div className="equip-inventory">
                            {/* 조건문: 아이템이 없으면 안내 */}
                            {filteredInventoryItems.length === 0 ? (
                                <div className="equip-empty">해당 슬롯에 장착 가능한 아이템이 없습니다.</div>
                            ) : (
                                // 루프: 아이템 버튼 생성
                                filteredInventoryItems.map(item => {
                                    const isSelectedItem = item.id === selectedItemId;
                                    return (
                                        <button
                                            key={item.id}
                                            type="button"
                                            className={`equip-item ${isSelectedItem ? "selected" : ""}`}
                                            onClick={() => handleSelectItem(item.id)}
                                        >
                                            <div className="equip-item-name">{item.name}</div>
                                            <div className="equip-item-meta">{item.slot}</div>
                                        </button>
                                    );
                                })
                            )}
                        </div>

                        <div className="equip-actions">
                            <button
                                type="button"
                                className="btn btn-primary"
                                onClick={handleEquipSelectedItem}
                                disabled={!selectedItem || selectedItem?.slot !== selectedSlot}
                            >
                                장착
                            </button>
                            <div className="equip-hint">
                                {/* 조건문: 선택 아이템이 없을 때 안내 */}
                                {!selectedItem ? "아이템을 선택하세요." : "선택한 아이템을 현재 슬롯에 장착합니다."}
                            </div>
                        </div>
                    </section>

                    {/* 능력치 합계 */}
                    <section className="equip-card">
                        <div className="equip-card-header">
                            <h3>총 능력치</h3>
                            <span className="equip-badge">합산</span>
                        </div>

                        <div className="equip-stats">
                            {/* 조건문: 합산할 스탯이 없으면 안내 */}
                            {Object.keys(totalStats).length === 0 ? (
                                <div className="equip-empty">능력치가 없습니다.</div>
                            ) : (
                                // 루프: 합산 스탯 표시
                                Object.entries(totalStats).map(([name, value]) => (
                                    <div key={name} className="equip-stat">
                                        <span className="equip-stat-name">{name}</span>
                                        <span className="equip-stat-value">+{value}</span>
                                    </div>
                                ))
                            )}
                        </div>
                    </section>

                    {/* 스킬 트리: 총 능력치 아래로 이동 */}
                    <section className="equip-skilltree">
                        <div className="equip-skilltree-header">
                            <div>
                                <div className="equip-skilltree-title">스킬 트리</div>
                                <div className="equip-skilltree-desc">
                                    스킬을 클릭하면 레벨이 올라갑니다. (내리기는 “-” 버튼)
                                </div>
                            </div>

                            <div className="equip-skilltree-meta">
                                <span className="equip-skilltree-points">남은 포인트: {skillPoints}</span>
                                <button type="button" className="btn btn-outline" onClick={handleResetSkills}>
                                    초기화
                                </button>
                            </div>
                        </div>

                        <div className="equip-skilltree-grid">
                            {/* 루프: 카테고리 섹션 생성 */}
                            {Object.entries(skillTree).map(([categoryName, list]) => (
                                <div key={categoryName} className="equip-skilltree-card">
                                    <div className="equip-skilltree-card-title">{categoryName}</div>

                                    <div className="equip-skilltree-nodes">
                                        {/* 루프: 스킬 노드 생성 */}
                                        {(list || []).map(skill => (
                                            <div key={skill.id} className="equip-skill-node">
                                                <button
                                                    type="button"
                                                    className="equip-skill-node-main"
                                                    onClick={() => handleIncreaseSkillLevel(categoryName, skill.id)}
                                                    disabled={skillPoints <= 0 || skill.level >= skill.maxLevel}
                                                    title={skill.desc}
                                                >
                                                    <div className="equip-skill-name">{skill.name}</div>
                                                    <div className="equip-skill-level">
                                                        Lv. {skill.level} / {skill.maxLevel}
                                                    </div>
                                                </button>

                                                <div className="equip-skill-node-actions">
                                                    <button
                                                        type="button"
                                                        className="btn btn-outline"
                                                        onClick={() => handleDecreaseSkillLevel(categoryName, skill.id)}
                                                        disabled={skill.level <= 0}
                                                    >
                                                        -
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="btn btn-outline"
                                                        onClick={() => handleIncreaseSkillLevel(categoryName, skill.id)}
                                                        disabled={skillPoints <= 0 || skill.level >= skill.maxLevel}
                                                    >
                                                        +
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                </section>
            </div>
        </div>
    );
}


