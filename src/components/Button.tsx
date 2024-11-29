type Variant = "contained" | "text" | "outlined";

type Size = "md" | "sm" | "lg";

type Props = {
  variant?: Variant;
  size?: Size;
} & React.DetailedHTMLProps<React.ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement>;

const variantStyles: Record<Variant, string> = {
  contained: "rounded-lg bg-primary dark:bg-darkPrimary text-text shadow-sm hover:shadow-md hover:bg-opacity-90",
  outlined: "rounded-lg bg-text text-primary shadow-sm hover:shadow-md hover:bg-opacity-50 border-2 border-primary",
  text: "text-primary hover:underline",
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
      className={`font-semibold transition duration-300 ${variantStyles[variant]} ${
        variant === "text" ? "" : sizeStyles[size]
      }`.concat(" ", rest.className || "")}
    />
  );
};
