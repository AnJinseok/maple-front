import { useCallback, useMemo, useRef, useState } from "react";
import pako from "pako";
import { LOCALES, getTranslations } from "../constants/bigAmbitionsSaveEditorTranslations";

/**
 * 문자열을 UTF-16 Little Endian 바이트 배열로 변환
 * @param {string} str - 변환할 문자열
 * @returns {Uint8Array}
 */
function stringToUtf16Le(str) {
    const buf = new ArrayBuffer(str.length * 2);
    const view = new DataView(buf);
    for (let i = 0; i < str.length; i++) {
        view.setUint16(i * 2, str.charCodeAt(i), true);
    }
    return new Uint8Array(buf);
}

/** .hsg 내부 필드명(UTF-16) 패턴 */
const FIELD_MONEY = stringToUtf16Le("Money");
const FIELD_ENERGY = stringToUtf16Le("Energy");
const FIELD_NET_WORTH = stringToUtf16Le("NetWorth");

/**
 * 바이너리에서 UTF-16 필드명 위치를 찾고, 그 뒤 값(float 4바이트) 시작 오프셋 반환
 * @param {Uint8Array} data - 압축 해제된 세이브 바이너리
 * @param {Uint8Array} fieldUtf16 - UTF-16 필드명 바이트
 * @param {number} valueSize - 값 크기(바이트). float=4
 * @returns {number} 값 시작 오프셋. 없으면 -1
 */
function findFieldValueOffset(data, fieldUtf16, valueSize = 4) {
    const len = fieldUtf16.length;
    for (let i = 0; i <= data.length - len - valueSize; i++) {
        let match = true;
        for (let j = 0; j < len; j++) {
            if (data[i + j] !== fieldUtf16[j]) {
                match = false;
                break;
            }
        }
        if (match) return i + len;
    }
    return -1;
}

/**
 * 지정 오프셋에서 little-endian float 4바이트 읽기
 * @param {Uint8Array} data
 * @param {number} offset
 * @returns {number}
 */
function readFloatAt(data, offset) {
    const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
    return view.getFloat32(offset, true);
}

/**
 * 지정 오프셋에 little-endian float 4바이트 쓰기
 * @param {Uint8Array} data - bytearray처럼 수정 가능한 배열
 * @param {number} offset
 * @param {number} value
 */
function writeFloatAt(data, offset, value) {
    const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
    view.setFloat32(offset, value, true);
}

/**
 * .hsg 파일(GZIP 압축)을 압축 해제하여 바이트 반환
 * @param {ArrayBuffer} arrayBuffer - .hsg 파일 내용
 * @returns {Uint8Array}
 */
function decompressSave(arrayBuffer) {
    const compressed = new Uint8Array(arrayBuffer);
    return pako.ungzip(compressed, { to: "uint8array" });
}

/**
 * 바이트를 GZIP 압축하여 Uint8Array 반환
 * @param {Uint8Array} data
 * @returns {Uint8Array}
 */
function compressSave(data) {
    return pako.gzip(data, { to: "uint8array" });
}

/**
 * 수정 없이 현재 세이브의 Money/Energy/NetWorth 값 읽기
 * @param {ArrayBuffer} arrayBuffer - .hsg 파일 내용
 * @returns {{ Money?: number, Energy?: number, NetWorth?: number, error?: string }}
 */
function readCurrentValues(arrayBuffer) {
    try {
        const raw = decompressSave(arrayBuffer);
        const result = {};
        const fields = [
            ["Money", FIELD_MONEY],
            ["Energy", FIELD_ENERGY],
            ["NetWorth", FIELD_NET_WORTH]
        ];
        for (const [name, fieldBytes] of fields) {
            const off = findFieldValueOffset(raw, fieldBytes, 4);
            if (off >= 0) {
                result[name] = readFloatAt(raw, off);
            } else {
                result[name] = null;
            }
        }
        return result;
    } catch (e) {
        return { error: e?.message || String(e) };
    }
}

/**
 * 세이브 바이너리에서 Money/Energy/NetWorth만 수정한 새 바이너리 반환
 * @param {ArrayBuffer} arrayBuffer - 원본 .hsg 파일 내용
 * @param {{ money?: number, energy?: number, netWorth?: number }} values - 변경할 값(없으면 유지)
 * @returns {Uint8Array|null} GZIP 압축된 새 .hsg 내용. 실패 시 null
 */
function editSave(arrayBuffer, values = {}) {
    try {
        const raw = decompressSave(arrayBuffer);
        const data = new Uint8Array(raw);

        if (values.money != null) {
            const off = findFieldValueOffset(data, FIELD_MONEY, 4);
            if (off >= 0) writeFloatAt(data, off, Number(values.money));
        }
        if (values.energy != null) {
            const off = findFieldValueOffset(data, FIELD_ENERGY, 4);
            if (off >= 0) writeFloatAt(data, off, Number(values.energy));
        }
        if (values.netWorth != null) {
            const off = findFieldValueOffset(data, FIELD_NET_WORTH, 4);
            if (off >= 0) writeFloatAt(data, off, Number(values.netWorth));
        }

        return compressSave(data);
    } catch (e) {
        return null;
    }
}

/**
 * Big Ambitions (.hsg) 세이브 에디터 웹 페이지
 * - 입력: 없음 (React 페이지 컴포넌트)
 * - 출력: JSX(Element)
 */
export default function BigAmbitionsSaveEditor() {
    /** 설명/UI 언어 (ko, en, zh, ja, th) */
    const [locale, setLocale] = useState("ko");
    const t = useMemo(() => getTranslations(locale), [locale]);

    const [file, setFile] = useState(null);
    const [fileName, setFileName] = useState("");
    const [buffer, setBuffer] = useState(null);
    const [values, setValues] = useState({ Money: "", Energy: "", NetWorth: "" });
    const [parseError, setParseError] = useState("");
    const [saveMessage, setSaveMessage] = useState("");
    const fileInputRef = useRef(null);

    /** 파일 선택 시: 읽기 및 현재 값 표시 */
    const onFileChange = useCallback((e) => {
        const f = e?.target?.files?.[0];
        setFile(f);
        setSaveMessage("");
        if (!f) {
            setFileName("");
            setBuffer(null);
            setValues({ Money: "", Energy: "", NetWorth: "" });
            setParseError("");
            return;
        }
        setFileName(f.name);
        setParseError("");
        const reader = new FileReader();
        reader.onload = (ev) => {
            const ab = ev?.target?.result;
            if (!(ab instanceof ArrayBuffer)) {
                setParseError(t.errorFileRead);
                return;
            }
            setBuffer(ab);
            const result = readCurrentValues(ab);
            if (result.error) {
                setParseError(result.error);
                setValues({ Money: "", Energy: "", NetWorth: "" });
                return;
            }
            setValues({
                Money: result.Money != null ? String(result.Money) : "",
                Energy: result.Energy != null ? String(result.Energy) : "",
                NetWorth: result.NetWorth != null ? String(result.NetWorth) : ""
            });
        };
        reader.readAsArrayBuffer(f);
    }, [t]);

    /** 다시 읽기: 현재 선택된 파일 버퍼로 값만 갱신 */
    const onReload = useCallback(() => {
        if (!buffer) return;
        const result = readCurrentValues(buffer);
        if (result.error) {
            setParseError(result.error);
            return;
        }
        setParseError("");
        setValues({
            Money: result.Money != null ? String(result.Money) : "",
            Energy: result.Energy != null ? String(result.Energy) : "",
            NetWorth: result.NetWorth != null ? String(result.NetWorth) : ""
        });
        setSaveMessage(t.msgReloaded);
    }, [buffer, t]);

    /** 저장(다운로드): 수정된 .hsg 파일로 다운로드 */
    const onSave = useCallback(() => {
        if (!buffer) {
            setSaveMessage(t.msgSelectFile);
            return;
        }
        const money = values.Money.trim() === "" ? undefined : Number(values.Money);
        const energy = values.Energy.trim() === "" ? undefined : Number(values.Energy);
        const netWorth = values.NetWorth.trim() === "" ? undefined : Number(values.NetWorth);
        if (money === undefined && energy === undefined && netWorth === undefined) {
            setSaveMessage(t.msgEnterValue);
            return;
        }
        const out = editSave(buffer, { money, energy, netWorth });
        if (!out) {
            setSaveMessage(t.msgSaveError);
            return;
        }
        const blob = new Blob([out], { type: "application/octet-stream" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        const baseName = fileName ? fileName.replace(/\.hsg$/i, "") : "";
        a.download = baseName ? `${baseName}_edited.hsg` : "save_edited.hsg";
        a.click();
        URL.revokeObjectURL(url);
        setSaveMessage(t.msgDownloadStarted);
    }, [buffer, fileName, values, t]);

    return (
        <div className="content" style={{ padding: "20px", maxWidth: "700px" }}>
            <div style={{ display: "flex", flexWrap: "nowrap", alignItems: "flex-start", gap: "12px", marginBottom: "12px", minWidth: 0 }}>
                <h2 style={{ marginBottom: 0, flex: "1 1 0", minWidth: 0, wordBreak: "break-word", whiteSpace: "normal" }}>{t.title}</h2>
                <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "var(--app-muted-text-color)", flexShrink: 0 }}>
                    <span style={{ whiteSpace: "nowrap" }}>{t.languageLabel}:</span>
                    <select
                        value={locale}
                        onChange={(e) => setLocale(e.target.value)}
                        style={{ padding: "6px 10px", borderRadius: "6px", border: "1px solid var(--app-border)", background: "var(--app-bg)", fontSize: "13px", minWidth: "0" }}
                    >
                        {LOCALES.map(({ code, label }) => (
                            <option key={code} value={code}>{label}</option>
                        ))}
                    </select>
                </label>
            </div>
            <p style={{ fontSize: "14px", color: "var(--app-muted-text-color)", marginBottom: "20px", whiteSpace: "pre-line" }}>
                {t.description}
            </p>

            {/* 게임 세이브 기본 경로 안내 (문구로 표시) */}
            <div style={{ marginBottom: "20px", padding: "10px 14px", background: "var(--app-bg-secondary, rgba(0,0,0,0.04))", borderRadius: "8px", border: "1px solid var(--app-border, rgba(0,0,0,0.08))" }}>
                <div style={{ fontSize: "12px", fontWeight: 600, marginBottom: "6px", color: "var(--app-subtle-text-color)" }}>
                    {t.savePathLabel}
                </div>
                <code style={{ fontSize: "11px", wordBreak: "break-all", display: "block", color: "var(--app-muted-text-color)" }}>
                    {t.savePathValue}
                </code>
            </div>

            {/* 파일 선택: 버튼 문구는 선택 언어로 표시, 클릭 시 네이티브 파일 대화상자 열림 */}
            <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 600, marginBottom: "6px", color: "var(--app-subtle-text-color)" }}>
                    {t.saveFileLabel}
                </label>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".hsg"
                    onChange={onFileChange}
                    style={{ position: "absolute", width: 0, height: 0, opacity: 0, pointerEvents: "none" }}
                    aria-hidden="true"
                />
                <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="btn-primary"
                    style={{ padding: "8px 14px", fontSize: "14px" }}
                >
                    {t.chooseFileButton}
                </button>
                {fileName && <span style={{ marginLeft: "10px", fontSize: "13px", color: "var(--app-muted-text-color)" }}>{fileName}</span>}
            </div>

            {parseError && (
                <div style={{ padding: "10px 12px", marginBottom: "16px", background: "rgba(200,0,0,0.1)", borderRadius: "8px", color: "var(--app-text-color)" }}>
                    {parseError}
                </div>
            )}

            {/* 현재 값 / 수정할 값 */}
            {buffer && !parseError && (
                <>
                    <div style={{ marginBottom: "16px", padding: "12px 16px", background: "var(--app-bg-secondary, rgba(0,0,0,0.04))", borderRadius: "8px", border: "1px solid var(--app-border, rgba(0,0,0,0.08))" }}>
                        <div style={{ fontSize: "12px", fontWeight: 600, marginBottom: "10px", color: "var(--app-subtle-text-color)" }}>{t.editValuesLabel}</div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                            <label style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                                <span style={{ width: "90px", fontSize: "14px" }}>Money</span>
                                <input
                                    type="number"
                                    step="any"
                                    value={values.Money}
                                    onChange={(e) => setValues((v) => ({ ...v, Money: e.target.value }))}
                                    placeholder={t.placeholderMoney}
                                    style={{ padding: "6px 10px", fontSize: "14px", width: "180px", maxWidth: "100%" }}
                                />
                            </label>
                            <label style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                                <span style={{ width: "90px", fontSize: "14px" }}>Energy</span>
                                <input
                                    type="number"
                                    step="any"
                                    value={values.Energy}
                                    onChange={(e) => setValues((v) => ({ ...v, Energy: e.target.value }))}
                                    placeholder={t.placeholderEnergy}
                                    style={{ padding: "6px 10px", fontSize: "14px", width: "180px", maxWidth: "100%" }}
                                />
                            </label>
                            <label style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                                <span style={{ width: "90px", fontSize: "14px" }}>NetWorth</span>
                                <input
                                    type="number"
                                    step="any"
                                    value={values.NetWorth}
                                    onChange={(e) => setValues((v) => ({ ...v, NetWorth: e.target.value }))}
                                    placeholder={t.placeholderNetWorth}
                                    style={{ padding: "6px 10px", fontSize: "14px", width: "180px", maxWidth: "100%" }}
                                />
                            </label>
                        </div>
                    </div>
                    <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                        <button type="button" className="btn-primary" onClick={onReload} style={{ padding: "8px 16px" }}>
                            {t.btnReload}
                        </button>
                        <button type="button" className="btn-primary" onClick={onSave} style={{ padding: "8px 16px" }}>
                            {t.btnSave}
                        </button>
                    </div>
                </>
            )}

            {saveMessage && (
                <p style={{ marginTop: "12px", fontSize: "13px", color: "var(--app-muted-text-color)", whiteSpace: "pre-line" }}>{saveMessage}</p>
            )}

            <p style={{ marginTop: "24px", fontSize: "12px", color: "var(--app-muted-text-color)", whiteSpace: "pre-line" }}>
                {t.disclaimer}
            </p>
        </div>
    );
}
