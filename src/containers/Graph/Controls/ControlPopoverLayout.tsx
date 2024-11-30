import { ReactNode } from "react";

type Props = { header: string; children: ReactNode };

export const ControlPopoverLayout = ({ header, children }: Props) => {
  return (
    <div className="p-4 bg-bg rounded-md dark:bg-darkBg border dark:border-darkText border-text shadow-2xl w-max">
      <p className="mb-2 font-bold">{header}</p>

      {children}
    </div>
  );
};
