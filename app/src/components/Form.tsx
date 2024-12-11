import type { ReactNode } from "react";
import { FormProvider, useForm, type FieldValues, type UseFormProps, type UseFormReturn } from "react-hook-form";

type Props<FormValues extends FieldValues> = {
  children: ReactNode;
  onSubmit?: (values: FormValues, methods: UseFormReturn<FormValues>) => Promise<void> | void;
} & UseFormProps<FormValues>;

export const Form = <FormValues extends FieldValues>({ children, onSubmit, ...form }: Props<FormValues>) => {
  const methods = useForm(form);

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit((values) => onSubmit?.(values, methods))}>{children}</form>
    </FormProvider>
  );
};
