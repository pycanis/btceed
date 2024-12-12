import { Panel } from "@xyflow/react";
import btcAddressUrl from "../../assets/bc1qfqelvzuqqkkmnxhdee5277ujvkmemexcz8cw04.png";
import heartUrl from "../../assets/heart.png";
import lnurlUrl from "../../assets/ln@btceed.live.png";
import { Copy } from "../../components/Copy";
import { Link } from "../../components/Link";
import { Popover } from "../../components/Popover";
import { GithubIcon } from "../../icons/Github";
import { GraphPopoverLayout } from "./GraphPopoverLayout";

const btcAddress = "bc1qfqelvzuqqkkmnxhdee5277ujvkmemexcz8cw04";
const lnAddress = "ln@btceed.live";

export const Links = () => {
  return (
    <Panel position="bottom-right" className="flex flex-col items-center">
      <Popover
        placement="left-start"
        triggerNode={
          <img
            src={heartUrl}
            className="w-16 h-16 hover:brightness-95 hover:dark:brightness-110 cursor-pointer transition"
            alt="Heart."
          />
        }
      >
        <GraphPopoverLayout header="Support the author">
          <div className="max-w-64 break-all">
            <div className="mb-4">
              <p className="font-bold mb-2">Lightning</p>

              <img src={lnurlUrl} alt="LNURL" className="w-40 h-40 mb-2" />

              <div className="inline-flex">
                <span className="mr-2">{lnAddress}</span>{" "}
                <Copy onClick={() => navigator.clipboard.writeText(lnAddress)} />
              </div>
            </div>

            <div>
              <p className="font-bold mb-2">On-chain</p>

              <img src={btcAddressUrl} alt={btcAddress} className="w-40 h-40 mb-2" />

              <div className="flex items-center">
                <span className="mr-2">{btcAddress}</span>

                <div>
                  <Copy onClick={() => navigator.clipboard.writeText(btcAddress)} />
                </div>
              </div>
            </div>
          </div>
        </GraphPopoverLayout>
      </Popover>

      <Link
        href="https://github.com"
        target="_blank"
        className="mt-2 hover:brightness-150 hover:dark:brightness-95 transition bg-bg dark:bg-darkBg rounded-full"
      >
        <GithubIcon />
      </Link>
    </Panel>
  );
};
