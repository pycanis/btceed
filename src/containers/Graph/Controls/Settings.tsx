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
import { ColorScheme, Direction, NodeType } from "../../../types";
import { ControlButton } from "./ControlButton";
import { ControlPopoverLayout } from "./ControlPopoverLayout";

const nodeColorsSchema = z.object({
  xpubNode: z.string(),
  xpubAddress: z.string(),
  changeAddress: z.string(),
  externalAddress: z.string(),
});

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
  nodeColors: nodeColorsSchema,
  nodeColorsDark: nodeColorsSchema,
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

const ColorField = ({
  darkField,
  label,
  nodeType,
  handleSetDefaultColor,
}: {
  darkField?: boolean;
  label: string;
  nodeType: NodeType;
  handleSetDefaultColor: (nodeType: NodeType) => void;
}) => {
  return (
    <div className="flex mb-2">
      <ColorInput name={`nodeColors${darkField ? "Dark" : ""}.${nodeType}`} type="color" label={label} />

      <Button variant="text" className="ml-2" onClick={() => handleSetDefaultColor(nodeType)}>
        Default
      </Button>
    </div>
  );
};

const ColorFields = ({ darkField, className }: { darkField?: boolean; className: string }) => {
  const { isDarkMode } = useSettingsContext();
  const { setValue } = useFormContext<FormValues>();

  const handleSetDefaultColor = useCallback(
    (nodeType: NodeType) => {
      const color = (isDarkMode ? DEFAULT_NODE_COLORS_DARK_MODE : DEFAULT_NODE_COLORS_LIGHT_MODE)[nodeType];

      setValue(`nodeColors${isDarkMode ? "Dark" : ""}.${nodeType}`, color);
    },
    [setValue, isDarkMode]
  );

  return (
    <div className={className}>
      <ColorField
        darkField={darkField}
        nodeType="xpubNode"
        label="Xpub node"
        handleSetDefaultColor={handleSetDefaultColor}
      />

      <ColorField
        darkField={darkField}
        nodeType="xpubAddress"
        label="Xpub address"
        handleSetDefaultColor={handleSetDefaultColor}
      />

      <ColorField
        darkField={darkField}
        nodeType="changeAddress"
        label="Change address"
        handleSetDefaultColor={handleSetDefaultColor}
      />

      <ColorField
        darkField={darkField}
        nodeType="externalAddress"
        label="External address"
        handleSetDefaultColor={handleSetDefaultColor}
      />
    </div>
  );
};

const FormFields = () => {
  const { db } = useDatabaseContext();
  const { isDarkMode } = useSettingsContext();
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

      <ColorFields className={isDarkMode ? "hidden" : ""} />
      <ColorFields darkField className={isDarkMode ? "" : "hidden"} />
    </>
  );
};
