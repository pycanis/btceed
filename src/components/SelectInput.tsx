import { useFormContext, type FieldValues, type RegisterOptions } from "react-hook-form";

export type SelectOption = { label: string; value: string | number };

type Props = {
  name: string;
  options: SelectOption[];
  label: string;
  emptyLabel?: string;
  registerOptions?: RegisterOptions<FieldValues, string>;
} & React.DetailedHTMLProps<React.SelectHTMLAttributes<HTMLSelectElement>, HTMLSelectElement>;

export const SelectInput = ({ name, options, label, emptyLabel, registerOptions, className, ...rest }: Props) => {
  const { register } = useFormContext();

  return (
    <label>
      {label}

      <select
        {...(options && register(name, registerOptions))}
        className={"w-full p-2 mb-4 rounded-lg border-2 text-text dark:text-darkText bg-bg dark:bg-darkBg border-text dark:border-darkText focus:outline-none focus:border-primary dark:focus:border-darkPrimary".concat(
          " ",
          className || ""
        )}
        {...rest}
      >
        {emptyLabel && <option value={""}>{emptyLabel}</option>}

        {options?.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
};
