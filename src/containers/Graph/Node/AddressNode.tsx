import { Handle, NodeProps, Position } from "@xyflow/react";
import { useMemo, useState } from "react";
import { Button } from "../../../components/Button";
import { Link } from "../../../components/Link";
import { Popover } from "../../../components/Popover";
import { SCRIPT_DERIVATION_PATH_BASE, VITE_BLOCKCHAIN_EXPLORER_URL } from "../../../constants";
import { useGraphContext } from "../../../contexts/GraphContext/GraphContext";
import { useSettingsContext } from "../../../contexts/SettingsContext";
import { PencilIcon } from "../../../icons/Pencil";
import { AddressNode as AddressNodeType, Direction } from "../../../types";
import { truncateMiddleString, truncateString } from "../../../utils/strings";
import { BaseNode } from "./BaseNode";
import { BasePopoverContent } from "./BasePopoverContent";
import { LabelForm } from "./LabelForm";
import { TransactionRow } from "./TransactionRow";

const handleDirectionMap: { source: Record<Direction, Position>; target: Record<Direction, Position> } = {
  source: {
    TB: Position.Bottom,
    BT: Position.Top,
    LR: Position.Right,
    RL: Position.Left,
  },
  target: {
    TB: Position.Top,
    BT: Position.Bottom,
    LR: Position.Left,
    RL: Position.Right,
  },
};

export const AddressNode = ({ id, data }: NodeProps<AddressNodeType>) => {
  const { settings, isDarkMode } = useSettingsContext();
  const { labels } = useGraphContext();
  const [isEdittingLabel, setIsEdittingLabel] = useState(false);

  const receiveTransactions = useMemo(
    () =>
      data.transactions.filter((transaction) =>
        transaction.vout.some((vout) => vout.scriptPubKey.address === data.address)
      ),
    [data]
  );

  const spentTransactions = useMemo(
    () =>
      data.transactions.filter(
        (transaction) => !transaction.vout.some((vout) => vout.scriptPubKey.address === data.address)
      ),
    [data]
  );

  const backgroundColor = useMemo(
    () => settings[isDarkMode ? "nodeColorsDark" : "nodeColors"][data.type],
    [settings, isDarkMode, data.type]
  );

  const derivation = useMemo(
    () =>
      typeof data.isChange !== "undefined" && typeof data.index !== "undefined"
        ? `${SCRIPT_DERIVATION_PATH_BASE[data.wallet.scriptType]}/${data.isChange ? "1" : "0"}/${data.index}`
        : undefined,
    [data]
  );

  const label = useMemo(() => labels[data.address] ?? "", [labels, data.address]);

  return (
    <Popover
      triggerNode={
        <BaseNode id={id} style={{ backgroundColor }}>
          <p>{label ? truncateString(label) : truncateMiddleString(data.address)}</p>

          {spentTransactions.length > 0 && (
            <Handle type="source" position={handleDirectionMap.source[settings.direction]} id={id} />
          )}

          <Handle type="target" position={handleDirectionMap.target[settings.direction]} id={id} />
        </BaseNode>
      }
    >
      <BasePopoverContent
        header={
          <div>
            {label && !isEdittingLabel && (
              <div className="text-lg italic mb-2">
                <span className="mr-2">{label}</span>
                <Button variant="text" onClick={() => setIsEdittingLabel(true)}>
                  <PencilIcon />
                </Button>
              </div>
            )}

            {isEdittingLabel && (
              <LabelForm id={data.address} label={label} onSubmit={() => setIsEdittingLabel(false)} />
            )}

            <Link href={`${VITE_BLOCKCHAIN_EXPLORER_URL}/address/${data.address}`} target="_blank" className="text-lg">
              {data.address}
            </Link>

            {!label && !isEdittingLabel && (
              <Button variant="text" className="ml-2" onClick={() => setIsEdittingLabel(true)}>
                <PencilIcon />
              </Button>
            )}
          </div>
        }
        derivation={derivation}
      >
        {receiveTransactions.length > 0 && (
          <>
            <p className="mt-2">Received in</p>

            {receiveTransactions.map((transaction) => (
              <ul key={transaction.txid} className="list-disc list-inside marker:text-text dark:marker:text-darkText">
                <TransactionRow address={data.address} transaction={transaction} />
              </ul>
            ))}
          </>
        )}

        {spentTransactions.length > 0 && (
          <>
            <p className="mt-2">Spent as part of</p>

            {spentTransactions.map((transaction) => (
              <ul key={transaction.txid} className="list-disc list-inside marker:text-text dark:marker:text-darkText">
                <TransactionRow transaction={transaction} />
              </ul>
            ))}
          </>
        )}
      </BasePopoverContent>
    </Popover>
  );
};
