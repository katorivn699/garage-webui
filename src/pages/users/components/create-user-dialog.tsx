import Button from "@/components/ui/button";
import { InputField, SelectField } from "@/components/ui/input";
import { CheckboxField } from "@/components/ui/checkbox";
import { zodResolver } from "@hookform/resolvers/zod";
import { Modal } from "react-daisyui";
import { useForm } from "react-hook-form";
import { createUserSchema, CreateUserInput } from "../schema";
import { useCreateUser } from "../hooks";
import { useBuckets } from "@/pages/buckets/hooks";

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function CreateUserDialog({ open, onClose }: Props) {
  const form = useForm<CreateUserInput>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      username: "",
      password: "",
      role: "user",
      bucket_permissions: [],
    },
  });

  const createUser = useCreateUser();
  const { data: buckets } = useBuckets();

  const handleSubmit = async (data: CreateUserInput) => {
    try {
      await createUser.mutateAsync(data);
      form.reset();
      onClose();
    } catch (error) {
      console.error(error);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <Modal open={open} onClick={handleBackdropClick}>
      <Modal.Header className="font-bold">Create User</Modal.Header>
      <Modal.Body>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <InputField
            form={form}
            name="username"
            title="Username"
            placeholder="Enter username"
          />

          <InputField
            form={form}
            name="password"
            title="Password"
            type="password"
            placeholder="Enter password"
          />

          <SelectField
            form={form}
            name="role"
            title="Role"
            options={[
              { label: "User", value: "user" },
              { label: "Admin", value: "admin" },
            ]}
          />

          <div className="form-control">
            <label className="label">
              <span className="label-text font-medium">Bucket Permissions</span>
            </label>
            <div className="space-y-2 max-h-48 overflow-y-auto border border-base-300 rounded-lg p-3">
              {buckets && buckets.length > 0 ? (
                buckets.map((bucket) => {
                  const bucketName = bucket.globalAliases?.[0] || bucket.id;
                  return (
                    <CheckboxField
                      key={bucket.id}
                      form={form}
                      name="bucket_permissions"
                      value={bucketName}
                      label={bucketName}
                    />
                  );
                })
              ) : (
                <p className="text-sm text-base-content/60">No buckets available</p>
              )}
            </div>
            <label className="label">
              <span className="label-text-alt text-base-content/60">
                Select which buckets this user can access (admin can access all)
              </span>
            </label>
          </div>

          <Modal.Actions>
            <Button
              type="button"
              onClick={onClose}
              color="ghost"
              disabled={createUser.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" color="primary" loading={createUser.isPending}>
              Create User
            </Button>
          </Modal.Actions>
        </form>
      </Modal.Body>
    </Modal>
  );
}
