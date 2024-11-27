import { Controls, Panel, useReactFlow, useStore } from "@xyflow/react";
import { Dispatch, SetStateAction, useEffect, useMemo } from "react";
import walletIcon from "../../assets/wallet.svg";
import { Popover } from "../../components/Popover";
import { Direction } from "../../types";
import { GraphButton } from "./GraphButton";

type Props = {
  direction: Direction;
  setDirection: Dispatch<SetStateAction<Direction>>;
};

export const GraphControls = ({ direction, setDirection }: Props) => {
  const { fitView, zoomOut, zoomIn } = useReactFlow();

  const { zoomLevel, minZoom, maxZoom } = useStore((s) => ({
    zoomLevel: s.transform[2],
    maxZoom: s.maxZoom,
    minZoom: s.minZoom,
  }));

  useEffect(() => {
    // hack to fit into view on direction change
    setTimeout(() => {
      fitView();
    }, 0);
  }, [fitView, direction]);

  const { zoomInDisabled, zoomOutDisabled } = useMemo(
    () => ({ zoomInDisabled: zoomLevel === maxZoom, zoomOutDisabled: zoomLevel === minZoom }),
    [zoomLevel, maxZoom, minZoom]
  );

  return (
    <>
      <Panel position="top-left">
        <button onClick={() => setDirection("TB")}>top-bottom</button>
        <button onClick={() => setDirection("LR")}>left-right</button>
        <button onClick={() => setDirection("BT")}>bottom-top</button>
        <button onClick={() => setDirection("RL")}>right-left</button>
      </Panel>

      <Panel position="top-right">
        <div className="border border-gray-200 shadow-2xl">
          <Popover
            triggerNode={
              <GraphButton>
                <img src={walletIcon} alt="Wallet icon." />
              </GraphButton>
            }
          >
            <div className="w-20 h-20">hello</div>
          </Popover>

          <GraphButton onClick={() => zoomIn()} disabled={zoomInDisabled}>
            <span className={`font-thin text-xl ${zoomInDisabled ? "opacity-50" : ""}`}>+</span>
          </GraphButton>

          <GraphButton onClick={() => zoomOut()} disabled={zoomOutDisabled}>
            <span className={`font-thin text-xl -translate-y-px ${zoomOutDisabled ? "opacity-50" : ""}`}>-</span>
          </GraphButton>
        </div>
      </Panel>

      {/*       <Background color="red" variant={BackgroundVariant.Dots} />  */}

      <Controls position="bottom-right" showInteractive={false} />
      {/*       <MiniMap zoomable pannable /> */}
    </>
  );
};
