import { Panel, useReactFlow } from "@xyflow/react";
import { Dispatch, SetStateAction, useEffect } from "react";
import { Direction } from "../../../types";
import { Settings } from "./Settings";
import { Wallets } from "./Wallets";
import { Zoom } from "./Zoom";

type Props = {
  direction: Direction;
  setDirection: Dispatch<SetStateAction<Direction>>;
};

export const Controls = ({ direction, setDirection }: Props) => {
  const { fitView } = useReactFlow();

  useEffect(() => {
    // hack to fit into view on direction change
    setTimeout(() => {
      fitView();
    }, 0);
  }, [fitView, direction]);

  return (
    <>
      <Panel position="top-left">
        <button onClick={() => setDirection("TB")}>top-bottom</button>
        <button onClick={() => setDirection("LR")}>left-right</button>
        <button onClick={() => setDirection("BT")}>bottom-top</button>
        <button onClick={() => setDirection("RL")}>right-left</button>
      </Panel>

      <Panel position="top-right">
        <div className="border border-text rounded-md overflow-hidden dark:border-darkText shadow-2xl">
          <Wallets />

          <Settings />

          <Zoom />
        </div>
      </Panel>

      {/*       <MiniMap zoomable pannable /> */}
    </>
  );
};
