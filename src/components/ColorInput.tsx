import { DetailedHTMLProps, InputHTMLAttributes } from "react";
import { useFormContext, type FieldValues, type RegisterOptions } from "react-hook-form";

type Props = {
  name: string;
  label: string;
  registerOptions?: RegisterOptions<FieldValues, string>;
} & DetailedHTMLProps<InputHTMLAttributes<HTMLInputElement>, HTMLInputElement>;

export const ColorInput = ({ label, name, registerOptions, className, ...rest }: Props) => {
  const { register } = useFormContext();

  return (
    <div className={"flex items-center gap-2".concat(" ", className || "")}>
      <input
        {...register(name, registerOptions)}
        id={name}
        className={"w-10 h-10 rounded-md border-2 border-text dark:border-darkText cursor-pointer"}
        {...rest}
      />

      <label htmlFor={name} className="cursor-pointer">
        {label}
      </label>
    </div>
  );
};
