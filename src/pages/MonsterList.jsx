import { useWorld } from "../contexts/WorldContext";

/**
 * 몬스터 정보 페이지(초기 화면/placeholder)
 * - 입력: 없음
 * - 출력: JSX(Element)
 */
export default function MonsterList() {
    const { world } = useWorld();

    return (
        <div>
            <h2>몬스터</h2>
            <p>선택된 월드: {world}</p>
            <p>여기에 몬스터 목록/검색/상세 화면을 추가할 예정입니다.</p>
        </div>
    );
}

