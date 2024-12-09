import { Panel, useReactFlow } from "@xyflow/react";
import { useEffect } from "react";
import { useSettingsContext } from "../../../contexts/SettingsContext";
import { Export } from "./Export";
import { Settings } from "./Settings";
import { Wallets } from "./Wallets";
import { Zoom } from "./Zoom";

export const Controls = () => {
  const { settings } = useSettingsContext();
  const { fitView } = useReactFlow();

  useEffect(() => {
    // hack to fit into view on direction change
    setTimeout(() => {
      fitView();
    }, 0);
  }, [fitView, settings.direction, settings.showAddressesWithoutTransactions]);

  return (
    <>
      <Panel position="top-right">
        <div className="border border-text rounded-md overflow-hidden dark:border-darkText shadow-2xl">
          <Wallets />

          <Settings />

          <Zoom />

          <Export />
        </div>
      </Panel>

      {/*       <MiniMap zoomable pannable /> */}
    </>
  );
};
