import { ReactNode } from "react";

export const BasePopoverContent = ({
  header,
  derivation,
  children,
}: {
  header: ReactNode;
  derivation?: string;
  children: ReactNode;
}) => {
  return (
    <div className="rounded-md max-w-screen-sm bg-bg dark:bg-darkBg p-2 break-words border border-text dark:border-darkText">
      {header}

      {derivation && <p className="italic my-2">{derivation}</p>}

      {children}
    </div>
  );
};
