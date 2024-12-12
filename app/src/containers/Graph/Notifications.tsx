import { Panel } from "@xyflow/react";
import { useGraphContext } from "../../contexts/GraphContext/GraphContext";

export const Notifications = () => {
  const { isCsvExportLoading } = useGraphContext();

  return (
    <Panel className="w-full m-0">
      {import.meta.env.VITE_PUBLIC_ELECTRUM_SERVER_WARNING && (
        <div className="px-4 py-2 bg-red-800 text-darkText">{import.meta.env.VITE_PUBLIC_ELECTRUM_SERVER_WARNING}</div>
      )}

      {isCsvExportLoading && (
        <div className="px-4 py-2 bg-darkBg dark:bg-bg text-darkText dark:text-text">
          Preparing CSV export. Fetching exchange rates..
        </div>
      )}
    </Panel>
  );
};
