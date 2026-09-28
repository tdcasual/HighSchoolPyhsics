import { useMemo } from "react";
import type { TapeDot, TapeSpeedSample } from "./model";

type TickerTimerChartProps = {
  dots: TapeDot[];
  speedSeriesMps: TapeSpeedSample[];
  instantaneousSpeedMps: number | null;
};

const WIDTH = 360;
const HEIGHT = 152;
const PAD = { top: 14, right: 14, bottom: 32, left: 48 };
const TICK_COUNT = 4;

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

function niceTickStep(maxValue: number): number {
  const roughStep = Math.max(maxValue, 0.1) / TICK_COUNT;
  const power = 10 ** Math.floor(Math.log10(roughStep));
  const normalized = roughStep / power;
  const niceFactor =
    normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 2.5 ? 2.5 : normalized <= 5 ? 5 : 10;
  return niceFactor * power;
}

function formatTick(value: number): string {
  if (Math.abs(value) < 1e-9) {
    return "0";
  }
  const digits = Math.abs(value) >= 10 ? 0 : Math.abs(value) >= 1 ? 1 : 2;
  const formatted = value.toFixed(digits);
  return formatted.includes(".")
    ? formatted.replace(/0+$/, "").replace(/\.$/, "")
    : formatted;
}

function buildSpeedPlot(samples: TapeSpeedSample[]) {
  if (samples.length === 0) {
    return null;
  }

  const innerW = WIDTH - PAD.left - PAD.right;
  const innerH = HEIGHT - PAD.top - PAD.bottom;
  const latestTimeS = Math.max(0, ...samples.map((sample) => sample.timeS));
  const timeStepS = niceTickStep(latestTimeS || 0.1);
  const timeMaxS = Math.max(timeStepS, Math.ceil(latestTimeS / timeStepS) * timeStepS);
  const maxSpeedMps = Math.max(0, ...samples.map((sample) => sample.speedMps));
  const speedStepMps = niceTickStep(maxSpeedMps || 0.1);
  const speedMaxMps = Math.max(speedStepMps, Math.ceil(maxSpeedMps / speedStepMps) * speedStepMps);
  const points = samples.map((sample) => ({
    x: PAD.left + (sample.timeS / timeMaxS) * innerW,
    y: PAD.top + innerH - (sample.speedMps / speedMaxMps) * innerH,
  }));
  const path = points
    .map(({ x, y }, index) => `${index === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`)
    .join(" ");

  return {
    points,
    path,
    timeMaxS,
    timeStepS,
    speedMaxMps,
    speedStepMps,
    innerW,
    innerH,
  };
}

export function TickerTimerChart({
  dots,
  speedSeriesMps,
  instantaneousSpeedMps,
}: TickerTimerChartProps) {
  const tapeMarks = useMemo(() => buildTapePath(dots), [dots]);
  const speedPlot = useMemo(
    () => buildSpeedPlot(speedSeriesMps),
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
          aria-label="纸带点迹，横向位置按位移比例显示"
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
          v-t（中间时刻估算）
          {instantaneousSpeedMps !== null
            ? `  当前 ${instantaneousSpeedMps.toFixed(3)} m/s`
            : ""}
        </h3>
        <svg
          className="ticker-chart-svg ticker-speed-chart"
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          role="img"
          aria-label="速度-时间图，纵轴速度单位米每秒，横轴时间单位秒"
        >
          {speedPlot ? (
            <>
              {Array.from({ length: TICK_COUNT + 1 }, (_, index) => {
                const x = PAD.left + (index / TICK_COUNT) * speedPlot.innerW;
                const y = PAD.top + speedPlot.innerH - (index / TICK_COUNT) * speedPlot.innerH;
                const timeValue = (index / TICK_COUNT) * speedPlot.timeMaxS;
                const speedValue = (index / TICK_COUNT) * speedPlot.speedMaxMps;
                return (
                  <g key={index}>
                    <line
                      x1={x}
                      y1={PAD.top}
                      x2={x}
                      y2={HEIGHT - PAD.bottom}
                      stroke="#e2e8f0"
                      strokeDasharray={index === 0 ? undefined : "2 3"}
                    />
                    <line
                      x1={PAD.left}
                      y1={y}
                      x2={WIDTH - PAD.right}
                      y2={y}
                      stroke="#e2e8f0"
                      strokeDasharray={index === 0 ? undefined : "2 3"}
                    />
                    <text
                      x={x}
                      y={HEIGHT - PAD.bottom + 14}
                      textAnchor="middle"
                      fontSize="9"
                      fill="#64748b"
                    >
                      {formatTick(timeValue)}
                    </text>
                    <text
                      x={PAD.left - 6}
                      y={y + 3}
                      textAnchor="end"
                      fontSize="9"
                      fill="#64748b"
                    >
                      {formatTick(speedValue)}
                    </text>
                  </g>
                );
              })}
              <path d={speedPlot.path} fill="none" stroke="#db2777" strokeWidth="2" />
              {speedPlot.points.map((point, index) => (
                <circle
                  key={`speed-${index}`}
                  data-time-s={speedSeriesMps[index].timeS}
                  data-speed-mps={speedSeriesMps[index].speedMps}
                  cx={point.x}
                  cy={point.y}
                  r="2.6"
                  fill="#db2777"
                />
              ))}
              <text
                x="10"
                y={PAD.top + speedPlot.innerH / 2}
                textAnchor="middle"
                fontSize="9"
                fill="#475569"
                transform={`rotate(-90 10 ${PAD.top + speedPlot.innerH / 2})`}
              >
                v (m/s)
              </text>
              <text
                x={WIDTH - PAD.right}
                y={HEIGHT - 5}
                textAnchor="end"
                fontSize="9"
                fill="#475569"
              >
                t (s)
              </text>
            </>
          ) : (
            <>
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
                x={WIDTH / 2}
                y={HEIGHT / 2}
                textAnchor="middle"
                fontSize="12"
                fill="#94a3b8"
              >
                点数不足，释放纸带后绘制
              </text>
            </>
          )}
        </svg>
      </div>
    </div>
  );
}
