import { fetchItems } from "../api/mapleApi";
import { useFetch } from "../hooks/useFetch";
import { useWorld } from "../contexts/WorldContext";

/**
 * 아이템 목록 페이지
 * - 입력: 없음
 * - 출력: JSX(Element)
 */
export default function ItemList() {
    const { world } = useWorld();
    const { data, loading, error } = useFetch(
        () => fetchItems({ page: 1, size: 20, world: world || undefined }),
        [world]
    );

    if (loading) return <div>Loading...</div>;
    if (error) return <div>Error occurred</div>;

    // 조건문: data가 아직 없으면 안전하게 빈 화면 처리
    if (!data) return <div />;

    return (
        <div className="item-list">
            {/* 조건문: items가 배열이 아니면 빈 배열로 처리 */}
            {(Array.isArray(data.items) ? data.items : []).map(item => (
                <div key={item.id} className="item-card">
                    <h3>{item.name}</h3>
                    <p>{item.price}</p>
                </div>
            ))}
        </div>
    );
}
