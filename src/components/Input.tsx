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
        className={"w-full p-2 rounded-lg border-2 text-text dark:text-darkText bg-bg dark:bg-darkBg accent-primary dark:accent-primary border-text dark:border-darkText focus:outline-none focus:border-primary dark:focus:border-primary".concat(
          " ",
          className || ""
        )}
        {...rest}
      />
    </label>
  );
};
