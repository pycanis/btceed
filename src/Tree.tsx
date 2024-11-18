import { useMemo } from "react";
import D3Tree, { RawNodeDatum } from "react-d3-tree";
import { ElectrumService } from "./ElectrumService";
import { useAddressesWithTransactions } from "./hooks/useAddressesWithTransactions";
import { Address, ScriptType } from "./types";

const xpub = "";

const scriptType: ScriptType = "p2wpkh";

const createChildren = (children: (RawNodeDatum & Address)[], addresses: Record<string, Address>) => {
  if (children.length === 0) {
    return;
  }

  for (const child of children) {
    child.children = [];

    const spendTransactions = child.transactions.filter((t) =>
      t.vin.some((vin) =>
        child.transactions.some((tx) =>
          tx.vout.some(
            (vout) => tx.txid !== t.txid && vout.n === vin.vout && vout.scriptPubKey.address === child.address
          )
        )
      )
    );

    const childChildren = spendTransactions
      .flatMap((tx) =>
        tx.vout.map(
          (vout) => addresses[vout.scriptPubKey.address] || { address: vout.scriptPubKey.address, transactions: [] }
        )
      )
      .map((address) => ({ ...address, name: address.address }));

    child.children = childChildren;
  }

  createChildren(
    children.flatMap((child) => child.children as (RawNodeDatum & Address)[]),
    addresses
  );
};

const makeTree = (addresses: Record<string, Address>) => {
  const tree = {
    name: xpub,
    children: Object.values(addresses)
      .filter((address) => !address.isChange && address.transactions.length > 0)
      .map((address) => ({ ...address, name: address.address })),
  };

  createChildren(tree.children, addresses);

  return tree;
};

export const Tree = () => {
  const electrumService = useMemo(() => new ElectrumService("ws://192.168.4.11:50003"), []);

  const addresses = useAddressesWithTransactions(xpub, scriptType, electrumService);

  const tree = makeTree(addresses);

  return (
    // `<Tree />` will fill width/height of its container; in this case `#treeWrapper`.
    <div id="treeWrapper" style={{ width: "100vw", height: "100vh" }}>
      <D3Tree data={tree} />
    </div>
  );
};
