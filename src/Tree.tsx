import dagre from "@dagrejs/dagre";
import {
  Background,
  BackgroundVariant,
  Controls,
  Edge,
  Handle,
  Node,
  NodeProps,
  Panel,
  Position,
  ReactFlow,
} from "@xyflow/react";
import { useEffect, useMemo, useState } from "react";
import { Address, ScriptType } from "./types";

import "@xyflow/react/dist/style.css";
import { ElectrumService } from "./ElectrumService";
import { useAddressesWithTransactions } from "./hooks/useAddressesWithTransactions";

const xpub = "";

const scriptType: ScriptType = "p2wpkh";

const NODE_WIDTH = 144;
const NODE_HEIGHT = 40;

const dagreGraph = new dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));

const getLayoutedElements = (nodes: Omit<Node, "position">[], edges: Edge[], isVertical: boolean) => {
  dagreGraph.setGraph({ rankdir: isVertical ? "TB" : "LR" });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const newNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);

    const newNode = {
      ...node,
      position: {
        x: nodeWithPosition.x - NODE_WIDTH / 2,
        y: nodeWithPosition.y - NODE_HEIGHT / 2,
      },
    };

    return newNode;
  });

  return { nodes: newNodes, edges };
};

const getNodesAndEdges = (addresses: Record<string, Address>, isVertical: boolean) => {
  const nodes: Omit<Node, "position">[] = [];
  const edges: Edge[] = [];

  const xpubNode: Omit<XpubNode, "position"> = {
    id: xpub,
    data: { xpub, isVertical },
    type: "xpubNode",
  };

  nodes.push(xpubNode);

  const parentLeaves = Object.values(addresses).filter((a, i) => !a.isChange && (a.transactions.length > 0 || i < 10));

  for (const address of parentLeaves) {
    const node: Omit<AddressNode, "position"> = {
      id: address.address,
      data: { ...address, isVertical },
      type: "addressNode",
    };

    nodes.push(node);

    edges.push({
      id: `${xpubNode.id}-${node.id}`,
      source: xpubNode.id,
      target: node.id,
    });
  }

  const createChildren = (children: Address[]) => {
    if (children.length === 0) {
      return;
    }

    const currentLevelChildren: Address[] = [];

    for (const child of children) {
      const spendTransactions = child.transactions.filter((t) =>
        t.vin.some((vin) =>
          child.transactions.some((tx) =>
            tx.vout.some(
              (vout) => tx.txid !== t.txid && vout.n === vin.vout && vout.scriptPubKey.address === child.address
            )
          )
        )
      );

      for (const spendTransaction of spendTransactions) {
        for (const vout of spendTransaction.vout) {
          const address = vout.scriptPubKey.address;

          // handle case when tx output goes back to address it's coming from
          if (address === child.address) {
            continue;
          }

          const addressObj = addresses[address];

          const node: Omit<AddressNode, "position"> = {
            id: address,
            data: { ...(addressObj || { address, transactions: [] }), isVertical },
            type: "addressNode",
          };

          nodes.push(node);

          edges.push({
            id: `${child.address}-${node.id}`,
            source: child.address,
            target: node.id,
          });

          if (addressObj) {
            currentLevelChildren.push(addressObj);
          }
        }
      }
    }

    createChildren(currentLevelChildren);
  };

  createChildren(parentLeaves);

  return getLayoutedElements(nodes, edges, isVertical);
};

type XpubNode = Node<
  {
    xpub: string;
    isVertical: boolean;
  },
  "xpubNode"
>;

type AddressNode = Node<
  {
    address: string;
    isVertical: boolean;
  },
  "addressNode"
>;

const XpubNode = ({ id, data }: NodeProps<XpubNode>) => {
  return (
    <div className="w-36 h-10 bg-green-400">
      {data.xpub}
      <Handle type="source" position={data.isVertical ? Position.Bottom : Position.Right} id={id} />
    </div>
  );
};

const AddressNode = ({ id, data }: NodeProps<AddressNode>) => {
  return (
    <div className="w-36 h-10 bg-red-400">
      {data.address}

      <Handle type="source" position={data.isVertical ? Position.Bottom : Position.Right} id={id} />

      <Handle type="target" position={data.isVertical ? Position.Top : Position.Left} id={id} />
    </div>
  );
};

const nodeTypes = { xpubNode: XpubNode, addressNode: AddressNode };

export const Tree = () => {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [isVertical, setIsVertical] = useState(true);

  const electrumService = useMemo(() => new ElectrumService("ws://192.168.4.11:50003"), []);

  const addresses = useAddressesWithTransactions(xpub, scriptType, electrumService);

  useEffect(() => {
    const { nodes, edges } = getNodesAndEdges(addresses, isVertical);

    setNodes(nodes);
    setEdges(edges);
  }, [addresses, isVertical]);

  console.log({ addresses, nodes, edges });

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      proOptions={{ hideAttribution: true }}
      fitView
      nodesDraggable={false}
      nodesConnectable={false}
      nodesFocusable={false}
      edgesFocusable={false}
      edgesReconnectable={false}
    >
      <Panel position="top-left">
        <button onClick={() => setIsVertical(!isVertical)}>{isVertical ? "horizontal" : "vertical"}</button>
      </Panel>
      <Background color="red" variant={BackgroundVariant.Dots} />
      <Controls />
      {/*       <MiniMap zoomable pannable /> */}
    </ReactFlow>
  );
};
