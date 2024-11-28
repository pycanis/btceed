import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo, useState } from "react";
import walletIcon from "../../../assets/wallet.svg";
import { Button } from "../../../components/Button";
import { Popover } from "../../../components/Popover";
import { DB_XPUBS_COLLECTION, GET_DB_XPUBS } from "../../../constants";
import { useDatabaseContext } from "../../../contexts/DatabaseContext";
import { getBothSideSubstring } from "../../../utils/strings";
import { getWallet } from "../../../utils/wallet";
import { XpubFormModal } from "../../XpubFormModal";
import { ControlButton } from "./ControlButton";

export const Wallets = () => {
  const { db } = useDatabaseContext();
  const queryClient = useQueryClient();
  const [addWalletModalOpened, setAddWalletModalOpened] = useState(false);

  const { data = [] } = useQuery({
    queryKey: [GET_DB_XPUBS],
    queryFn: () => db.getAll(DB_XPUBS_COLLECTION),
  });

  const handleDelete = useCallback(
    async (xpub: string) => {
      // @ts-expect-error db expects only number as identifier but string works too
      await db.delete(DB_XPUBS_COLLECTION, xpub);

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
            <img src={walletIcon} alt="Wallet icon." />
          </ControlButton>
        }
      >
        <div className="p-2">
          <p className="mb-2">Wallets</p>

          {wallets.map((wallet, i) => (
            <div key={i} className="flex">
              <p>
                {wallet.label} ({getBothSideSubstring(wallet.hdKey.publicExtendedKey)})
              </p>

              <span className="ml-2" onClick={() => handleDelete(wallet.hdKey.publicExtendedKey)}>
                X
              </span>
            </div>
          ))}

          <Button size="sm" onClick={() => setAddWalletModalOpened(true)}>
            Add wallet
          </Button>
        </div>
      </Popover>

      {addWalletModalOpened && <XpubFormModal onClose={() => setAddWalletModalOpened(false)} />}
    </>
  );
};
