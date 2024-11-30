import { zodResolver } from "@hookform/resolvers/zod";
import { HDKey } from "@scure/bip32";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { TypeOf, z } from "zod";
import { Button } from "../components/Button";
import { Form } from "../components/Form";
import { Input } from "../components/Input";
import { Modal } from "../components/Modal";
import { SelectInput, SelectOption } from "../components/SelectInput";
import { GET_DB_XPUBS } from "../constants";
import { useDatabaseContext } from "../contexts/DatabaseContext";
import { ScriptType } from "../types";

const scriptTypeOptions: SelectOption[] = [
  { value: ScriptType.P2WPKH, label: "Native Segwit (P2WPKH)" },
  { value: ScriptType.P2TR, label: "Taproot (P2TR)" },
  { value: ScriptType.P2PKH, label: "Legacy (P2PKH)" },
];

const schema = z.object({
  xpub: z.string().min(1),
  scriptType: z.nativeEnum(ScriptType),
});

type FormValues = TypeOf<typeof schema>;

type Props = { onClose?: () => void };

export const XpubFormModal = ({ onClose }: Props) => {
  const { db } = useDatabaseContext();
  const queryClient = useQueryClient();

  const handleSubmit = useCallback(
    async ({ xpub, scriptType }: FormValues) => {
      const existingXpub = await db.get("xpubs", xpub);

      if (existingXpub) {
        return alert("Xpub already exists.");
      }

      try {
        HDKey.fromExtendedKey(xpub);

        await db.add("xpubs", { xpub, scriptType, createdAt: Date.now() });

        await queryClient.invalidateQueries({ queryKey: [GET_DB_XPUBS] });
      } catch (_) {
        alert("Invalid xpub.");
      }
    },
    [db, queryClient]
  );

  return (
    <Modal header="Add wallet" onClose={onClose}>
      <Form onSubmit={handleSubmit} resolver={zodResolver(schema)}>
        <Input name="xpub" label="Xpub" placeholder="xpub6.." />

        <SelectInput name="scriptType" label="Script type" options={scriptTypeOptions} />

        <Button size="sm" type="submit">
          Submit
        </Button>
      </Form>
    </Modal>
  );
};
