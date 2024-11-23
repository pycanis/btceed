type Variant = "contained" | "text" | "outlined";

type Size = "md" | "sm" | "lg";

type Props = {
  variant?: Variant;
  size?: Size;
} & React.DetailedHTMLProps<React.ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement>;

const variantStyles: Record<Variant, string> = {
  contained: "rounded-lg bg-slate-500 text-white shadow-sm hover:shadow-md hover:bg-opacity-90",
  outlined: "rounded-lg bg-white text-red shadow-sm hover:shadow-md border",
  text: "text-red hover:underline",
};

const sizeStyles: Record<Size, string> = {
  sm: "px-4 py-2",
  md: "px-6 py-3",
  lg: "px-8 py-4",
};

export const Button = ({ variant = "contained", size = "md", ...rest }: Props) => {
  return (
    <button
      {...rest}
      className={`font-semibold disabled:bg-black disabled:bg-opacity-60 transition duration-300 ${
        variantStyles[variant]
      } ${variant === "text" ? "" : sizeStyles[size]}`.concat(" ", rest.className || "")}
    />
  );
};
