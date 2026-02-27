# Agent Guidance (Classroom Mode)

This repository is for high-school classroom demos.  
When designing or modifying animations/scenes, follow these rules by default.

## Non-Negotiable Principles

1. Classroom mode must be visually obvious.
2. Core teaching information must remain available at 1080P, even when controls are collapsed.
3. Do not ship scene behavior that depends on users opening hidden panels to see key outcomes.
4. Preserve touch-first interaction consistency across all scenes.

## Required Implementation Rules

1. Every new scene must declare `presentationSignals` on `SceneLayout`.
2. Key info blocks must include `data-presentation-signal` for runtime detection.
3. Every new scene must provide `coreSummary` for presentation fallback.
4. `coreSummary` should prioritize the smallest set of teach-critical values (3-5 lines).
5. Any classroom-mode change must include/adjust tests for layout behavior.

## 1080P Readability Baseline

1. In classroom mode, key status text should be readable from mid-class distance.
2. If a scene uses viewport-priority layout, collapsed state still needs visible core summary.
3. If the scene is chart-centric, default classroom behavior should keep chart+3D visible (`split`).

## References

- `docs/classroom-presentation-principles.md`
- `docs/presentation-signal-playbook.md`
