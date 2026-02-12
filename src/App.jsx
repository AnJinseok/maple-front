import { BrowserRouter, Routes, Route } from "react-router-dom";
import MainLayout from "./components/layout/MainLayout";
import Home from "./pages/Home";
import ItemList from "./pages/ItemList";
import ShoutList from "./pages/ShoutList";
import EquipStats from "./pages/EquipStats";
import ChronoStoryMagicAccuracy from "./pages/ChronoStoryMagicAccuracy";
import MapList from "./pages/MapList";
import MonsterList from "./pages/MonsterList";
import QuestList from "./pages/QuestList";
import { WorldProvider } from "./contexts/WorldContext";
import { DisplayProvider } from "./contexts/DisplayContext";

/**
 * 앱 라우팅 엔트리
 * - 입력: 없음
 * - 출력: JSX(Element)
 */
export default function App() {
    return (
        <DisplayProvider>
            <WorldProvider>
                <BrowserRouter>
                    <MainLayout>
                        <Routes>
                            <Route path="/" element={<Home />} />
                            <Route path="/items" element={<ItemList />} />
                            <Route path="/shout" element={<ShoutList />} />
                            {/* 아이템 능력치 장착 화면 라우트 */}
                            <Route path="/equip-stats" element={<EquipStats />} />
                            {/* 크로노스토리 전용: 마법 명중률 계산기 */}
                            <Route path="/chronostory/magic-accuracy" element={<ChronoStoryMagicAccuracy />} />
                            {/* 월드 공통: 맵/NPC 정보 */}
                            <Route path="/maps" element={<MapList />} />
                            {/* 몬스터 전용 페이지 */}
                            <Route path="/monsters" element={<MonsterList />} />
                            {/* 크로노스토리 퀘스트 DB */}
                            <Route path="/quests" element={<QuestList />} />
                        </Routes>
                    </MainLayout>
                </BrowserRouter>
            </WorldProvider>
        </DisplayProvider>
    );
}
