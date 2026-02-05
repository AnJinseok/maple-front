import { useWorld } from "../contexts/WorldContext";

/**
 * NPC 정보 페이지(초기 화면/placeholder)
 * - 입력: 없음
 * - 출력: JSX(Element)
 */
export default function NpcList() {
    const { world } = useWorld();

    return (
        <div>
            <h2>NPC</h2>
            <p>선택된 월드: {world}</p>
            <p>여기에 NPC 목록/검색/상세 화면을 추가할 예정입니다.</p>
        </div>
    );
}

