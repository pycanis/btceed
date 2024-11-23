import { HDKey } from "@scure/bip32";
import { useState } from "react";
import { Button } from "../components/Button";
import { Input } from "../components/Input";
import { Modal } from "../components/Modal";
import { useWalletContext } from "../contexts/WalletContext";

export const XpubModal = () => {
  const { setWallets } = useWalletContext();
  const [xpub, setXpub] = useState("");

  const handleSubmit = () => {
    try {
      const hdKey = HDKey.fromExtendedKey(xpub);

      setWallets((prev) => [...prev, { hdKey, scriptType: "p2wpkh" }]);
    } catch (_) {
      alert("Invalid xpub");
    }
  };

  return (
    <Modal
      header="Enter xpub"
      closable={false}
      onClose={() => {
        console.log("close");
      }}
    >
      <Input value={xpub} onChange={(e) => setXpub(e.target.value)} />

      <Button size="sm" onClick={handleSubmit}>
        Submit
      </Button>
    </Modal>
  );
};
