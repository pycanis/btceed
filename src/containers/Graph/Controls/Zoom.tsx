import { ControlButton, useReactFlow, useStore } from "@xyflow/react";
import { useMemo } from "react";

export const Zoom = () => {
  const { zoomOut, zoomIn } = useReactFlow();

  const { zoomLevel, minZoom, maxZoom } = useStore((s) => ({
    zoomLevel: s.transform[2],
    maxZoom: s.maxZoom,
    minZoom: s.minZoom,
  }));

  const { zoomInDisabled, zoomOutDisabled } = useMemo(
    () => ({ zoomInDisabled: zoomLevel === maxZoom, zoomOutDisabled: zoomLevel === minZoom }),
    [zoomLevel, maxZoom, minZoom]
  );

  return (
    <>
      <ControlButton onClick={() => zoomIn()} disabled={zoomInDisabled}>
        <span className={`font-thin text-xl ${zoomInDisabled ? "opacity-50" : ""}`}>+</span>
      </ControlButton>

      <ControlButton onClick={() => zoomOut()} disabled={zoomOutDisabled}>
        <span className={`font-thin text-xl -translate-y-px ${zoomOutDisabled ? "opacity-50" : ""}`}>-</span>
      </ControlButton>
    </>
  );
};
