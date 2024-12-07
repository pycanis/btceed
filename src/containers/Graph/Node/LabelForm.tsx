import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { TypeOf, z } from "zod";
import { Button } from "../../../components/Button";
import { Form } from "../../../components/Form";
import { Input } from "../../../components/Input";
import { GET_DB_LABELS } from "../../../constants";
import { useDatabaseContext } from "../../../contexts/DatabaseContext";
import { CheckmarkIcon } from "../../../icons/Checkmark";

const schema = z.object({
  label: z.string(),
});

type FormValues = TypeOf<typeof schema>;

type Props = {
  label: string;
  id: string;
  onSubmit: () => void;
};

export const LabelForm = ({ id, label, onSubmit }: Props) => {
  const { db } = useDatabaseContext();
  const queryClient = useQueryClient();

  const handleSubmit = useCallback(
    async ({ label }: FormValues) => {
      await db.put("labels", { id, label });

      await queryClient.invalidateQueries({ queryKey: [GET_DB_LABELS] });

      onSubmit();
    },
    [db, queryClient, id, onSubmit]
  );

  return (
    <Form<FormValues> defaultValues={{ label }} resolver={zodResolver(schema)} onSubmit={handleSubmit}>
      <div className="flex items-center">
        <Input name="label" />

        <Button className="ml-2" variant="text" type="submit">
          <CheckmarkIcon />
        </Button>
      </div>
    </Form>
  );
};
