import { useMemo } from "react";
import { Link } from "../../../components/Link";
import { SATS_IN_BTC, VITE_BLOCKCHAIN_EXPLORER_URL } from "../../../constants";
import { useGraphContext } from "../../../contexts/GraphContext/GraphContext";
import { useExchangeRates } from "../../../hooks/useExchangeRates";
import { useFormatValue } from "../../../hooks/useFormatValue";
import { Transaction } from "../../../types";
import { OutputAddress } from "./OutputAddress";

type Props = { address?: string; transaction: Transaction };

export const TransactionRow = ({ address, transaction }: Props) => {
  const { formatValue } = useFormatValue();

  const {
    graphData: { calculateTransactionFeeInSats },
  } = useGraphContext();

  const exchangeRates = useExchangeRates(transaction.time);

  const fee = useMemo(
    () => !address && calculateTransactionFeeInSats(transaction),
    [address, calculateTransactionFeeInSats, transaction]
  );

  return (
    <li className="ml-2">
      <Link href={`${VITE_BLOCKCHAIN_EXPLORER_URL}/tx/${transaction.txid}`} target="_blank">
        {transaction.txid}
      </Link>{" "}
      on <span className="font-bold">{new Date(transaction.time * 1000).toLocaleString()}</span>{" "}
      {fee && (
        <>
          with <span className="font-bold">{formatValue(fee, exchangeRates)}</span> fee
        </>
      )}
      <ul className="list-disc list-inside marker:text-text dark:marker:text-darkText">
        {transaction.vout
          .filter((vout) => !address || vout.scriptPubKey.address === address)
          .map((vout, i) => (
            <li key={i} className="ml-4">
              <span className="font-bold">{formatValue(vout.value * SATS_IN_BTC, exchangeRates)}</span>
              {address ? (
                <>
                  {" "}
                  as output <span className="font-bold">{vout.n}</span>
                </>
              ) : (
                <>
                  {" "}
                  to <OutputAddress address={vout.scriptPubKey.address} />
                </>
              )}
            </li>
          ))}
      </ul>
    </li>
  );
};
