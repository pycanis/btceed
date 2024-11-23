import { Background, BackgroundVariant, Controls, Panel, useReactFlow } from "@xyflow/react";
import { Dispatch, SetStateAction, useEffect } from "react";
import { Direction } from "../../types";

type Props = {
  direction: Direction;
  setDirection: Dispatch<SetStateAction<Direction>>;
};

export const GraphControls = ({ direction, setDirection }: Props) => {
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
      <Background color="red" variant={BackgroundVariant.Dots} />
      <Controls />
      {/*       <MiniMap zoomable pannable /> */}
    </>
  );
};
