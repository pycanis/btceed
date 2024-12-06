import { AnchorHTMLAttributes, DetailedHTMLProps } from "react";

type Props = DetailedHTMLProps<AnchorHTMLAttributes<HTMLAnchorElement>, HTMLAnchorElement>;

export const Link = ({ className, ...rest }: Props) => (
  <a className={"text-primary dark:text-primary font-bold hover:underline".concat(" ", className || "")} {...rest} />
);
