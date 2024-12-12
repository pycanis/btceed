import { Panel } from "@xyflow/react";
import heartUrl from "../../assets/heart.png";
import { Link } from "../../components/Link";
import { Popover } from "../../components/Popover";
import { GithubIcon } from "../../icons/Github";
import { GraphPopoverLayout } from "./GraphPopoverLayout";

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
        <GraphPopoverLayout header="Support">content</GraphPopoverLayout>
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
