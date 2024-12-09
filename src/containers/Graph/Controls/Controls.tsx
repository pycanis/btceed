import { MiniMap, Node, Panel, useReactFlow } from "@xyflow/react";
import { useCallback, useEffect } from "react";
import { useSettingsContext } from "../../../contexts/SettingsContext";
import { Export } from "./Export";
import { Settings } from "./Settings";
import { Wallets } from "./Wallets";
import { Zoom } from "./Zoom";

export const Controls = () => {
  const { settings, isDarkMode } = useSettingsContext();
  const { fitView } = useReactFlow();

  useEffect(() => {
    // hack to fit into view on direction change
    setTimeout(() => {
      fitView();
    }, 0);
  }, [fitView, settings.direction, settings.showAddressesWithoutTransactions]);

  const getNodeColor = useCallback(
    (node: Node) => {
      const { nodeColors, nodeColorsDark } = settings;

      if (node.type === "xpubNode") {
        return isDarkMode ? nodeColorsDark.xpubNode : nodeColors.xpubNode;
      }

      switch (node.data.type) {
        case "xpubAddress":
          return isDarkMode ? nodeColorsDark.xpubAddress : nodeColors.xpubAddress;
        case "changeAddress":
          return isDarkMode ? nodeColorsDark.changeAddress : nodeColors.changeAddress;
        case "externalAddress":
          return isDarkMode ? nodeColorsDark.externalAddress : nodeColors.externalAddress;
        default:
          return "#ff0072";
      }
    },
    [isDarkMode, settings]
  );

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

      {settings.miniMap && <MiniMap zoomable pannable position="bottom-left" nodeColor={getNodeColor} />}
    </>
  );
};
