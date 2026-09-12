import { useMemo } from "react";
import type { TapeDot } from "./model";

type TickerTimerChartProps = {
  dots: TapeDot[];
  speedSeriesMps: number[];
  instantaneousSpeedMps: number | null;
};

const WIDTH = 360;
const HEIGHT = 118;
const PAD = { top: 14, right: 12, bottom: 22, left: 36 };

function buildTapePath(dots: TapeDot[]): { cx: number; smeared: boolean }[] {
  if (dots.length === 0) {
    return [];
  }
  const inner = WIDTH - PAD.left - PAD.right;
  const maxPos = Math.max(0.04, dots[dots.length - 1].positionM);
  return dots.map((dot) => ({
    cx: PAD.left + (dot.positionM / maxPos) * inner,
    smeared: dot.smeared,
  }));
}

function buildSeries(values: number[]): string {
  if (values.length === 0) {
    return "";
  }
  const innerW = WIDTH - PAD.left - PAD.right;
  const innerH = HEIGHT - PAD.top - PAD.bottom;
  const max = Math.max(...values, 1e-6);
  return values
    .map((value, index) => {
      const x = PAD.left + (index / Math.max(1, values.length - 1)) * innerW;
      const y = PAD.top + innerH - (value / max) * innerH;
      return `${index === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");
}

export function TickerTimerChart({
  dots,
  speedSeriesMps,
  instantaneousSpeedMps,
}: TickerTimerChartProps) {
  const tapeMarks = useMemo(() => buildTapePath(dots), [dots]);
  const speedPath = useMemo(
    () => buildSeries(speedSeriesMps),
    [speedSeriesMps],
  );

  return (
    <div className="ticker-chart-shell">
      <div className="ticker-chart-block">
        <h3>纸带点迹</h3>
        <svg
          className="ticker-chart-svg"
          viewBox={`0 0 ${WIDTH} 64`}
          role="img"
          aria-label="纸带点迹"
        >
          <rect
            x="16"
            y="22"
            width="328"
            height="20"
            rx="4"
            fill="#fff7ed"
            stroke="#f9a8d4"
          />
          {tapeMarks.map((mark, index) => (
            <circle
              key={`tape-${index}`}
              cx={mark.cx}
              cy={32}
              r={mark.smeared ? 3.4 : 2.2}
              fill={mark.smeared ? "#c2410c" : "#be185d"}
            />
          ))}
        </svg>
      </div>
      <div className="ticker-chart-block">
        <h3>
          v-t（中间时刻速度）
          {instantaneousSpeedMps !== null
            ? `  当前 ${instantaneousSpeedMps.toFixed(3)} m/s`
            : ""}
        </h3>
        <svg
          className="ticker-chart-svg"
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          role="img"
          aria-label="速度时间图"
        >
          <line
            x1={PAD.left}
            y1={PAD.top}
            x2={PAD.left}
            y2={HEIGHT - PAD.bottom}
            stroke="#94a3b8"
          />
          <line
            x1={PAD.left}
            y1={HEIGHT - PAD.bottom}
            x2={WIDTH - PAD.right}
            y2={HEIGHT - PAD.bottom}
            stroke="#94a3b8"
          />
          <text
            x={PAD.left - 6}
            y={PAD.top + 8}
            textAnchor="end"
            fontSize="10"
            fill="#64748b"
          >
            v
          </text>
          <text
            x={WIDTH - PAD.right}
            y={HEIGHT - 6}
            textAnchor="end"
            fontSize="10"
            fill="#64748b"
          >
            t
          </text>
          {speedPath ? (
            <path d={speedPath} fill="none" stroke="#f472b6" strokeWidth="2" />
          ) : (
            <text
              x={WIDTH / 2}
              y={HEIGHT / 2}
              textAnchor="middle"
              fontSize="12"
              fill="#94a3b8"
            >
              点数不足，释放纸带后绘制
            </text>
          )}
        </svg>
      </div>
    </div>
  );
}
