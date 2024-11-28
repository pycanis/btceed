import { ButtonHTMLAttributes, DetailedHTMLProps } from "react";

type Props = DetailedHTMLProps<ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement>;

export const ControlButton = ({ children, ...rest }: Props) => {
  return (
    <button
      className="flex items-center justify-center enabled:hover:bg-gray-200 last-of-type:border-none border-b border-gray-200 bg-white w-7 h-7 p-1"
      {...rest}
    >
      {children}
    </button>
  );
};
