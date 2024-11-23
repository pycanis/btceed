import { DetailedHTMLProps, InputHTMLAttributes } from "react";

export const Input = (props: DetailedHTMLProps<InputHTMLAttributes<HTMLInputElement>, HTMLInputElement>) => {
  return (
    <input
      {...props}
      className={"w-full p-2 mb-4 rounded-lg border-2 border-black focus:outline-none focus:border-red-400".concat(
        " ",
        props.className || ""
      )}
    />
  );
};
