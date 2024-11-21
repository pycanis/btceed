import { Handle, NodeProps, Position } from "@xyflow/react";
import { AddressNode as AddressNodeType, XpubNode as XpubNodeType } from "../types";

const XpubNode = ({ id, data }: NodeProps<XpubNodeType>) => {
  return (
    <div className="w-36 h-10 bg-green-400">
      {data.xpub}
      <Handle type="source" position={data.isVertical ? Position.Bottom : Position.Right} id={id} />
    </div>
  );
};

const AddressNode = ({ id, data }: NodeProps<AddressNodeType>) => {
  return (
    <div className="w-36 h-10 bg-red-400">
      {data.address}

      <Handle type="source" position={data.isVertical ? Position.Bottom : Position.Right} id={id} />

      <Handle type="target" position={data.isVertical ? Position.Top : Position.Left} id={id} />
    </div>
  );
};

export const nodeTypes = { xpubNode: XpubNode, addressNode: AddressNode };
