import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TickerTimerChart } from "./TickerTimerChart";

describe("ticker timer charts", () => {
  it("shows measured speed points at their real times with labelled units", () => {
    render(
      <TickerTimerChart
        dots={[]}
        speedSeriesMps={[
          { timeS: 0.03, speedMps: 0.46 },
          { timeS: 0.05, speedMps: 0.5 },
        ]}
        instantaneousSpeedMps={0.5}
      />,
    );

    const chart = screen.getByRole("img", {
      name: "速度-时间图，纵轴速度单位米每秒，横轴时间单位秒",
    });
    const markers = chart.querySelectorAll("[data-time-s]");
    expect(markers).toHaveLength(2);
    expect(markers[0]).toHaveAttribute("data-time-s", "0.03");
    expect(markers[1]).toHaveAttribute("data-time-s", "0.05");
    expect(Number(markers[1].getAttribute("cx"))).toBeGreaterThan(
      Number(markers[0].getAttribute("cx")),
    );
    expect(chart).toHaveTextContent("v (m/s)");
    expect(chart).toHaveTextContent("t (s)");
  });
});
