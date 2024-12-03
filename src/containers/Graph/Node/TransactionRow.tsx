import { Link } from "../../../components/Link";
import { useConfigContext } from "../../../contexts/ConfigContext";
import { Transaction } from "../../../types";

type Props = { address?: string; transaction: Transaction };

export const TransactionRow = ({ address, transaction }: Props) => {
  const { blockExplorerUrl } = useConfigContext();

  return (
    <div className="ml-2">
      <Link href={`${blockExplorerUrl}/tx/${transaction.txid}`} target="_blank">
        {transaction.txid}
      </Link>{" "}
      on <span className="font-bold">{new Date(transaction.time * 1000).toLocaleString()}</span>
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
                <Link href={`${blockExplorerUrl}/address/${vout.scriptPubKey.address}`} target="_blank">
                  {vout.scriptPubKey.address}
                </Link>
              </>
            )}
          </p>
        ))}
    </div>
  );
};
