import { useEffect, useMemo, useState } from "react";
import Flatpickr from "react-flatpickr";
import "flatpickr/dist/flatpickr.min.css";

import { LocalizationProvider } from "@mui/x-date-pickers";
import { MobileTimePicker } from "@mui/x-date-pickers/MobileTimePicker";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import TextField from "@mui/material/TextField";
import dayjs from "dayjs";

import { fetchShoutList } from "../api/mapleApi";
import { useWorld } from "../contexts/WorldContext";

export default function ShoutList() {
    const { world } = useWorld();
    const [items, setItems] = useState([]);

    // 현재 페이지(0부터 시작)
    const [page, setPage] = useState(0);
    // 페이지당 조회 개수
    const [size] = useState(20);

    const [nickname, setNickname] = useState("");
    const [content, setContent] = useState("");

    const [dateRange, setDateRange] = useState([]);

    // 페이징 메타(서버가 내려주면 사용)
    const [totalPages, setTotalPages] = useState(null);
    const [totalElements, setTotalElements] = useState(null);

    // ✅ 확정된 시간
    const [startTime, setStartTime] = useState(dayjs().startOf("day"));
    const [endTime, setEndTime] = useState(dayjs().endOf("day"));

    // ⏱ 팝업용 임시 시간
    const [tempTime, setTempTime] = useState(null);

    // 현재 선택 중인 타입
    const [activeType, setActiveType] = useState("start"); // start | end

    // 팝업 열림 여부
    const [pickerOpen, setPickerOpen] = useState(false);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    /* =========================
       Util
    ========================= */

    /**
     * 날짜(Date) + 시간(dayjs)을 "YYYY-MM-DDTHH:mm:00" 형태로 조합합니다.
     * - 입력: date(Date), time(dayjs)
     * - 출력: 문자열 또는 undefined
     */
    function buildDateTime(date, time) {
        // date/time 둘 중 하나라도 없으면 필터를 빼기 위해 undefined 반환
        if (!date || !time) return undefined;
        const yyyyMMdd = date.toISOString().slice(0, 10);
        return `${yyyyMMdd}T${time.format("HH:mm:00")}`;
    }

    /**
     * 서버 응답에서 숫자형 페이지 메타를 추출합니다.
     * - 입력: payload(객체), key(문자열)
     * - 출력: number | null
     */
    function getPaginationNumber(payload, key) {
        const value = payload?.[key];

        // 값이 number면 그대로 사용
        if (typeof value === "number" && Number.isFinite(value)) return value;

        // 문자열 숫자면 number로 변환
        if (typeof value === "string" && value.trim() !== "" && Number.isFinite(Number(value))) {
            return Number(value);
        }

        // 그 외는 null
        return null;
    }

    /**
     * 페이지 버튼에 표시할 페이지 인덱스 배열을 만듭니다(0-based).
     * - 입력: currentPage(0-based), pageCount(totalPages), maxButtons(최대 표시 개수)
     * - 출력: number[]
     */
    function buildPageIndexList(currentPage, pageCount, maxButtons = 5) {
        // totalPages가 없으면 버튼 리스트는 현재 페이지 1개만
        if (!pageCount || pageCount <= 0) return [currentPage];

        const safeMaxButtons = Math.max(1, maxButtons);
        const half = Math.floor(safeMaxButtons / 2);

        let start = Math.max(0, currentPage - half);
        let end = Math.min(pageCount - 1, start + safeMaxButtons - 1);

        // end가 마지막에 걸리면 start를 당겨서 버튼 개수 맞춤
        if (end - start + 1 < safeMaxButtons) {
            start = Math.max(0, end - safeMaxButtons + 1);
        }

        const result = [];
        // start부터 end까지 페이지 인덱스를 순서대로 채움
        for (let i = start; i <= end; i += 1) {
            result.push(i);
        }
        return result;
    }

    /* =========================
       Data Load
    ========================= */

    useEffect(() => {
        // 페이지 변경 시 해당 페이지 데이터 로드
        loadData(page);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page]);

    useEffect(() => {
        // 조건문: world가 바뀌면 첫 페이지로 리셋해서 다시 조회
        setPage(0);
        loadData(0);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [world]);

    /**
     * 고확 리스트를 조회하고 items + 페이징 메타를 업데이트합니다.
     * - 입력: targetPage(0-based)
     * - 출력: 없음(상태 업데이트)
     */
    function loadData(targetPage = page) {
        setLoading(true);
        setError(null);

        // 날짜 범위가 선택되었을 때만 from/to를 보냄
        const from = dateRange[0]
            ? buildDateTime(dateRange[0], startTime)
            : undefined;

        const to = dateRange[1]
            ? buildDateTime(dateRange[1], endTime)
            : undefined;

        fetchShoutList({
            // 월드 선택(백엔드가 지원하면 필터로 사용 가능)
            world: world || undefined,
            page: targetPage,
            size,
            nickname: nickname || undefined,
            content: content || undefined,
            from,
            to
        })
            .then(res => {
                const payload = res?.data ?? res;
                const nextItems = payload?.items ?? [];

                // 서버가 items를 배열로 주지 않으면 안전하게 빈 배열 처리
                if (Array.isArray(nextItems)) {
                    setItems(nextItems);
                } else {
                    setItems([]);
                }

                // 페이징 메타 추출(서버가 내려주는 경우만 사용)
                const nextTotalPages =
                    getPaginationNumber(payload, "totalPages") ??
                    getPaginationNumber(payload?.page, "totalPages") ??
                    getPaginationNumber(payload?.pagination, "totalPages");

                const nextTotalElements =
                    getPaginationNumber(payload, "totalElements") ??
                    getPaginationNumber(payload?.page, "totalElements") ??
                    getPaginationNumber(payload?.pagination, "totalElements");

                setTotalPages(nextTotalPages);
                setTotalElements(nextTotalElements);
            })
            .catch(err => setError(err?.message || "조회 중 오류가 발생했습니다."))
            .finally(() => setLoading(false));
    }

    const timePickerTheme = createTheme({
        components: {
            // AM/PM 버튼 스타일
            MuiClockAmPm: {
                styleOverrides: {
                    root: {
                        gap: 8
                    },
                    button: {
                        borderRadius: 8,
                        padding: "8px 16px",
                        fontWeight: 700,
                        fontSize: "0.95rem",
                        transition: "all 0.2s ease-in-out",
                        minWidth: "60px",

                        // 기본(미선택) 상태 - 배경색 없음
                        color: "#6b7280", // 회색 텍스트
                        backgroundColor: "transparent", // 배경색 없음
                        border: "2px solid transparent", // 테두리 없음

                        // hover (미선택)
                        "&:hover:not(.Mui-selected)": {
                            backgroundColor: "#f3f4f6", // 연한 회색 배경
                            color: "#4b5563" // 조금 더 진한 회색 텍스트
                        },

                        // 선택된 AM / PM - 진한 파란색 배경
                        "&.Mui-selected": {
                            backgroundColor: "#3b82f6", // 진한 파란색
                            color: "#ffffff", // 흰색 텍스트
                            border: "2px solid #2563eb", // 진한 파란색 테두리
                            boxShadow: "0 4px 6px -1px rgba(37, 99, 235, 0.3), 0 2px 4px -1px rgba(37, 99, 235, 0.2)", // 파란색 그림자
                            transform: "scale(1.05)",
                            fontWeight: 800,
                            fontSize: "1rem"
                        },

                        // 선택된 상태 hover - 더 진한 파란색
                        "&.Mui-selected:hover": {
                            backgroundColor: "#2563eb", // 더 진한 파란색
                            boxShadow: "0 6px 8px -1px rgba(37, 99, 235, 0.4), 0 4px 6px -1px rgba(37, 99, 235, 0.3)",
                            transform: "scale(1.08)"
                        }
                    }
                }
            },
            // ToggleButton 스타일 (AM/PM이 ToggleButton으로 렌더링될 경우)
            MuiToggleButton: {
                styleOverrides: {
                    root: {
                        borderRadius: 8,
                        padding: "8px 16px",
                        fontWeight: 700,
                        fontSize: "0.95rem",
                        transition: "all 0.2s ease-in-out",
                        minWidth: "60px",

                        // 기본(미선택) 상태 - 배경색 없음
                        color: "#6b7280", // 회색 텍스트
                        backgroundColor: "transparent", // 배경색 없음
                        border: "2px solid transparent", // 테두리 없음

                        // hover (미선택)
                        "&:hover:not(.Mui-selected)": {
                            backgroundColor: "#f3f4f6", // 연한 회색 배경
                            color: "#4b5563" // 조금 더 진한 회색 텍스트
                        },

                        // 선택된 상태 - 진한 파란색 배경
                        "&.Mui-selected": {
                            backgroundColor: "#3b82f6", // 진한 파란색
                            color: "#ffffff", // 흰색 텍스트
                            border: "2px solid #2563eb", // 진한 파란색 테두리
                            boxShadow: "0 4px 6px -1px rgba(37, 99, 235, 0.3), 0 2px 4px -1px rgba(37, 99, 235, 0.2)", // 파란색 그림자
                            transform: "scale(1.05)",
                            fontWeight: 800,
                            fontSize: "1rem",
                            "&:hover": {
                                backgroundColor: "#2563eb", // 더 진한 파란색
                                boxShadow: "0 6px 8px -1px rgba(37, 99, 235, 0.4), 0 4px 6px -1px rgba(37, 99, 235, 0.3)",
                                transform: "scale(1.08)"
                            }
                        }
                    }
                }
            }
        }
    });


    /**
     * 검색 폼 submit 핸들러
     * - 입력: submit 이벤트
     * - 출력: 없음(상태/조회 수행)
     */
    function onSearch(e) {
        e.preventDefault();
        // 검색 시 첫 페이지로 이동
        setPage(0);
        // setPage는 비동기이므로 0페이지를 명시해서 즉시 로드
        loadData(0);
    }

    /* =========================
       TimePicker Control
    ========================= */

    /**
     * TimePicker 팝업을 엽니다.
     * - 입력: type("start" | "end")
     * - 출력: 없음(상태 업데이트)
     */
    function openPicker(type) {
        setActiveType(type);
        // start/end에 따라 팝업 초기 값을 다르게 세팅
        setTempTime(type === "start" ? startTime : endTime);
        setPickerOpen(true);
    }

    /**
     * TimePicker 선택 확정 핸들러
     * - 입력: 없음
     * - 출력: 없음(상태 업데이트)
     */
    function handleAccept() {
        // 임시 시간이 없으면 그냥 닫음
        if (!tempTime) {
            setPickerOpen(false);
            return;
        }

        // start/end에 따라 확정 시간 반영
        if (activeType === "start") {
            setStartTime(tempTime);
        } else {
            setEndTime(tempTime);
        }

        setPickerOpen(false);
    }

    /**
     * TimePicker 취소 핸들러
     * - 입력: 없음
     * - 출력: 없음(팝업만 닫음)
     */
    function handleCancel() {
        setPickerOpen(false); // ❗ 값 변경 없음
    }

    /**
     * 페이지 이동
     * - 입력: targetPage(0-based)
     * - 출력: 없음(상태 업데이트)
     */
    function handlePageChange(targetPage) {
        // 로딩 중에는 중복 요청 방지
        if (loading) return;

        // 음수 페이지 방지
        if (targetPage < 0) return;

        // totalPages를 알고 있으면 마지막 페이지 초과 방지
        if (typeof totalPages === "number" && Number.isFinite(totalPages) && targetPage >= totalPages) return;

        setPage(targetPage);
    }

    // 페이지 버튼 목록(0-based)
    const pageIndexList = useMemo(() => {
        // totalPages를 알면 그 기준으로 버튼 생성
        if (typeof totalPages === "number" && Number.isFinite(totalPages)) {
            return buildPageIndexList(page, totalPages, 7);
        }
        // totalPages가 없으면 현재 페이지만 표시
        return [page];
    }, [page, totalPages]);

    // 다음 페이지 가능 여부(서버 메타가 없으면 "현재 items가 size와 같으면 다음이 있을 수 있음"으로 추정)
    const canGoNext = useMemo(() => {
        // totalPages를 알고 있으면 마지막 페이지 여부로 판단
        if (typeof totalPages === "number" && Number.isFinite(totalPages)) {
            return page < totalPages - 1;
        }
        // totalPages가 없으면 size만큼 꽉 찼을 때 다음 가능하다고 추정
        return Array.isArray(items) && items.length === size;
    }, [items, page, size, totalPages]);

    /**
     * 마지막 페이지 인덱스(0-based)를 계산합니다.
     * - 입력: 없음(상태 사용)
     * - 출력: number | null
     */
    const lastPageIndex = useMemo(() => {
        // totalPages가 유효할 때만 마지막 페이지 계산
        if (typeof totalPages === "number" && Number.isFinite(totalPages) && totalPages > 0) {
            return totalPages - 1;
        }
        // totalPages가 없으면 마지막 페이지를 특정할 수 없음
        return null;
    }, [totalPages]);

    /* =========================
       Render
    ========================= */

    return (
        <div>
            <h2>고확 리스트</h2>

            <form
                className="layout-filter-row shout-filter"
                onSubmit={onSearch}
            >
                <div className="shout-filter-card">
                    {/* 닉네임 필터 */}
                    <input
                        className="layout-input"
                        placeholder="닉네임"
                        value={nickname}
                        onChange={e => setNickname(e.target.value)}
                    />

                    {/* 내용 필터 */}
                    <input
                        className="layout-input"
                        placeholder="내용"
                        value={content}
                        onChange={e => setContent(e.target.value)}
                    />

                    {/* 날짜 범위 필터 */}
                    <Flatpickr
                        className="layout-input"
                        value={dateRange}
                        options={{
                            mode: "range",
                            dateFormat: "Y-m-d",
                            closeOnSelect: false
                        }}
                        placeholder="날짜 선택"
                        onChange={dates => setDateRange(dates)}
                    />

                    {/* ⏱ 시간 표시 + 버튼 */}
                    <div className="shout-time-controls">
                        <div className="shout-time-range">
                            {/* 현재 선택된 시작/종료 시간을 표시 */}
                            {startTime.format("HH:mm")} – {endTime.format("HH:mm")}
                        </div>

                        <div className="shout-time-actions">
                            {/* 시작 시간 선택 버튼 */}
                            <button
                                type="button"
                                className="btn btn-soft"
                                onClick={() => openPicker("start")}
                            >
                                시작 시간
                            </button>

                            {/* 종료 시간 선택 버튼 */}
                            <button
                                type="button"
                                className="btn btn-soft"
                                onClick={() => openPicker("end")}
                            >
                                종료 시간
                            </button>
                        </div>
                    </div>

                    {/* 검색 버튼 */}
                    <button
                        type="submit"
                        className="btn btn-primary"
                    >
                        검색
                    </button>
                </div>
            </form>

            {/* ⏱ TimePicker는 레이아웃에서 완전히 분리 */}
            <div
                style={{
                    position: "fixed",
                    width: 0,
                    height: 0,
                    overflow: "hidden",
                    pointerEvents: "none"
                }}
            >
                <ThemeProvider theme={timePickerTheme}>
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                        <MobileTimePicker
                            value={tempTime}
                            onChange={setTempTime}

                            open={pickerOpen}
                            onAccept={handleAccept}
                            onClose={handleCancel}

                            minutesStep={5}
                            ampm
                            views={["hours", "minutes"]}

                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    sx={{
                                        width: 0,
                                        height: 0,
                                        padding: 0,
                                        margin: 0,
                                        border: 0
                                    }}
                                />
                            )}
                        />
                    </LocalizationProvider>
                </ThemeProvider>
            </div>

            {loading && <div>로딩 중...</div>}
            {error && <div style={{ color: "red" }}>{error}</div>}

            <table className="shout-table">
                <thead>
                <tr>
                    <th>닉네임</th>
                    <th>멘트</th>
                    <th>지역</th>
                    <th>채널</th>
                    <th>보낸 시간</th>
                </tr>
                </thead>
                <tbody>
                {items.length === 0 && !loading && (
                    <tr>
                        <td colSpan={5} style={{ textAlign: "center" }}>
                            조회 결과가 없습니다.
                        </td>
                    </tr>
                )}

                {items.map((row, idx) => (
                    <tr key={idx}>
                        <td>{row.nickname}</td>
                        <td>{row.message}</td>
                        <td>{row.region}</td>
                        <td>{row.channel}</td>
                        <td>{new Date(row.sentAt).toLocaleString()}</td>
                    </tr>
                ))}
                </tbody>
            </table>

            {/* 페이징 */}
            <div className="pagination">
                {/* 첫 페이지 */}
                <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => handlePageChange(0)}
                    disabled={loading || page === 0}
                >
                    처음
                </button>

                <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => handlePageChange(page - 1)}
                    disabled={loading || page === 0}
                >
                    이전
                </button>

                {/* 페이지 번호 버튼 목록 */}
                {pageIndexList.map(pageIndex => (
                    <button
                        key={pageIndex}
                        type="button"
                        className={`btn btn-page ${pageIndex === page ? "active" : ""}`}
                        onClick={() => handlePageChange(pageIndex)}
                        disabled={loading}
                    >
                        {pageIndex + 1}
                    </button>
                ))}

                <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => handlePageChange(page + 1)}
                    disabled={loading || !canGoNext}
                >
                    다음
                </button>

                {/* 마지막 페이지: totalPages를 모르면 비활성 */}
                <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => {
                        // lastPageIndex가 있을 때만 이동
                        if (typeof lastPageIndex === "number") {
                            handlePageChange(lastPageIndex);
                        }
                    }}
                    disabled={
                        loading ||
                        // totalPages가 없으면 마지막 이동을 할 수 없음
                        typeof lastPageIndex !== "number" ||
                        // 이미 마지막 페이지면 비활성
                        page === lastPageIndex
                    }
                >
                    끝
                </button>

                <span style={{ marginLeft: 8, color: "#6b7280", fontSize: 13 }}>
                    {typeof totalPages === "number" && Number.isFinite(totalPages)
                        ? `${page + 1} / ${totalPages}`
                        : `${page + 1}`}
                    {typeof totalElements === "number" && Number.isFinite(totalElements)
                        ? ` (총 ${totalElements.toLocaleString()}건)`
                        : ""}
                </span>
            </div>
        </div>
    );
}
