import type { ReactNode } from "react";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("../../../scene3d/InteractiveCanvas", () => ({
  InteractiveCanvas: ({
    children,
    frameloop,
  }: {
    children: ReactNode;
    frameloop?: "always" | "demand";
  }) => (
    <div
      data-testid="interactive-canvas"
      data-frameloop={frameloop ?? "always"}
    >
      {children}
    </div>
  ),
}));

vi.mock("../TickerTimerRig3D", () => ({
  TickerTimerRig3D: () => <div data-testid="ticker-timer-rig" />,
}));

import { TickerTimerScene } from "../TickerTimerScene";

describe("ticker-timer structure", () => {
  it("renders five-zone controls, overlay, chart, and playback", () => {
    render(<TickerTimerScene />);

    expect(
      screen.getByRole("heading", { name: "打点计时器控制" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "电磁打点" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "电火花" })).toBeInTheDocument();
    const dataPanel = screen.getByRole("region", { name: "数据" });
    const chartPanel = screen.getByRole("region", { name: "图表" });
    const playbackPanel = screen.getByRole("region", { name: "播放控制" });
    expect(within(dataPanel).getByRole("button", { name: "折叠" })).toBeInTheDocument();
    expect(within(chartPanel).getByRole("button", { name: "展开" })).toBeInTheDocument();
    expect(within(playbackPanel).getByRole("button", { name: "展开" })).toBeInTheDocument();

    fireEvent.click(within(chartPanel).getByRole("button", { name: "展开" }));
    expect(screen.getByText("纸带点迹")).toBeInTheDocument();
    fireEvent.click(within(playbackPanel).getByRole("button", { name: "展开" }));
    expect(screen.getByRole("button", { name: "通电" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "释放纸带" })).toBeInTheDocument();
    expect(screen.getByTestId("interactive-canvas")).toHaveAttribute(
      "data-frameloop",
      "demand",
    );
    expect(screen.getByTestId("ticker-timer-rig")).toBeInTheDocument();
  });

  it("switches to the spark timer and starts the always frameloop when powered", () => {
    render(<TickerTimerScene />);

    fireEvent.click(screen.getByRole("radio", { name: "电火花" }));
    const dataPanel = screen.getByRole("region", { name: "数据" });
    expect(within(dataPanel).getAllByText(/电火花打点计时器/).length).toBeGreaterThanOrEqual(1);
    const playbackPanel = screen.getByRole("region", { name: "播放控制" });
    fireEvent.click(within(playbackPanel).getByRole("button", { name: "展开" }));

    fireEvent.click(screen.getByRole("button", { name: "通电" }));
    expect(screen.getByTestId("interactive-canvas")).toHaveAttribute(
      "data-frameloop",
      "always",
    );
    expect(screen.getByRole("button", { name: "断电" })).toBeInTheDocument();
  });
});
