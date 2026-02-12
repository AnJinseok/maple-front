import { useCallback, useEffect, useMemo, useState } from "react";
import MonsterSelectModal from "../components/common/MonsterSelectModal";
import {
    getChronostoryUserStatLatest,
    saveChronostoryUserStat
} from "../api/mapleApi";

/**
 * floor(x): x 이하 최대 정수 (내림)
 * @param {number} x
 * @returns {number}
 */
function floor(x) {
    return Math.floor(Number(x) || 0);
}

/**
 * 마법 명중률 계산 (크로노스토리 공식)
 * Mage Acc = floor(INT/10) + floor(LUK/10) + floor(BonusAcc/5)
 * ReqAcc = (MonsterAvoid + 1) * (1 + 0.0415 * D), D = max(0, 몬스터레벨 - 플레이어레벨)
 * MageAcc >= ReqAcc → 100%, else hitrate% = -2.5795x² + 5.2343x - 1.6749 (x = MageAcc/ReqAcc)
 * @param {Object} params - { int, luk, bonusAcc, monsterAvoid, playerLevel, monsterLevel }
 * @returns {{ mageAcc: number, reqAcc: number, x: number, hitRatePercent: number }}
 */
function calcMagicAccuracy({ int, luk, bonusAcc, monsterAvoid, playerLevel, monsterLevel }) {
    const i = Number(int) || 0;
    const l = Number(luk) || 0;
    const b = Number(bonusAcc) || 0;
    const avoid = Number(monsterAvoid) || 0;
    const pLv = Number(playerLevel) || 0;
    const mLv = Number(monsterLevel) || 0;

    const mageAcc = floor(i / 10) + floor(l / 10) + floor(b / 5);
    const D = Math.max(0, mLv - pLv);
    const reqAcc = (avoid + 1) * (1 + 0.0415 * D);

    if (reqAcc <= 0) {
        return { mageAcc, reqAcc: 0, x: 1, hitRatePercent: 100 };
    }
    if (mageAcc >= reqAcc) {
        return { mageAcc, reqAcc, x: 1, hitRatePercent: 100 };
    }
    const x = mageAcc / reqAcc;
    const raw = -2.5795 * x * x + 5.2343 * x - 1.6749;
    const hitRatePercent = Math.max(0, Math.min(100, Math.round(raw * 100 * 10) / 10));
    return { mageAcc, reqAcc, x, hitRatePercent };
}

/**
 * 크로노스토리 전용 마법 명중률 계산기 페이지
 * - 입력: 없음 (React 페이지 컴포넌트)
 * - 출력: JSX(Element)
 */
/** 폼 기본값 (기본값 프리셋용) */
const DEFAULT_FORM = {
    int: 100,
    str: 4,
    dex: 4,
    luk: 50,
    bonusAcc: 0,
    monsterAvoid: 20,
    playerLevel: 100,
    monsterLevel: 100,
    selectedMonsterName: ""
};

export default function ChronoStoryMagicAccuracy() {
    const [int, setInt] = useState(DEFAULT_FORM.int);
    const [str, setStr] = useState(DEFAULT_FORM.str);
    const [dex, setDex] = useState(DEFAULT_FORM.dex);
    const [luk, setLuk] = useState(DEFAULT_FORM.luk);
    const [bonusAcc, setBonusAcc] = useState(DEFAULT_FORM.bonusAcc);
    const [monsterAvoid, setMonsterAvoid] = useState(DEFAULT_FORM.monsterAvoid);
    const [playerLevel, setPlayerLevel] = useState(DEFAULT_FORM.playerLevel);
    const [monsterLevel, setMonsterLevel] = useState(DEFAULT_FORM.monsterLevel);
    const [monsterModalOpen, setMonsterModalOpen] = useState(false);
    const [selectedMonsterName, setSelectedMonsterName] = useState(DEFAULT_FORM.selectedMonsterName);
    const [saveLoading, setSaveLoading] = useState(false);
    const [saveMessage, setSaveMessage] = useState("");

    /** 프리셋: "default" = 기본값, "currentIp" = 현재 IP로 저장된 설정 */
    const [presetSource, setPresetSource] = useState("default");
    /** 현재 IP로 저장된 능력치 1건 (조회 성공 시만 존재, select "현재 IP" 복원용) */
    const [savedCurrentIpStat, setSavedCurrentIpStat] = useState(null);

    // 현재 IP로 저장된 최신 능력치 조회 → 있으면 "현재 IP" 선택 및 폼 채움, 없으면 기본값 유지
    useEffect(() => {
        getChronostoryUserStatLatest()
            .then((res) => {
                const d = res?.data ?? res;
                if (d && typeof d === "object" && (d.intValue != null || d.playerLevel != null)) {
                    setSavedCurrentIpStat(d);
                    setPresetSource("currentIp");
                    if (d.intValue != null) setInt(Number(d.intValue));
                    if (d.str != null) setStr(Number(d.str));
                    if (d.dex != null) setDex(Number(d.dex));
                    if (d.luk != null) setLuk(Number(d.luk));
                    if (d.bonusAcc != null) setBonusAcc(Number(d.bonusAcc));
                    if (d.playerLevel != null) setPlayerLevel(Math.max(1, Number(d.playerLevel)));
                    if (d.monsterAvoid != null) setMonsterAvoid(Number(d.monsterAvoid));
                    if (d.monsterLevel != null) setMonsterLevel(Math.max(1, Number(d.monsterLevel)));
                    if (d.monsterNameKr != null) setSelectedMonsterName(String(d.monsterNameKr));
                }
                // 저장된 값 없으면 presetSource·폼 모두 기본값 유지
            })
            .catch(() => {});
    }, []);

    /** 프리셋 선택 변경: 기본값이면 폼 초기화, 현재 IP면 저장된 값으로 복원 */
    const handlePresetChange = useCallback((e) => {
        const value = e?.target?.value;
        if (value === "default") {
            setPresetSource("default");
            setInt(DEFAULT_FORM.int);
            setStr(DEFAULT_FORM.str);
            setDex(DEFAULT_FORM.dex);
            setLuk(DEFAULT_FORM.luk);
            setBonusAcc(DEFAULT_FORM.bonusAcc);
            setMonsterAvoid(DEFAULT_FORM.monsterAvoid);
            setPlayerLevel(DEFAULT_FORM.playerLevel);
            setMonsterLevel(DEFAULT_FORM.monsterLevel);
            setSelectedMonsterName(DEFAULT_FORM.selectedMonsterName);
            return;
        }
        if (value === "currentIp" && savedCurrentIpStat) {
            setPresetSource("currentIp");
            if (savedCurrentIpStat.intValue != null) setInt(Number(savedCurrentIpStat.intValue));
            if (savedCurrentIpStat.str != null) setStr(Number(savedCurrentIpStat.str));
            if (savedCurrentIpStat.dex != null) setDex(Number(savedCurrentIpStat.dex));
            if (savedCurrentIpStat.luk != null) setLuk(Number(savedCurrentIpStat.luk));
            if (savedCurrentIpStat.bonusAcc != null) setBonusAcc(Number(savedCurrentIpStat.bonusAcc));
            if (savedCurrentIpStat.playerLevel != null) setPlayerLevel(Math.max(1, Number(savedCurrentIpStat.playerLevel)));
            if (savedCurrentIpStat.monsterAvoid != null) setMonsterAvoid(Number(savedCurrentIpStat.monsterAvoid));
            if (savedCurrentIpStat.monsterLevel != null) setMonsterLevel(Math.max(1, Number(savedCurrentIpStat.monsterLevel)));
            if (savedCurrentIpStat.monsterNameKr != null) setSelectedMonsterName(String(savedCurrentIpStat.monsterNameKr));
        }
    }, [savedCurrentIpStat]);

    /** 현재 입력값을 공인 IP 기준으로 저장 */
    const handleSave = useCallback(() => {
        setSaveMessage("");
        setSaveLoading(true);
        saveChronostoryUserStat({
            intValue: int,
            str,
            dex,
            luk,
            bonusAcc,
            playerLevel,
            monsterAvoid,
            monsterLevel,
            monsterNameKr: selectedMonsterName || null
        })
            .then((res) => {
                const d = res?.data ?? res;
                setSaveMessage(d?.id ? "저장되었습니다." : "저장 완료.");
                if (d) {
                    setSavedCurrentIpStat({
                        intValue: int,
                        str,
                        dex,
                        luk,
                        bonusAcc,
                        playerLevel,
                        monsterAvoid,
                        monsterLevel,
                        monsterNameKr: selectedMonsterName || null
                    });
                    setPresetSource("currentIp");
                }
            })
            .catch((err) => {
                setSaveMessage(err?.message || "저장에 실패했습니다.");
            })
            .finally(() => setSaveLoading(false));
    }, [int, str, dex, luk, bonusAcc, playerLevel, monsterAvoid, monsterLevel, selectedMonsterName]);

    const result = useMemo(
        () =>
            calcMagicAccuracy({
                int,
                luk,
                bonusAcc,
                monsterAvoid,
                playerLevel,
                monsterLevel
            }),
        [int, luk, bonusAcc, monsterAvoid, playerLevel, monsterLevel]
    );

    return (
        <div className="map-page">
            <div className="map-header">
                <h2>마법 명중률 (크로노스토리)</h2>
                <p className="map-subtitle">
                    크로노스토리 서버의 마법 명중률 공식으로 계산합니다. 플레이어 스탯과 몬스터 정보를 입력하면 예상 명중률을 확인할 수 있습니다.
                </p>
            </div>

            {/* 계산기 입력/결과 카드 */}
            <section className="map-card magic-accuracy-card">
                <div className="map-card-header">
                    <h3>명중률 계산</h3>
                </div>
                <div className="map-card-body">
                    <div className="magic-accuracy-preset-wrap" style={{ marginBottom: "16px" }}>
                        <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px" }}>
                            <span>설정 불러오기</span>
                            <select
                                value={presetSource}
                                onChange={handlePresetChange}
                                style={{ padding: "6px 10px", borderRadius: "6px", border: "1px solid var(--app-border)", minWidth: "200px" }}
                            >
                                <option value="default">기본값</option>
                                {savedCurrentIpStat != null && (
                                    <option value="currentIp">현재 IP (저장된 설정)</option>
                                )}
                            </select>
                        </label>
                    </div>
                    <div className="magic-accuracy-grid">
                        {/* 플레이어 스탯 */}
                        <div className="magic-accuracy-section">
                            <h4>플레이어 스탯</h4>
                            <div className="magic-accuracy-inputs">
                                <label>
                                    <span>INT (지력)</span>
                                    <input
                                        type="number"
                                        min={0}
                                        value={int}
                                        onChange={(e) => setInt(parseInt(e.target.value.replace(/[^0-9]/g, ""), 10) || 0)}
                                    />
                                </label>
                                <label>
                                    <span>STR (힘)</span>
                                    <input
                                        type="number"
                                        min={0}
                                        value={str}
                                        onChange={(e) => setStr(parseInt(e.target.value.replace(/[^0-9]/g, ""), 10) || 0)}
                                    />
                                </label>
                                <label>
                                    <span>DEX (민첩)</span>
                                    <input
                                        type="number"
                                        min={0}
                                        value={dex}
                                        onChange={(e) => setDex(parseInt(e.target.value.replace(/[^0-9]/g, ""), 10) || 0)}
                                    />
                                </label>
                                <label>
                                    <span>LUK (럭)</span>
                                    <input
                                        type="number"
                                        min={0}
                                        value={luk}
                                        onChange={(e) => setLuk(parseInt(e.target.value.replace(/[^0-9]/g, ""), 10) || 0)}
                                    />
                                </label>
                                <label>
                                    <span>보너스 명중</span>
                                    <input
                                        type="number"
                                        min={0}
                                        value={bonusAcc}
                                        onChange={(e) => setBonusAcc(parseInt(e.target.value.replace(/[^0-9]/g, ""), 10) || 0)}
                                    />
                                </label>
                                <label>
                                    <span>플레이어 레벨</span>
                                    <input
                                        type="number"
                                        min={1}
                                        value={playerLevel}
                                        onChange={(e) => setPlayerLevel(Math.max(1, parseInt(e.target.value.replace(/[^0-9]/g, ""), 10) || 1))}
                                    />
                                </label>
                            </div>
                        </div>
                        {/* 몬스터 정보 */}
                        <div className="magic-accuracy-section">
                            <h4>몬스터 정보</h4>
                            <div className="magic-accuracy-inputs">
                                <label>
                                    <span>몬스터 회피 (Avoid)</span>
                                    <input
                                        type="number"
                                        min={0}
                                        value={monsterAvoid}
                                        onChange={(e) => setMonsterAvoid(parseInt(e.target.value.replace(/[^0-9]/g, ""), 10) || 0)}
                                    />
                                </label>
                                <label>
                                    <span>몬스터 레벨</span>
                                    <input
                                        type="number"
                                        min={1}
                                        value={monsterLevel}
                                        onChange={(e) => setMonsterLevel(Math.max(1, parseInt(e.target.value.replace(/[^0-9]/g, ""), 10) || 1))}
                                    />
                                </label>
                                <div className="magic-accuracy-monster-search-wrap">
                                    <button
                                        type="button"
                                        className="btn btn-primary"
                                        onClick={() => setMonsterModalOpen(true)}
                                    >
                                        몬스터 검색
                                    </button>
                                    {selectedMonsterName && (
                                        <span className="magic-accuracy-selected-monster">
                                            선택: {selectedMonsterName}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 결과 */}
                    <div className="magic-accuracy-result">
                        <h4>계산 결과</h4>
                        <ul className="magic-accuracy-stats">
                            <li>
                                <strong>Mage Acc</strong> = floor(INT/10) + floor(LUK/10) + floor(보너스명중/5) ={" "}
                                <strong>{result.mageAcc}</strong>
                            </li>
                            <li>
                                <strong>Req Acc</strong> = (몬스터 회피 + 1) × (1 + 0.0415 × D) ={" "}
                                <strong>{result.reqAcc.toFixed(2)}</strong>
                            </li>
                            {result.mageAcc < result.reqAcc && (
                                <li>
                                    <strong>x</strong> = Mage Acc / Req Acc = <strong>{result.x.toFixed(4)}</strong>
                                </li>
                            )}
                            <li className="magic-accuracy-hitrate">
                                예상 명중률: <strong>{result.hitRatePercent}%</strong>
                            </li>
                        </ul>
                    </div>
                    <div className="magic-accuracy-save-wrap">
                        <button
                            type="button"
                            className="btn btn-primary"
                            onClick={handleSave}
                            disabled={saveLoading}
                        >
                            {saveLoading ? "저장 중..." : "저장"}
                        </button>
                        {saveMessage && (
                            <span className="magic-accuracy-save-message">{saveMessage}</span>
                        )}
                    </div>
                </div>
            </section>

            {/* 몬스터 검색 모달 */}
            <MonsterSelectModal
                open={monsterModalOpen}
                onClose={() => setMonsterModalOpen(false)}
                onSelect={({ level, eva, nameKr, nameEn }) => {
                    setMonsterLevel(level ?? 1);
                    setMonsterAvoid(eva ?? 0);
                    setSelectedMonsterName(nameKr || nameEn || "");
                }}
            />

            {/* 공식 설명 카드 */}
            <section className="map-card magic-accuracy-card">
                <div className="map-card-header">
                    <h3>공식 설명</h3>
                </div>
                <div className="map-card-body">
                    <div className="magic-accuracy-formula-doc">
                        <p>
                            <strong>floor(x)</strong> = x를 내림 [예: floor(4.9) = 4]
                        </p>
                        <p>
                            <strong>Mage Acc</strong> = floor(INT/10) + floor(LUK/10) + floor(보너스명중/5)
                            <br />
                            <span className="muted">※ 원래 마법 명중에는 보너스 명중이 포함되지 않으며, 크로노스토리에서 추가된 옵션입니다.</span>
                        </p>
                        <p>
                            <strong>Req Acc</strong> (필요 명중) = (몬스터 회피 + 1) × (1 + 0.0415 × D)
                            <br />
                            <span className="muted">D = 몬스터 레벨 − 플레이어 레벨 (공격자가 더 높으면 D = 0)</span>
                        </p>
                        <p>
                            <strong>Mage Acc ≥ Req Acc</strong> → 명중률 <strong>100%</strong>
                        </p>
                        <p>
                            그렇지 않으면: x = Mage Acc / Req Acc,
                            <br />
                            <strong>명중률(%)</strong> = −2.5795x² + 5.2343x − 1.6749
                        </p>
                    </div>
                </div>
            </section>
        </div>
    );
}
