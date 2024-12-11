import { Panel } from "@xyflow/react";
import { GithubIcon } from "../../icons/Github";
import { HeartIcon } from "../../icons/Heart";

export const Links = () => {
  return (
    <Panel position="bottom-right" className="flex items-center gap-2">
      <GithubIcon />
      <HeartIcon />
    </Panel>
  );
};
