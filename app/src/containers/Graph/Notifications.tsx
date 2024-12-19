import { Panel } from "@xyflow/react";
import { Link } from "../../components/Link";
import { useGraphContext } from "../../contexts/GraphContext/GraphContext";

export const Notifications = () => {
  const { isCsvExportLoading } = useGraphContext();

  return (
    <Panel className="w-full m-0">
      {import.meta.env.VITE_PUBLIC_DISPLAY_PUBLIC_WARNING && (
        <div className="px-4 py-2 bg-red-800 text-darkText">
          Warning! This instance is using a public electrum server. You should assume it can see your transactions.
          Learn about{" "}
          <Link href="https://docs.btceed.live/self-host" target="_blank">
            hosting your own instance
          </Link>
          .
        </div>
      )}

      {isCsvExportLoading && (
        <div className="px-4 py-2 bg-darkBg dark:bg-bg text-darkText dark:text-text">
          Preparing CSV export. Fetching exchange rates..
        </div>
      )}
    </Panel>
  );
};
