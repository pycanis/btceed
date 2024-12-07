import { Handle, Position } from "@xyflow/react";
import { NodeProps } from "@xyflow/system";
import { useMemo, useState } from "react";
import { Button } from "../../../components/Button";
import { Popover } from "../../../components/Popover";
import { SCRIPT_DERIVATION_PATH_BASE } from "../../../constants";
import { useGraphContext } from "../../../contexts/GraphContext/GraphContext";
import { useSettingsContext } from "../../../contexts/SettingsContext";
import { useFormatValue } from "../../../hooks/useFormatValue";
import { PencilIcon } from "../../../icons/Pencil";
import { Direction, XpubNode as XpubNodeType } from "../../../types";
import { truncateMiddleString, truncateString } from "../../../utils/strings";
import { BaseNode } from "./BaseNode";
import { BasePopoverContent } from "./BasePopoverContent";
import { LabelForm } from "./LabelForm";

const handleDirectionMap: Record<Direction, Position> = {
  TB: Position.Bottom,
  BT: Position.Top,
  LR: Position.Right,
  RL: Position.Left,
};

export const XpubNode = ({ id, data }: NodeProps<XpubNodeType>) => {
  const { settings, isDarkMode } = useSettingsContext();
  const { labels } = useGraphContext();
  const { formatValue } = useFormatValue();
  const [isEdittingLabel, setIsEdittingLabel] = useState(false);

  const { totalReceived, totalSpent, totalFee, transactionsCount } = useMemo(() => data.totals, [data.totals]);

  const xpub = useMemo(() => data.wallet.hdKey.publicExtendedKey, [data]);

  const label = useMemo(() => labels[xpub] ?? "", [labels, xpub]);

  return (
    <Popover
      triggerNode={
        <BaseNode id={id} style={{ backgroundColor: settings[isDarkMode ? "nodeColorsDark" : "nodeColors"].xpubNode }}>
          <p>{label ? truncateString(label) : truncateMiddleString(xpub)}</p>

          <Handle type="source" position={handleDirectionMap[settings.direction]} id={id} />
        </BaseNode>
      }
    >
      <BasePopoverContent
        header={
          <div>
            {label && !isEdittingLabel && (
              <div className="text-lg italic mb-2">
                <span>{label}</span>
                <Button variant="text" className="ml-2 translate-y-0.5" onClick={() => setIsEdittingLabel(true)}>
                  <PencilIcon />
                </Button>
              </div>
            )}

            {isEdittingLabel && <LabelForm id={xpub} label={label} onSubmit={() => setIsEdittingLabel(false)} />}

            <p className="font-bold text-lg">
              {xpub}
              {!label && !isEdittingLabel && (
                <Button variant="text" className="ml-2 translate-y-0.5" onClick={() => setIsEdittingLabel(true)}>
                  <PencilIcon />
                </Button>
              )}
            </p>
          </div>
        }
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
