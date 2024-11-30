import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect } from "react";
import { useFormContext } from "react-hook-form";
import { TypeOf, z } from "zod";
import { ChoiceInput } from "../../../components/ChoiceInput";
import { Form } from "../../../components/Form";
import { Popover } from "../../../components/Popover";
import { Switch } from "../../../components/Switch";
import { GET_DB_SETTINGS } from "../../../constants";
import { useDatabaseContext } from "../../../contexts/DatabaseContext";
import { useSettingsContext } from "../../../contexts/SettingsContext";
import { SettingsIcon } from "../../../icons/Settings";
import { ColorScheme, Direction } from "../../../types";
import { ControlButton } from "./ControlButton";
import { ControlPopoverLayout } from "./ControlPopoverLayout";

const schema = z.object({
  panOnScroll: z.boolean(),
  colorScheme: z.union([
    z.literal<ColorScheme>("light"),
    z.literal<ColorScheme>("dark"),
    z.literal<ColorScheme>("system"),
  ]),
  direction: z.union([
    z.literal<Direction>("TB"),
    z.literal<Direction>("LR"),
    z.literal<Direction>("BT"),
    z.literal<Direction>("RL"),
  ]),
});

type FormValues = TypeOf<typeof schema>;

export const Settings = () => {
  const { settings } = useSettingsContext();

  return (
    <Popover
      triggerNode={
        <ControlButton>
          <SettingsIcon />
        </ControlButton>
      }
    >
      <ControlPopoverLayout header="Settings">
        <Form<FormValues> resolver={zodResolver(schema)} defaultValues={settings}>
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
    async (values: FormValues) => {
      await db.put("settings", values, 1);

      await queryClient.invalidateQueries({ queryKey: [GET_DB_SETTINGS] });
    },
    [db, queryClient]
  );

  useEffect(() => {
    const subscription = watch(() => handleSubmit(onSubmit)());

    return () => subscription.unsubscribe();
  }, [handleSubmit, watch, onSubmit]);

  return (
    <>
      <Switch name="panOnScroll" label="Figma-like controls" />

      <ChoiceInput
        name="colorScheme"
        label="Color scheme"
        className="mt-2"
        optionWidth="w-20"
        options={[
          { label: "Light", value: "light" },
          { label: "Dark", value: "dark" },
          { label: "System", value: "system" },
        ]}
      />

      <ChoiceInput
        name="direction"
        label="Direction"
        className="mt-2"
        optionWidth="w-10"
        options={[
          { label: "↓", value: "TB" },
          { label: "→", value: "LR" },
          { label: "↑", value: "BT" },
          { label: "←", value: "RL" },
        ]}
      />
    </>
  );
};
