import { HDKey } from "@scure/bip32";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "../components/Button";
import { Input } from "../components/Input";
import { Modal } from "../components/Modal";
import { DB_XPUBS_COLLECTION, GET_DB_XPUBS } from "../constants";
import { useDatabaseContext } from "../contexts/DatabaseContext";

export const XpubModal = () => {
  const { db } = useDatabaseContext();
  const [xpub, setXpub] = useState("");
  const queryClient = useQueryClient();

  const handleSubmit = async () => {
    // @ts-expect-error db.get expects only number as identifier but string works too
    const existingXpub = await db.get(DB_XPUBS_COLLECTION, xpub);

    if (existingXpub) {
      return alert("Xpub already exists.");
    }

    try {
      HDKey.fromExtendedKey(xpub);

      await db.add(DB_XPUBS_COLLECTION, { xpub, scriptType: "p2wpkh" });

      await queryClient.invalidateQueries({ queryKey: [GET_DB_XPUBS] });
    } catch (_) {
      alert("Invalid xpub.");
    }
  };

  return (
    <Modal header="Enter xpub" closable={false}>
      <Input value={xpub} onChange={(e) => setXpub(e.target.value)} />

      <Button size="sm" onClick={handleSubmit}>
        Submit
      </Button>
    </Modal>
  );
};
