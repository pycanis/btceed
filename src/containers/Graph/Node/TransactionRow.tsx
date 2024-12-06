import { Link } from "../../../components/Link";
import { SATS_IN_BTC, VITE_BLOCKCHAIN_EXPLORER_URL } from "../../../constants";
import { useGraphContext } from "../../../contexts/GraphContext/GraphContext";
import { useFormatValue } from "../../../hooks/useFormatValue";
import { Transaction } from "../../../types";

type Props = { address?: string; transaction: Transaction };

export const TransactionRow = ({ address, transaction }: Props) => {
  const { formatValue } = useFormatValue();

  const {
    addressEntriesAndTransactions: { calculateTransactionFeeInSats },
  } = useGraphContext();

  const fee = !address && calculateTransactionFeeInSats(transaction);

  return (
    <li className="ml-2">
      <Link href={`${VITE_BLOCKCHAIN_EXPLORER_URL}/tx/${transaction.txid}`} target="_blank">
        {transaction.txid}
      </Link>{" "}
      on <span className="font-bold">{new Date(transaction.time * 1000).toLocaleString()}</span>{" "}
      {fee && (
        <>
          with <span className="font-bold">{formatValue(fee)}</span> fee
        </>
      )}
      <ul className="list-disc list-inside marker:text-text dark:marker:text-darkText">
        {transaction.vout
          .filter((vout) => !address || vout.scriptPubKey.address === address)
          .map((vout, i) => (
            <li key={i} className="ml-4">
              <span className="font-bold">{formatValue(vout.value * SATS_IN_BTC)}</span>
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
            </li>
          ))}
      </ul>
    </li>
  );
};
