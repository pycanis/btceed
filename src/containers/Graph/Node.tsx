import { Handle, NodeProps, Position } from "@xyflow/react";
import { CSSProperties, ReactNode, useCallback, useMemo } from "react";
import { Link } from "../../components/Link";
import { Popover } from "../../components/Popover";
import { SCRIPT_DERIVATION_PATH_BASE } from "../../constants";
import { useConfigContext } from "../../contexts/ConfigContext";
import { useSettingsContext } from "../../contexts/SettingsContext";
import { Direction, AddressNode as IAddressNode, Transaction, XpubNode as XpubNodeType } from "../../types";
import { getBothSideSubstring } from "../../utils/strings";
import { useGraphContext } from "./GraphContext";

type Props = {
  id: string;
  children: ReactNode;
  style: CSSProperties;
};

const TransactionRow = ({ address, transaction }: { address?: string; transaction: Transaction }) => {
  const { blockExplorerUrl } = useConfigContext();

  return (
    <div className="ml-2">
      <Link href={`${blockExplorerUrl}/tx/${transaction.txid}`} target="_blank">
        {transaction.txid}
      </Link>{" "}
      on <span className="font-bold">{new Date(transaction.time * 1000).toLocaleString()}</span>
      {transaction.vout
        .filter((vout) => !address || vout.scriptPubKey.address === address)
        .map((vout, i) => (
          <p key={i} className="ml-4">
            <span className="font-bold">{vout.value}</span> BTC
            {address ? (
              <>
                {" "}
                as output <span className="font-bold">{vout.n}</span>
              </>
            ) : (
              <>
                {" "}
                to{" "}
                <Link href={`${blockExplorerUrl}/address/${vout.scriptPubKey.address}`} target="_blank">
                  {vout.scriptPubKey.address}
                </Link>
              </>
            )}
          </p>
        ))}
    </div>
  );
};

const BasePopoverContent = ({
  header,
  derivation,
  children,
}: {
  header: ReactNode;
  derivation?: string;
  children: ReactNode;
}) => {
  return (
    <div className="rounded-md max-w-screen-sm bg-bg dark:bg-darkBg p-2 break-words border border-text dark:border-darkText">
      {header}

      {derivation && <p className="italic my-2">{derivation}</p>}

      {children}
    </div>
  );
};

const BaseNode = ({ id, children, style }: Props) => {
  const { setHoveredNodeId } = useGraphContext();

  const handleMouseEnter = useCallback(() => setHoveredNodeId(id), [id, setHoveredNodeId]);
  const handleMouseLeave = useCallback(() => setHoveredNodeId(null), [setHoveredNodeId]);

  return (
    <div
      className="w-28 h-6 rounded-md text-xs font-bold flex justify-center items-center border-2 border-text dark:border-darkText"
      style={style}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
    </div>
  );
};

const XpubNode = ({ id, data }: NodeProps<XpubNodeType>) => {
  const { settings, isDarkMode } = useSettingsContext();

  const handleDirectionMap = useMemo<Record<Direction, Position>>(
    () => ({
      TB: Position.Bottom,
      BT: Position.Top,
      LR: Position.Right,
      RL: Position.Left,
    }),
    []
  );

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
        <p>Total balance</p>
      </BasePopoverContent>
    </Popover>
  );
};

const AddressNode = ({ id, data }: NodeProps<IAddressNode>) => {
  const { settings, isDarkMode } = useSettingsContext();
  const { blockExplorerUrl } = useConfigContext();

  const handleDirectionMap = useMemo<{ source: Record<Direction, Position>; target: Record<Direction, Position> }>(
    () => ({
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
    }),
    []
  );

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

export const nodeTypes = { xpubNode: XpubNode, addressNode: AddressNode };
