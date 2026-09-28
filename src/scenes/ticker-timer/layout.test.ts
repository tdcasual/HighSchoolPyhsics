import { describe, expect, it } from "vitest";
import { EM_LAYOUT, PUNCH_POINT_X, SCENE_SCALE, SPARK_LAYOUT, TAPE, sparkDiscRotationRad, tapeWorldX } from "./layout";
import { MAX_TAPE_M } from "./model";
import { TICKER_CANDY } from "./palette";

describe("ticker timer component layout", () => {
  it("keeps the displayed paper long enough for the complete measured run", () => {
    const paperStart = TAPE.centerX - TAPE.visibleLength / 2;
    const paperEnd = TAPE.centerX + TAPE.visibleLength / 2;

    expect(paperStart).toBeCloseTo(
      PUNCH_POINT_X - TAPE.trailingLengthM * SCENE_SCALE,
      8,
    );
    expect(tapeWorldX(0, 0)).toBeCloseTo(PUNCH_POINT_X, 8);
    expect(tapeWorldX(0, MAX_TAPE_M)).toBeCloseTo(paperEnd, 8);
    expect(TAPE.physicalLengthM).toBe(MAX_TAPE_M);
  });

  it("places the electromagnetic carbon paper against the tape at the needle point", () => {
    const carbonBottom = EM_LAYOUT.carbon.position[1] - 0.0075;
    const carbonNearEdge =
      EM_LAYOUT.carbon.position[0] - EM_LAYOUT.carbon.radius;

    expect(carbonBottom).toBeCloseTo(TAPE.y, 8);
    expect(carbonNearEdge).toBeCloseTo(PUNCH_POINT_X, 8);
    expect(EM_LAYOUT.guides.every((guide) => guide.position[0] === PUNCH_POINT_X)).toBe(true);
  });

  it("keeps the reed through the coil and between the N/S poles", () => {
    const reedX0 = EM_LAYOUT.reed.position[0] - EM_LAYOUT.reed.size[0] / 2;
    const reedX1 = EM_LAYOUT.reed.position[0] + EM_LAYOUT.reed.size[0] / 2;
    expect(reedX0).toBeLessThan(EM_LAYOUT.coil.position[0]);
    expect(reedX1).toBeGreaterThan(EM_LAYOUT.coil.position[0]);
    expect(EM_LAYOUT.poleN.position[1]).toBeGreaterThan(EM_LAYOUT.reed.position[1]);
    expect(EM_LAYOUT.poleS.position[1]).toBeLessThan(EM_LAYOUT.reed.position[1]);
    expect(EM_LAYOUT.reed.position[1]).toBe(EM_LAYOUT.coil.position[1]);
  });

  it("threads the spark timer tape through an open frame with the powder disc at its edge", () => {
    const tapeMinX = PUNCH_POINT_X - TAPE.width / 2;
    const tapeMaxX = PUNCH_POINT_X + TAPE.width / 2;
    const diskNearEdge =
      SPARK_LAYOUT.disc.position[0] - SPARK_LAYOUT.disc.radius;
    const discBottom =
      SPARK_LAYOUT.disc.position[1] - SPARK_LAYOUT.disc.thickness / 2;
    const tapeTop = TAPE.y + TAPE.thickness / 2;

    expect(SPARK_LAYOUT.head.position[1] + SPARK_LAYOUT.head.size[1] / 2).toBeLessThan(TAPE.y - TAPE.thickness / 2);
    expect(SPARK_LAYOUT.framePosts.every((post) => {
      const postMinX = post.position[0] - post.size[0] / 2;
      const postMaxX = post.position[0] + post.size[0] / 2;
      return postMaxX < tapeMinX || postMinX > tapeMaxX;
    })).toBe(true);
    expect(diskNearEdge).toBeCloseTo(PUNCH_POINT_X, 8);
    expect(Math.abs(discBottom - tapeTop)).toBeLessThan(0.003);
    expect(SPARK_LAYOUT.needle.position[1] + 0.08).toBeGreaterThan(tapeTop);
    expect(SPARK_LAYOUT.needle.position[1] + 0.08 - tapeTop).toBeCloseTo(0.011, 3);
  });

  it("rotates the spark powder disc in the paper's travel direction", () => {
    expect(SPARK_LAYOUT.disc.rollingRadius).toBe(SPARK_LAYOUT.disc.radius);
    expect(sparkDiscRotationRad(0)).toBe(0);
    expect(sparkDiscRotationRad(0.19)).toBeCloseTo(0.19 / SPARK_LAYOUT.disc.radius, 8);
  });

  it("keeps candy N/S and terminal polarities distinct", () => {
    expect(TICKER_CANDY.poleN).not.toBe(TICKER_CANDY.poleS);
    expect(TICKER_CANDY.terminalPositive).not.toBe(TICKER_CANDY.terminalNegative);
  });
});
