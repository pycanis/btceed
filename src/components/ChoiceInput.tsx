import { useFormContext } from "react-hook-form";

export type SelectOption = { label: string; value: string | number };

type Props = {
  name: string;
  options: SelectOption[];
  optionWidth?: string;
  label: string;
  className?: string;
};

export const ChoiceInput = ({ name, options, label, optionWidth, className }: Props) => {
  const { register } = useFormContext();

  return (
    <div className={className}>
      <p>{label}</p>

      <div className="flex w-fit rounded-xl overflow-hidden border border-primary dark:border-darkPrimary">
        {options.map((option) => (
          <div key={option.value} className="last-of-type:border-none border-r border-primary dark:border-darkPrimary">
            <input
              type="radio"
              {...register(name)}
              id={option.value as string}
              value={option.value}
              className="peer hidden"
            />
            <label
              htmlFor={option.value as string}
              className={"block text-center cursor-pointer p-2 peer-checked:font-bold peer-checked:bg-primary peer-checked:text-text dark:peer-checked:bg-darkPrimary dark:peer-checked:text-darkBg".concat(
                " ",
                optionWidth || ""
              )}
            >
              {option.label}
            </label>
          </div>
        ))}
      </div>
    </div>
  );
};
