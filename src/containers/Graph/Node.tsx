import { Handle, NodeProps, Position } from "@xyflow/react";
import { useMemo } from "react";
import { AddressNodeType, Direction, AddressNode as IAddressNode, XpubNode as XpubNodeType } from "../../types";
import { getBothSideSubstring } from "../../utils/strings";

const nodeWrapperStyles = "w-24 h-6 rounded-lg text-xs flex justify-center items-center";

const XpubNode = ({ id, data }: NodeProps<XpubNodeType>) => {
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
    <div className={`${nodeWrapperStyles} bg-green-400 h-6`}>
      <p>{getBothSideSubstring(data.xpub)}</p>
      <Handle type="source" position={handleDirectionMap[data.direction]} id={id} />
    </div>
  );
};

const AddressNode = ({ id, data }: NodeProps<IAddressNode>) => {
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
    <div className={`${nodeWrapperStyles} ${addressNodeTypeMap[data.type]}`}>
      <p>{getBothSideSubstring(data.address)}</p>

      {data.spendingTransactionLength > 0 && (
        <Handle type="source" position={handleDirectionMap.source[data.direction]} id={id} />
      )}

      <Handle type="target" position={handleDirectionMap.target[data.direction]} id={id} />
    </div>
  );
};

export const nodeTypes = { xpubNode: XpubNode, addressNode: AddressNode };
