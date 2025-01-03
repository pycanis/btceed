import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { Button } from "../../../components/Button";
import { Popover } from "../../../components/Popover";
import { GET_DB_WALLETS } from "../../../constants";
import { useDatabaseContext } from "../../../contexts/DatabaseContext";
import { useGraphContext } from "../../../contexts/GraphContext/GraphContext";
import { WalletIcon } from "../../../icons/Wallet";
import { truncateMiddleString, truncateString } from "../../../utils/strings";
import { WalletFormModal } from "../../WalletFormModal";
import { GraphPopoverLayout } from "../GraphPopoverLayout";
import { ControlButton } from "./ControlButton";

export const Wallets = () => {
  const { db } = useDatabaseContext();
  const queryClient = useQueryClient();
  const [addWalletModalOpened, setAddWalletModalOpened] = useState(false);
  const { labels } = useGraphContext();

  const { data: wallets = [] } = useQuery({
    queryKey: [GET_DB_WALLETS],
    queryFn: () => db.getAllFromIndex("wallets", "createdAt"),
  });

  const handleDelete = useCallback(
    async (xpub: string) => {
      await db.delete("wallets", xpub);

      await queryClient.invalidateQueries({ queryKey: [GET_DB_WALLETS] });
    },
    [db, queryClient]
  );

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
        <GraphPopoverLayout header="Wallets">
          {wallets.map((wallet, i) => (
            <div key={i} className="flex justify-between">
              <p>{labels[wallet.xpub] ? truncateString(labels[wallet.xpub]) : truncateMiddleString(wallet.xpub)}</p>

              <Button className="ml-2 text-red-500" variant="text" onClick={() => handleDelete(wallet.xpub)}>
                X
              </Button>
            </div>
          ))}

          <Button className="w-full mt-4" size="sm" onClick={() => setAddWalletModalOpened(true)}>
            Add wallet
          </Button>
        </GraphPopoverLayout>
      </Popover>

      {addWalletModalOpened && <WalletFormModal onClose={() => setAddWalletModalOpened(false)} />}
    </>
  );
};
