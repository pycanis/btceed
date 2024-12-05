import { Link } from "../../../components/Link";
import { SATS_IN_BTC, VITE_BLOCKCHAIN_EXPLORER_URL } from "../../../constants";
import { useGraphContext } from "../../../contexts/GraphContext/GraphContext";
import { Transaction } from "../../../types";

type Props = { address?: string; transaction: Transaction; xpub?: string };

export const TransactionRow = ({ address, transaction, xpub }: Props) => {
  const {
    addressEntriesAndTransactions: { calculateTransactionFeeInSats },
  } = useGraphContext();
  const fee = !address && xpub && calculateTransactionFeeInSats(transaction, xpub);

  return (
    <div className="ml-2">
      <Link href={`${VITE_BLOCKCHAIN_EXPLORER_URL}/tx/${transaction.txid}`} target="_blank">
        {transaction.txid}
      </Link>{" "}
      on <span className="font-bold">{new Date(transaction.time * 1000).toLocaleString()}</span>{" "}
      {fee && (
        <>
          with <span className="font-bold">{fee / SATS_IN_BTC}</span> BTC fee
        </>
      )}
      {transaction.vout
        .filter((vout) => !address || vout.scriptPubKey.address === address)
        .map((vout, i) => (
          <p key={i} className="ml-4">
            <span className="font-bold">{vout.value}</span> BTC
            {address ? (
              <>
                {" "}
                as output <span className="font-bold">{vout.n}</span>
              </>
            ) : (
              <>
                {" "}
                to{" "}
                <Link href={`${VITE_BLOCKCHAIN_EXPLORER_URL}/address/${vout.scriptPubKey.address}`} target="_blank">
                  {vout.scriptPubKey.address}
                </Link>
              </>
            )}
          </p>
        ))}
    </div>
  );
};
