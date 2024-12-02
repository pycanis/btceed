import { Handle, NodeProps, Position } from "@xyflow/react";
import { CSSProperties, ReactNode, useCallback, useMemo } from "react";
import { useSettingsContext } from "../../contexts/SettingsContext";
import { Direction, AddressNode as IAddressNode, XpubNode as XpubNodeType } from "../../types";
import { getBothSideSubstring } from "../../utils/strings";
import { useGraphContext } from "./GraphContext";

type Props = {
  id: string;
  children: ReactNode;
  style: CSSProperties;
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
    <BaseNode id={id} style={{ backgroundColor: settings[isDarkMode ? "nodeColorsDark" : "nodeColors"].xpubNode }}>
      <p>{getBothSideSubstring(data.xpub)}</p>

      <Handle type="source" position={handleDirectionMap[settings.direction]} id={id} />
    </BaseNode>
  );
};

const AddressNode = ({ id, data }: NodeProps<IAddressNode>) => {
  const { settings, isDarkMode } = useSettingsContext();

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

  const backgroundColor = useMemo(
    () => settings[isDarkMode ? "nodeColorsDark" : "nodeColors"][data.type],
    [settings, isDarkMode, data.type]
  );

  return (
    <BaseNode id={id} style={{ backgroundColor }}>
      <p>{getBothSideSubstring(data.address)}</p>

      {data.spendingTransactionLength > 0 && (
        <Handle type="source" position={handleDirectionMap.source[settings.direction]} id={id} />
      )}

      <Handle type="target" position={handleDirectionMap.target[settings.direction]} id={id} />
    </BaseNode>
  );
};

export const nodeTypes = { xpubNode: XpubNode, addressNode: AddressNode };
