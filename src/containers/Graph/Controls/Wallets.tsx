import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo, useState } from "react";
import { Button } from "../../../components/Button";
import { Popover } from "../../../components/Popover";
import { GET_DB_XPUBS } from "../../../constants";
import { useDatabaseContext } from "../../../contexts/DatabaseContext";
import { WalletIcon } from "../../../icons/Wallet";
import { getBothSideSubstring } from "../../../utils/strings";
import { getWallet } from "../../../utils/wallet";
import { XpubFormModal } from "../../XpubFormModal";
import { ControlButton } from "./ControlButton";
import { ControlPopoverLayout } from "./ControlPopoverLayout";

export const Wallets = () => {
  const { db } = useDatabaseContext();
  const queryClient = useQueryClient();
  const [addWalletModalOpened, setAddWalletModalOpened] = useState(false);

  const { data = [] } = useQuery({
    queryKey: [GET_DB_XPUBS],
    queryFn: () => db.getAll("xpubs"),
  });

  const handleDelete = useCallback(
    async (xpub: string) => {
      await db.delete("xpubs", xpub);

      await queryClient.invalidateQueries({ queryKey: [GET_DB_XPUBS] });
    },
    [db, queryClient]
  );

  const wallets = useMemo(() => data.map(getWallet), [data]);

  return (
    <>
      <Popover
        triggerNode={
          <ControlButton>
            <WalletIcon />
          </ControlButton>
        }
      >
        <ControlPopoverLayout header="Wallets">
          {wallets.map((wallet, i) => (
            <div key={i} className="flex">
              <p>
                {getBothSideSubstring(wallet.hdKey.publicExtendedKey)} {wallet.label ? `(${wallet.label})` : ""}
              </p>

              <Button
                className="ml-2 text-red-500"
                variant="text"
                onClick={() => handleDelete(wallet.hdKey.publicExtendedKey)}
              >
                X
              </Button>
            </div>
          ))}

          <Button className="mt-4" size="sm" onClick={() => setAddWalletModalOpened(true)}>
            Add wallet
          </Button>
        </ControlPopoverLayout>
      </Popover>

      {addWalletModalOpened && <XpubFormModal onClose={() => setAddWalletModalOpened(false)} />}
    </>
  );
};
