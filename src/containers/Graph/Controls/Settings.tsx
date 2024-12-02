import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect } from "react";
import { useFormContext } from "react-hook-form";
import { TypeOf, z } from "zod";
import { Button } from "../../../components/Button";
import { ChoiceInput } from "../../../components/ChoiceInput";
import { ColorInput } from "../../../components/ColorInput";
import { Form } from "../../../components/Form";
import { Input } from "../../../components/Input";
import { Popover } from "../../../components/Popover";
import { Switch } from "../../../components/Switch";
import { DEFAULT_NODE_COLORS_DARK_MODE, DEFAULT_NODE_COLORS_LIGHT_MODE, GET_DB_SETTINGS } from "../../../constants";
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
  spacing: z.number().min(50).max(500),
  nodeColors: z.object({
    xpubNode: z.string(),
    xpubAddress: z.string(),
    changeAddress: z.string(),
    externalAddress: z.string(),
  }),
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

  const { handleSubmit, watch, setValue } = useFormContext<FormValues>();

  const handleSetDefaultColor = useCallback(
    (key: "xpubNode" | "xpubAddress" | "changeAddress" | "externalAddress") => {
      const color = (
        document.documentElement.classList.contains("dark")
          ? DEFAULT_NODE_COLORS_DARK_MODE
          : DEFAULT_NODE_COLORS_LIGHT_MODE
      )[key];

      setValue(`nodeColors.${key}`, color);
    },
    [setValue]
  );

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
        className="my-2"
        optionWidth="w-10"
        options={[
          { label: "↓", value: "TB" },
          { label: "→", value: "LR" },
          { label: "↑", value: "BT" },
          { label: "←", value: "RL" },
        ]}
      />

      <Input
        name="spacing"
        type="range"
        label="Spacing"
        registerOptions={{ valueAsNumber: true }}
        min={50}
        max={500}
        step={10}
      />

      <div className="flex mb-2">
        <ColorInput name="nodeColors.xpubNode" type="color" label="Xpub node" />

        <Button variant="text" className="ml-2" onClick={() => handleSetDefaultColor("xpubNode")}>
          Default
        </Button>
      </div>

      <div className="flex mb-2">
        <ColorInput name="nodeColors.xpubAddress" type="color" label="Xpub address" />

        <Button variant="text" className="ml-2" onClick={() => handleSetDefaultColor("xpubAddress")}>
          Default
        </Button>
      </div>

      <div className="flex mb-2">
        <ColorInput name="nodeColors.changeAddress" type="color" label="Change address" />

        <Button variant="text" className="ml-2" onClick={() => handleSetDefaultColor("changeAddress")}>
          Default
        </Button>
      </div>

      <div className="flex mb-2">
        <ColorInput name="nodeColors.externalAddress" type="color" label="External address" />

        <Button variant="text" className="ml-2" onClick={() => handleSetDefaultColor("externalAddress")}>
          Default
        </Button>
      </div>
    </>
  );
};
