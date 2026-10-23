# scene3d: the 3D layer every scene shares

## Camera and framing

Every apparatus is framed from its own size: measured (or given) bounds are fitted into the
largest area of the canvas the panels leave free, once when the scene opens and again on a
view preset (`refitKey`), never per panel change. One view serves every screen size.

```
 scenes ──► FittedCanvas ─────────────► useAutoFittedCamera ─┐      (internal)
   │          └ FitBounds (measures children; NO_FIT opts out)│
   │                                                          ▼
   └──────► useFittedOrbitCamera + InteractiveCanvas ◄────────┘
              │  free areas: useViewportSize + useOverlayObstacles → freeRects
              │  picks the area that shows the apparatus largest
              ▼
            orbitFraming (pure geometry: bounds, fitCameraDistance, fitOrbitView, orbitPosition)

 InteractiveCanvas: the R3F canvas, orbit controls (cameraControls), screen offset through the
 projection (ProjectionOffset), camera sync (CameraSynchronizer / cameraSync), quality
 (canvasQuality) and presentation focus (usePresentationFocus / presentationCamera).
```

What a scene uses:

| Need | Use |
|---|---|
| An apparatus built from meshes | `<FittedCanvas shot={{ from, to }} …>`: measures the children and fits them. Floors, grids and backdrops carry `userData={NO_FIT}`; parts that sweep pass `shot.bounds`. |
| Bounds the scene computes itself (instruments, orbits) or a camera that must hold still while a part is dragged | `useFittedOrbitCamera(ref, refitKey, limits, (area) => fitOrbitView({ ...area, bounds, … }))`, spread `canvasProps` on `InteractiveCanvas` |
| Geometry (bounds, `boxAround`, `directionFrom`, view presets) | `orbitFraming` |

Everything else here is internal; a convention test (`scenes/__tests__/sceneConventions.test.ts`)
keeps scenes off it.

## Drawing

- `SceneLabel`: every text label (`tag`, `dark`, `text`, `badge`).
- `Arrow3D` (+ `arrowGeometry`): every vector, field direction and force.
- `ClassroomLine`: lines that thicken with classroom large text.
- `LabStage`, `SceneBackdrop`, `StudioEnvironment`, `useSceneTheme`: background, lights and day/night.
