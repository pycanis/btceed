import { DetailedHTMLProps, InputHTMLAttributes } from "react";
import { useFormContext, type FieldValues, type RegisterOptions } from "react-hook-form";

type Props = {
  name: string;
  label: string;
  labelClassName?: string;
  registerOptions?: RegisterOptions<FieldValues, string>;
} & DetailedHTMLProps<InputHTMLAttributes<HTMLInputElement>, HTMLInputElement>;

export const Input = ({ label, name, labelClassName, registerOptions, className, ...rest }: Props) => {
  const { register } = useFormContext();

  return (
    <label className={labelClassName}>
      {label}

      <input
        {...register(name, registerOptions)}
        className={"w-full p-2 mb-4 rounded-lg border-2 border-black focus:outline-none focus:border-red-400".concat(
          " ",
          className || ""
        )}
        {...rest}
      />
    </label>
  );
};
