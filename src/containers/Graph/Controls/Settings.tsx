import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect } from "react";
import { useFormContext } from "react-hook-form";
import { TypeOf, z } from "zod";
import { Form } from "../../../components/Form";
import { Popover } from "../../../components/Popover";
import { Switch } from "../../../components/Switch";
import { DEFAULT_SETTINGS, GET_DB_SETTINGS } from "../../../constants";
import { useDatabaseContext } from "../../../contexts/DatabaseContext";
import { SettingsIcon } from "../../../icons/Settings";
import { ControlButton } from "./ControlButton";
import { ControlPopoverLayout } from "./ControlPopoverLayout";

const schema = z.object({
  panOnScroll: z.boolean(),
});

type FormValues = TypeOf<typeof schema>;

export const Settings = () => {
  const { db } = useDatabaseContext();

  const { data: settings, isLoading } = useQuery({
    queryKey: [GET_DB_SETTINGS],
    queryFn: () => db.getAll("settings"),
  });

  if (isLoading) {
    return <>loading..</>;
  }

  return (
    <Popover
      triggerNode={
        <ControlButton>
          <SettingsIcon />
        </ControlButton>
      }
    >
      <ControlPopoverLayout header="Settings">
        <Form<FormValues>
          resolver={zodResolver(schema)}
          defaultValues={{
            panOnScroll: settings?.[0]?.panOnScroll || DEFAULT_SETTINGS.panOnScroll,
          }}
        >
          <FormFields />
        </Form>
      </ControlPopoverLayout>
    </Popover>
  );
};

const FormFields = () => {
  const { db } = useDatabaseContext();
  const queryClient = useQueryClient();

  const { handleSubmit, watch } = useFormContext<FormValues>();

  const onSubmit = useCallback(
    async ({ panOnScroll }: FormValues) => {
      await db.put("settings", { panOnScroll, colorSchema: "light" }, 1);

      await queryClient.invalidateQueries({ queryKey: [GET_DB_SETTINGS] });
    },
    [db, queryClient]
  );

  useEffect(() => {
    const subscription = watch(() => handleSubmit(onSubmit)());

    return () => subscription.unsubscribe();
  }, [handleSubmit, watch, onSubmit]);

  return <Switch name="panOnScroll" label="Figma-like controls" />;
};
