import { useMemo, useState } from "react";
import { Button } from "../../../components/Button";
import { Link } from "../../../components/Link";
import { VITE_BLOCKCHAIN_EXPLORER_URL } from "../../../constants";
import { useGraphContext } from "../../../contexts/GraphContext/GraphContext";
import { ChangeIcon } from "../../../icons/Change";

type Props = {
  address: string;
};

export const OutputAddress = ({ address }: Props) => {
  const [showAddress, setShowAddress] = useState(false);
  const { labels } = useGraphContext();

  const label = useMemo(() => labels[address] ?? "", [labels, address]);

  return (
    <>
      <Link href={`${VITE_BLOCKCHAIN_EXPLORER_URL}/address/${address}`} target="_blank">
        {showAddress || !label ? address : label}
      </Link>

      {label && (
        <Button variant="text" className="ml-2 translate-y-1" onClick={() => setShowAddress(!showAddress)}>
          <ChangeIcon />
        </Button>
      )}
    </>
  );
};
