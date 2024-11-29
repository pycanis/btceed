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
      <div
        className={`relative w-11 h-6 peer-focus:ring-1 peer-focus:ring-primary dark:peer-focus:ring-darkPrimary
         rounded-full peer bg-text dark:bg-bg peer-checked:after:translate-x-full
         after:absolute after:top-[2px] after:start-[2px]
         after:bg-bg dark:after:bg-text after:border after:rounded-full after:h-5 after:w-5
         after:transition-all  dark:peer-checked:bg-primary peer-checked:bg-darkPrimary`}
      />
      <span className="ml-2">{label}</span>
    </label>
  );
};
