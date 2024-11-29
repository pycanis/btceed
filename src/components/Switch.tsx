import { DetailedHTMLProps, InputHTMLAttributes } from "react";
import { useFormContext } from "react-hook-form";

type Props = {
  name: string;
  label: string;
} & DetailedHTMLProps<InputHTMLAttributes<HTMLInputElement>, HTMLInputElement>;

export const Switch = ({ name, label }: Props) => {
  const { register } = useFormContext();

  return (
    <label className="flex items-center cursor-pointer">
      <input {...register(name)} type="checkbox" className="sr-only peer" />
      <div className="relative w-11 h-6 peer-focus:ring-1 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600" />
      <span className="ml-2">{label}</span>
    </label>
  );
};
