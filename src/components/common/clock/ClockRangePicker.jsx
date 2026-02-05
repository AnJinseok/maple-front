import { useMemo, useRef, useState } from "react";
import "./clock.css";

/**
 * ClockRangePicker
 * - Click: start → end → reset
 * - Drag: press & move
 * - 24h dial
 * - Midnight safe
 *
 * @author Belle
 */
export default function ClockRangePicker({
                                             onChange,
                                             minuteStep = 5,
                                             size = 320
                                         }) {
    const CENTER = size / 2;
    const HOUR_RADIUS = size * 0.40;
    const MIN_RADIUS = size * 0.30;
    const ARC_RADIUS = HOUR_RADIUS;

    const svgRef = useRef(null);
    const isDraggingRef = useRef(false);
    const startAngleRef = useRef(null);

    const [startAngle, setStartAngle] = useState(null);
    const [endAngle, setEndAngle] = useState(null);
    const [hoverAngle, setHoverAngle] = useState(null);

    /* =====================
       Geometry
    ===================== */

    function clamp360(d) {
        d %= 360;
        return d < 0 ? d + 360 : d;
    }

    function degFromPoint(x, y) {
        return clamp360(Math.atan2(y - CENTER, x - CENTER) * 180 / Math.PI + 90);
    }

    function polar(deg, r) {
        const rad = (deg - 90) * Math.PI / 180;
        return {
            x: CENTER + r * Math.cos(rad),
            y: CENTER + r * Math.sin(rad)
        };
    }

    function inside(x, y) {
        return Math.hypot(x - CENTER, y - CENTER) <= HOUR_RADIUS + 12;
    }

    /* =====================
       Time
    ===================== */

    function angleToMinutes(deg) {
        return Math.round(deg / 360 * 1440);
    }

    function snap(m) {
        return minuteStep > 1
            ? Math.round(m / minuteStep) * minuteStep
            : m;
    }

    function toTime(m) {
        m = (m + 1440) % 1440;
        const h = String(Math.floor(m / 60)).padStart(2, "0");
        const mm = String(m % 60).padStart(2, "0");
        return `${h}:${mm}:00`;
    }

    function emit(s, e) {
        if (s == null || e == null) return;
        onChange?.(
            toTime(snap(angleToMinutes(s))),
            toTime(snap(angleToMinutes(e)))
        );
    }

    /* =====================
       Mouse
    ===================== */

    function getPoint(e) {
        const r = svgRef.current.getBoundingClientRect();
        return { x: e.clientX - r.left, y: e.clientY - r.top };
    }

    function onMouseDown(e) {
        const p = getPoint(e);
        if (!inside(p.x, p.y)) return;

        isDraggingRef.current = true;
        const deg = degFromPoint(p.x, p.y);

        startAngleRef.current = deg;
        setStartAngle(deg);
        setEndAngle(null);
    }

    function onMouseMove(e) {
        const p = getPoint(e);
        if (!p || !inside(p.x, p.y)) {
            setHoverAngle(null);
            return;
        }

        const deg = degFromPoint(p.x, p.y);
        setHoverAngle(deg);

        if (isDraggingRef.current) {
            setEndAngle(deg);
        }
    }

    function onMouseUp() {
        if (!isDraggingRef.current) return;
        isDraggingRef.current = false;

        if (startAngleRef.current != null && endAngle != null) {
            emit(startAngleRef.current, endAngle);
        }
    }

    function onClick(e) {
        if (isDraggingRef.current) return;

        const p = getPoint(e);
        if (!inside(p.x, p.y)) return;

        const deg = degFromPoint(p.x, p.y);

        if (startAngle == null) {
            startAngleRef.current = deg;
            setStartAngle(deg);
            setEndAngle(null);
            return;
        }

        if (endAngle == null) {
            setEndAngle(deg);
            emit(startAngleRef.current, deg);
            return;
        }

        startAngleRef.current = deg;
        setStartAngle(deg);
        setEndAngle(null);
    }

    /* =====================
       Render helpers
    ===================== */

    const hourLabels = useMemo(() =>
        Array.from({ length: 12 }).map((_, i) => {
            const deg = i * 30;
            const pos = polar(deg, HOUR_RADIUS - 18);
            return { ...pos, text: i * 2, key: i };
        }), []);

    const minuteLabels = useMemo(() =>
        Array.from({ length: 12 }).map((_, i) => {
            const deg = i * 30;
            const pos = polar(deg, MIN_RADIUS);
            return { ...pos, text: String(i * 5).padStart(2, "0"), key: i };
        }), []);

    const arcPath = useMemo(() => {
        if (startAngle == null || endAngle == null) return null;
        const s = polar(startAngle, ARC_RADIUS);
        const e = polar(endAngle, ARC_RADIUS);
        return `M ${s.x} ${s.y} A ${ARC_RADIUS} ${ARC_RADIUS} 0 0 1 ${e.x} ${e.y}`;
    }, [startAngle, endAngle]);

    return (
        <div className="clock-range">
            <div className="clock-preview">
                {startAngle != null ? toTime(angleToMinutes(startAngle)).slice(0, 5) : "--:--"}
                {" – "}
                {endAngle != null ? toTime(angleToMinutes(endAngle)).slice(0, 5) : "--:--"}
            </div>

            <svg
                ref={svgRef}
                width={size}
                height={size}
                className="clock-svg"
                onMouseDown={onMouseDown}
                onMouseMove={onMouseMove}
                onMouseUp={onMouseUp}
                onMouseLeave={onMouseUp}
                onClick={onClick}
            >
                <circle cx={CENTER} cy={CENTER} r={HOUR_RADIUS} className="clock-bg" />

                {hourLabels.map(l => (
                    <text key={l.key} x={l.x} y={l.y} className="clock-hour">{l.text}</text>
                ))}

                {minuteLabels.map(l => (
                    <text key={l.key} x={l.x} y={l.y} className="clock-minute">{l.text}</text>
                ))}

                {arcPath && <path d={arcPath} className="clock-arc" />}

                {hoverAngle != null && (
                    <line
                        x1={CENTER}
                        y1={CENTER}
                        x2={polar(hoverAngle, ARC_RADIUS).x}
                        y2={polar(hoverAngle, ARC_RADIUS).y}
                        className="clock-hand"
                    />
                )}

                {startAngle != null && (
                    <circle {...polar(startAngle, ARC_RADIUS)} r={7} className="clock-marker start" />
                )}
                {endAngle != null && (
                    <circle {...polar(endAngle, ARC_RADIUS)} r={7} className="clock-marker end" />
                )}

                <circle cx={CENTER} cy={CENTER} r={3} className="clock-center" />
            </svg>
        </div>
    );
}
