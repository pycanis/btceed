import { useGraphContext } from "../../../contexts/GraphContext/GraphContext";
import { useCsvExport } from "../../../hooks/useCsvExport";
import { CSVIcon } from "../../../icons/CSV";
import { ControlButton } from "./ControlButton";

export const Export = () => {
  const { isCsvExportLoading } = useGraphContext();
  const { downloadCsv } = useCsvExport();

  return (
    <ControlButton onClick={() => downloadCsv()} disabled={isCsvExportLoading} noBorder>
      <CSVIcon />
    </ControlButton>
  );
};
