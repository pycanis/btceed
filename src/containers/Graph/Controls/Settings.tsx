import { useCallback } from "react";
import { Button } from "../../../components/Button";
import { Form } from "../../../components/Form";
import { Popover } from "../../../components/Popover";
import { Switch } from "../../../components/Switch";
import { SettingsIcon } from "../../../icons/Settings";
import { ControlButton } from "./ControlButton";
import { ControlPopoverLayout } from "./ControlPopoverLayout";

export const Settings = () => {
  const handleSubmit = useCallback((values) => {
    console.log(values);
  }, []);

  return (
    <Popover
      triggerNode={
        <ControlButton>
          <SettingsIcon />
        </ControlButton>
      }
    >
      <ControlPopoverLayout header="Settings">
        <Form onSubmit={handleSubmit}>
          <Switch name="panOnScroll" />

          <Button className="mt-2" type="submit" size="sm">
            Submit
          </Button>
        </Form>
      </ControlPopoverLayout>
    </Popover>
  );
};
