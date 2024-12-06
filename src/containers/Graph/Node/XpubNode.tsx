import { Handle, Position } from "@xyflow/react";
import { NodeProps } from "@xyflow/system";
import { useMemo } from "react";
import { Popover } from "../../../components/Popover";
import { SCRIPT_DERIVATION_PATH_BASE } from "../../../constants";
import { useSettingsContext } from "../../../contexts/SettingsContext";
import { useFormatValue } from "../../../hooks/useFormatValue";
import { Direction, XpubNode as XpubNodeType } from "../../../types";
import { getBothSideSubstring } from "../../../utils/strings";
import { BaseNode } from "./BaseNode";
import { BasePopoverContent } from "./BasePopoverContent";

const handleDirectionMap: Record<Direction, Position> = {
  TB: Position.Bottom,
  BT: Position.Top,
  LR: Position.Right,
  RL: Position.Left,
};

export const XpubNode = ({ id, data }: NodeProps<XpubNodeType>) => {
  const { settings, isDarkMode } = useSettingsContext();
  const { formatValue } = useFormatValue();

  const { totalReceived, totalSpent, totalFee, transactionsCount } = useMemo(() => data.totals, [data.totals]);

  return (
    <Popover
      triggerNode={
        <BaseNode id={id} style={{ backgroundColor: settings[isDarkMode ? "nodeColorsDark" : "nodeColors"].xpubNode }}>
          <p>{getBothSideSubstring(data.wallet.hdKey.publicExtendedKey)}</p>

          <Handle type="source" position={handleDirectionMap[settings.direction]} id={id} />
        </BaseNode>
      }
    >
      <BasePopoverContent
        header={<p className="font-bold text-lg">{data.wallet.hdKey.publicExtendedKey}</p>}
        derivation={SCRIPT_DERIVATION_PATH_BASE[data.wallet.scriptType]}
      >
        <p>
          Received <span className="font-bold">{formatValue(totalReceived)}</span>
        </p>

        <p>
          Spent <span className="font-bold">{formatValue(totalSpent + totalFee)}</span>
        </p>

        <p>
          Spent on fees <span className="font-bold">{formatValue(totalFee)}</span>
        </p>

        <p>
          Balance <span className="font-bold">{formatValue(totalReceived - totalSpent - totalFee)}</span>
        </p>

        <p>
          <span className="font-bold">{transactionsCount}</span> transactions
        </p>
      </BasePopoverContent>
    </Popover>
  );
};
