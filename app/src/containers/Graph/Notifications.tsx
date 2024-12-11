import { Panel } from "@xyflow/react";
import { useGraphContext } from "../../contexts/GraphContext/GraphContext";

export const Notifications = () => {
  const { isCsvExportLoading } = useGraphContext();

  if (!isCsvExportLoading) {
    return null;
  }

  return (
    <>
      <Panel className="w-full m-0 py-1 px-4 bg-darkBg dark:bg-bg text-darkText dark:text-text">
        Preparing CSV export. Fetching exchange rates..
      </Panel>
    </>
  );
};
