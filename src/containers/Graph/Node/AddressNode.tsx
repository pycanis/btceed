import { Handle, NodeProps, Position } from "@xyflow/react";
import { useMemo } from "react";
import { Link } from "../../../components/Link";
import { Popover } from "../../../components/Popover";
import { SCRIPT_DERIVATION_PATH_BASE } from "../../../constants";
import { useConfigContext } from "../../../contexts/ConfigContext";
import { useSettingsContext } from "../../../contexts/SettingsContext";
import { AddressNode as AddressNodeType, Direction } from "../../../types";
import { getBothSideSubstring } from "../../../utils/strings";
import { BaseNode } from "./BaseNode";
import { BasePopoverContent } from "./BasePopoverContent";
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
  const { blockExplorerUrl } = useConfigContext();

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

  return (
    <Popover
      triggerNode={
        <BaseNode id={id} style={{ backgroundColor }}>
          <p>{getBothSideSubstring(data.address)}</p>

          {spentTransactions.length > 0 && (
            <Handle type="source" position={handleDirectionMap.source[settings.direction]} id={id} />
          )}

          <Handle type="target" position={handleDirectionMap.target[settings.direction]} id={id} />
        </BaseNode>
      }
    >
      <BasePopoverContent
        header={
          <Link href={`${blockExplorerUrl}/address/${data.address}`} target="_blank" className="text-lg">
            {data.address}
          </Link>
        }
        derivation={derivation}
      >
        {receiveTransactions.length > 0 && (
          <>
            <p>Received in</p>

            {receiveTransactions.map((transaction) => (
              <TransactionRow key={transaction.txid} address={data.address} transaction={transaction} />
            ))}
          </>
        )}

        {spentTransactions.length > 0 && (
          <>
            <p className="mt-2">Spent as part of</p>

            {spentTransactions.map((transaction) => (
              <TransactionRow key={transaction.txid} transaction={transaction} />
            ))}
          </>
        )}
      </BasePopoverContent>
    </Popover>
  );
};
