import { useState, useMemo, useCallback } from "react";

/**
 * 랜덤 장비 스탯 시뮬레이션 공식 설명 + 레벨/기본스탯 입력·범위 계산·시뮬레이션
 * - 입력: 없음 (React 페이지 컴포넌트)
 * - 출력: JSX(Element)
 */
export default function RandomEquipmentStats() {
    /** 장비 레벨 제한 (입력) */
    const [reqLv, setReqLv] = useState(60);
    /** 메인 스탯 개수: 2 = DEX/LUK만, 4 = STR/DEX/INT/LUK 균등 분배 */
    const [mainStatCount, setMainStatCount] = useState(2);
    /** 기본 스탯 (선택 입력, 시뮬레이션용) — 스탯별로 있음 */
    const [baseStats, setBaseStats] = useState({
        str: 0, dex: 1, int: 0, luk: 3,
        watk: 0, matk: 0, acc: 0, avoid: 0,
        hp: 0, mp: 0, wdef: 39, mdef: 0,
        speed: 0, jump: 0
    });
    /** 시뮬레이션 1회 결과 (ROLL, RNG 적용) */
    const [simResult, setSimResult] = useState(null);

    /** 기본 스탯 한 필드만 변경 */
    const setBaseStat = useCallback((key, value) => {
        setBaseStats((prev) => ({ ...prev, [key]: parseInt(String(value), 10) || 0 }));
    }, []);

    /** 범위 = 레벨 제한 / 10 (공식) */
    const range = useMemo(() => {
        const lv = Number(reqLv) || 0;
        return lv <= 0 ? 0 : lv / 10;
    }, [reqLv]);

    /** 스탯별 변동량 (범위 기준, 반올림 전 소수 가능) */
    const deltas = useMemo(() => {
        const mainPerStat = mainStatCount > 0 ? range / mainStatCount : 0;
        return {
            mainPerStat,           // STR/DEX/INT/LUK 각각
            watkMatk: range * 0.5,
            accAvoid: range,
            speed: range * 0.5,
            jump: range * 0.25,
            hpMpWdefMdef: range * 5
        };
    }, [range, mainStatCount]);

    /** 시뮬레이션 1회: ROLL(-1,0,1), RNG(0~1) 적용 후 반올림 — 모든 스탯에 동일 ROLL/RNG 1회 적용 */
    const runSimulation = useCallback(() => {
        const rollValues = [-1, 0, 1];
        const roll = rollValues[Math.floor(Math.random() * 3)];
        const rng = Math.floor(Math.random() * 1000000 + 1) / 1000000;

        const mainDelta = mainStatCount > 0 ? (range / mainStatCount) * roll * rng : 0;
        const watkMatkDelta = range * 0.5 * roll * rng;
        const accAvoidDelta = range * roll * rng;
        const speedDelta = range * 0.5 * roll * rng;
        const jumpDelta = range * 0.25 * roll * rng;
        const hpMpWdefMdefDelta = range * 5 * roll * rng;

        setSimResult({
            roll,
            rng,
            str: Math.round(baseStats.str + mainDelta),
            dex: Math.round(baseStats.dex + mainDelta),
            int: Math.round(baseStats.int + mainDelta),
            luk: Math.round(baseStats.luk + mainDelta),
            watk: Math.round(baseStats.watk + watkMatkDelta),
            matk: Math.round(baseStats.matk + watkMatkDelta),
            acc: Math.round(baseStats.acc + accAvoidDelta),
            avoid: Math.round(baseStats.avoid + accAvoidDelta),
            hp: Math.round(baseStats.hp + hpMpWdefMdefDelta),
            mp: Math.round(baseStats.mp + hpMpWdefMdefDelta),
            wdef: Math.round(baseStats.wdef + hpMpWdefMdefDelta),
            mdef: Math.round(baseStats.mdef + hpMpWdefMdefDelta),
            speed: Math.round(baseStats.speed + speedDelta),
            jump: Math.round(baseStats.jump + jumpDelta)
        });
    }, [range, mainStatCount, baseStats]);

    return (
        <div className="map-page">
            <div className="map-header">
                <h2>랜덤 장비 스탯 시뮬레이션</h2>
                <p className="map-subtitle">
                    장비의 랜덤 스탯은 해당 장비의 레벨 제한으로 결정됩니다. 레벨을 입력하면 범위와 스탯별 변동량을 계산하고, 기본 스탯을 넣으면 시뮬레이션을 돌릴 수 있습니다.
                </p>
            </div>

            {/* 입력 + 범위 계산 카드 */}
            <section className="map-card magic-accuracy-card">
                <div className="map-card-header">
                    <h3>범위 계산</h3>
                </div>
                <div className="map-card-body">
                    <div className="magic-accuracy-formula-doc">
                        <p><strong>최소/최대 범위 = 레벨 제한 ÷ 10</strong></p>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "16px", alignItems: "center", marginTop: "12px" }}>
                            <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px" }}>
                                <span>레벨 제한</span>
                                <input
                                    type="number"
                                    min={1}
                                    max={200}
                                    value={reqLv}
                                    onChange={(e) => setReqLv(Math.max(1, parseInt(e.target.value, 10) || 1))}
                                    style={{ width: "72px", padding: "6px 8px", borderRadius: "6px", border: "1px solid var(--app-border)" }}
                                />
                            </label>
                            <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px" }}>
                                <span>메인 스탯 개수</span>
                                <select
                                    value={mainStatCount}
                                    onChange={(e) => setMainStatCount(Number(e.target.value))}
                                    style={{ padding: "6px 8px", borderRadius: "6px", border: "1px solid var(--app-border)" }}
                                >
                                    <option value={2}>2 (예: DEX, LUK)</option>
                                    <option value={4}>4 (STR, DEX, INT, LUK)</option>
                                </select>
                            </label>
                        </div>
                        {range > 0 && (
                            <p style={{ marginTop: "12px" }}>
                                <strong>범위(RANGE)</strong> = {reqLv} ÷ 10 = <strong>{range}</strong>
                            </p>
                        )}
                    </div>
                </div>
            </section>

            {/* 스탯별 변동량 표시 */}
            {range > 0 && (
                <section className="map-card magic-accuracy-card">
                    <div className="map-card-header">
                        <h3>스탯별 변동량 (이 범위 기준)</h3>
                    </div>
                    <div className="map-card-body">
                        <div className="magic-accuracy-formula-doc random-equip-stats-grid">
                            <p><strong>STR, DEX, INT, LUK</strong> (메인 {mainStatCount}개) = ±<strong>{deltas.mainPerStat.toFixed(2)}</strong> (범위÷{mainStatCount})</p>
                            <p><strong>WATK, MATK</strong> = ±<strong>{(deltas.watkMatk).toFixed(2)}</strong> (범위×1/2)</p>
                            <p><strong>ACC, AVOID</strong> = ±<strong>{(deltas.accAvoid).toFixed(2)}</strong> (범위 그대로)</p>
                            <p><strong>Speed</strong> = ±<strong>{(deltas.speed).toFixed(2)}</strong> (범위×1/2)</p>
                            <p><strong>Jump</strong> = ±<strong>{(deltas.jump).toFixed(2)}</strong> (범위×1/4)</p>
                            <p><strong>HP, MP, WDEF, MDEF</strong> = ±<strong>{(deltas.hpMpWdefMdef).toFixed(2)}</strong> (범위×5)</p>
                        </div>
                    </div>
                </section>
            )}

            {/* 기본 스탯 입력 + 시뮬레이션 (스탯별 전부) */}
            <section className="map-card magic-accuracy-card">
                <div className="map-card-header">
                    <h3>시뮬레이션 (1회)</h3>
                </div>
                <div className="map-card-body">
                    <div className="magic-accuracy-formula-doc">
                        <p className="muted">기본 스탯을 넣고 버튼을 누르면 ROLL(-1, 0, 1)과 RNG를 한 번 적용한 결과를 모든 스탯에 보여줍니다.</p>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))", gap: "8px 16px", marginTop: "12px", maxWidth: "560px" }}>
                            {[
                                ["str", "STR"], ["dex", "DEX"], ["int", "INT"], ["luk", "LUK"],
                                ["watk", "WATK"], ["matk", "MATK"], ["acc", "ACC"], ["avoid", "AVOID"],
                                ["hp", "HP"], ["mp", "MP"], ["wdef", "WDEF"], ["mdef", "MDEF"],
                                ["speed", "Speed"], ["jump", "Jump"]
                            ].map(([key, label]) => (
                                <label key={key} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px" }}>
                                    <span style={{ minWidth: "44px" }}>{label}</span>
                                    <input
                                        type="number"
                                        min={0}
                                        value={baseStats[key]}
                                        onChange={(e) => setBaseStat(key, e.target.value)}
                                        style={{ width: "52px", padding: "4px 6px", borderRadius: "6px", border: "1px solid var(--app-border)" }}
                                    />
                                </label>
                            ))}
                        </div>
                        <div style={{ marginTop: "12px" }}>
                            <button
                                type="button"
                                className="btn btn-primary"
                                onClick={runSimulation}
                                style={{ padding: "6px 14px" }}
                            >
                                시뮬레이션 1회
                            </button>
                        </div>
                        {simResult && (
                            <div style={{ marginTop: "16px", padding: "12px", background: "var(--app-bg-secondary, #f5f5f5)", borderRadius: "8px", fontSize: "13px" }}>
                                <p style={{ margin: "0 0 10px 0" }}><strong>이번 결과</strong> — ROLL = {simResult.roll}, RNG = {simResult.rng.toFixed(6)}</p>
                                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: "4px 12px" }}>
                                    {[
                                        ["str", "STR"], ["dex", "DEX"], ["int", "INT"], ["luk", "LUK"],
                                        ["watk", "WATK"], ["matk", "MATK"], ["acc", "ACC"], ["avoid", "AVOID"],
                                        ["hp", "HP"], ["mp", "MP"], ["wdef", "WDEF"], ["mdef", "MDEF"],
                                        ["speed", "Speed"], ["jump", "Jump"]
                                    ].map(([key, label]) => {
                                        const base = baseStats[key];
                                        const result = simResult[key];
                                        return (
                                            <span key={key}>{label}: <strong>{result}</strong> {base !== result && `(${base}→${result})`}</span>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* 기존: 스탯별 배율 설명 카드 */}
            <section className="map-card magic-accuracy-card">
                <div className="map-card-header">
                    <h3>스탯별 배율 (참고)</h3>
                </div>
                <div className="map-card-body">
                    <div className="magic-accuracy-formula-doc random-equip-stats-grid">
                        <p><strong>STR, DEX, INT, LUK</strong> = 범위를 스탯에 <strong>균등 분배</strong></p>
                        <p><strong>WATK, MATK</strong> = 범위 × <strong>1/2</strong></p>
                        <p><strong>ACC, AVOID</strong> = 범위 <strong>그대로</strong></p>
                        <p><strong>Speed</strong> = 범위 × <strong>1/2</strong></p>
                        <p><strong>Jump</strong> = 범위 × <strong>1/4</strong></p>
                        <p><strong>HP, MP, WDEF, MDEF</strong> = 범위 × <strong>5</strong></p>
                    </div>
                </div>
            </section>

            {/* 예시: 실버 아이덴티티 */}
            <section className="map-card magic-accuracy-card">
                <div className="map-card-header">
                    <h3>예시: 실버 아이덴티티</h3>
                </div>
                <div className="map-card-body">
                    <div className="magic-accuracy-formula-doc">
                        <p><strong>기본 스탯</strong></p>
                        <ul style={{ margin: "0 0 12px", paddingLeft: "20px" }}>
                            <li>레벨 60</li>
                            <li>DEX: 1</li>
                            <li>LUK: 3</li>
                            <li>WDEF: 39</li>
                        </ul>
                        <p>레벨 60 → 최소/최대 범위 = 60 ÷ 10 = <strong>6</strong></p>
                        <p className="muted" style={{ marginTop: "8px" }}>
                            (RNG) = 1 ~ 1,000,000 사이의 랜덤 정수를 1,000,000으로 나눈 값<br />
                            ROLL(x, y) = x 이상 y 이하(포함)의 랜덤 정수<br />
                            RANGE = 6
                        </p>
                        <p style={{ marginTop: "12px" }}>예: Roll(1, 5) = 1, 2, 3, 4, 5 중 하나</p>
                        <p><strong>DEX</strong> = 1 + (6÷2) × ROLL(-1, 0, 1) × (RNG) — 메인 스탯이 2개라 범위를 2로 나눔 (6÷2 = 3)</p>
                        <p><strong>LUK</strong> = 3 + (6÷2) × ROLL(-1, 0, 1) × (RNG)</p>
                        <p><strong>WDEF</strong> = 39 + 6 × 5 × ROLL(-1, 0, 1) × (RNG)</p>
                    </div>
                </div>
            </section>
        </div>
    );
}
