import { ButtonHTMLAttributes, DetailedHTMLProps } from "react";

type Props = {
  noBorder?: boolean;
} & DetailedHTMLProps<ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement>;

export const ControlButton = ({ children, noBorder = false, ...rest }: Props) => {
  return (
    <button
      className={"flex items-center justify-center border-b disabled:opacity-50 enabled:hover:bg-opacity-80 border-text dark:border-darkText bg-bg dark:bg-darkBg w-8 h-8 p-1.5".concat(
        " ",
        noBorder ? "border-none" : ""
      )}
      {...rest}
    >
      {children}
    </button>
  );
};
