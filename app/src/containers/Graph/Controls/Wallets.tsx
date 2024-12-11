import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo, useState } from "react";
import { Button } from "../../../components/Button";
import { Popover } from "../../../components/Popover";
import { GET_DB_XPUBS } from "../../../constants";
import { useDatabaseContext } from "../../../contexts/DatabaseContext";
import { useGraphContext } from "../../../contexts/GraphContext/GraphContext";
import { WalletIcon } from "../../../icons/Wallet";
import { truncateMiddleString, truncateString } from "../../../utils/strings";
import { getWallet } from "../../../utils/wallet";
import { XpubFormModal } from "../../XpubFormModal";
import { ControlButton } from "./ControlButton";
import { ControlPopoverLayout } from "./ControlPopoverLayout";

export const Wallets = () => {
  const { db } = useDatabaseContext();
  const queryClient = useQueryClient();
  const [addWalletModalOpened, setAddWalletModalOpened] = useState(false);
  const { labels } = useGraphContext();

  const { data = [] } = useQuery({
    queryKey: [GET_DB_XPUBS],
    queryFn: () => db.getAllFromIndex("xpubs", "createdAt"),
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
        placement="left-start"
        triggerNode={
          <ControlButton>
            <WalletIcon />
          </ControlButton>
        }
      >
        <ControlPopoverLayout header="Wallets">
          {wallets.map((wallet, i) => (
            <div key={i} className="flex justify-between">
              <p>
                {labels[wallet.hdKey.publicExtendedKey]
                  ? truncateString(labels[wallet.hdKey.publicExtendedKey])
                  : truncateMiddleString(wallet.hdKey.publicExtendedKey)}
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

          <Button className="w-full mt-4" size="sm" onClick={() => setAddWalletModalOpened(true)}>
            Add wallet
          </Button>
        </ControlPopoverLayout>
      </Popover>

      {addWalletModalOpened && <XpubFormModal onClose={() => setAddWalletModalOpened(false)} />}
    </>
  );
};
