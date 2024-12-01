import { Handle, NodeProps, Position } from "@xyflow/react";
import { ReactNode, useCallback, useMemo } from "react";
import { useSettingsContext } from "../../contexts/SettingsContext";
import { AddressNodeType, Direction, AddressNode as IAddressNode, XpubNode as XpubNodeType } from "../../types";
import { getBothSideSubstring } from "../../utils/strings";
import { useGraphContext } from "./GraphContext";

type Props = {
  id: string;
  className?: string;
  children: ReactNode;
};
const BaseNode = ({ id, className, children }: Props) => {
  const { setHoveredNodeId } = useGraphContext();

  const handleMouseEnter = useCallback(() => setHoveredNodeId(id), [id, setHoveredNodeId]);
  const handleMouseLeave = useCallback(() => setHoveredNodeId(null), [setHoveredNodeId]);

  return (
    <div
      className={"w-24 h-6 rounded-lg text-xs flex justify-center items-center".concat(" ", className || "")}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
    </div>
  );
};

const XpubNode = ({ id, data }: NodeProps<XpubNodeType>) => {
  const { settings } = useSettingsContext();

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
    <BaseNode id={id} className="bg-green-400 h-6">
      <p>{getBothSideSubstring(data.xpub)}</p>
      <Handle type="source" position={handleDirectionMap[settings.direction]} id={id} />
    </BaseNode>
  );
};

const AddressNode = ({ id, data }: NodeProps<IAddressNode>) => {
  const { settings } = useSettingsContext();

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

  const addressNodeTypeMap = useMemo<Record<AddressNodeType, string>>(
    () => ({
      changeAddress: "bg-red-400",
      externalAddress: "bg-gray-400",
      xpubAddress: "bg-yellow-400",
    }),
    []
  );

  return (
    <BaseNode id={id} className={`${addressNodeTypeMap[data.type]}`}>
      <p>{getBothSideSubstring(data.address)}</p>

      {data.spendingTransactionLength > 0 && (
        <Handle type="source" position={handleDirectionMap.source[settings.direction]} id={id} />
      )}

      <Handle type="target" position={handleDirectionMap.target[settings.direction]} id={id} />
    </BaseNode>
  );
};

export const nodeTypes = { xpubNode: XpubNode, addressNode: AddressNode };
