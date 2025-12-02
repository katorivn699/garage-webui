import Button from "@/components/ui/button";
import { InputField, SelectField } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { Modal } from "react-daisyui";
import { useForm, useWatch } from "react-hook-form";
import { createUserSchema, CreateUserInput } from "../schema";
import { useCreateUser } from "../hooks";
import BucketPermissionsField from "./bucket-permissions-field";
import { toast } from "sonner";

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
  const selectedRole = useWatch({ control: form.control, name: "role" });

  const handleSubmit = async (data: CreateUserInput) => {
    try {
      // Clear bucket_permissions if role is admin
      const submitData = {
        ...data,
        bucket_permissions: data.role === "admin" ? [] : (data.bucket_permissions || []),
      };
      console.log("Creating user with data:", submitData);
      await createUser.mutateAsync(submitData);
      toast.success("User created successfully!");
      form.reset();
      onClose();
    } catch (error) {
      console.error("Error creating user:", error);
      toast.error(error instanceof Error ? error.message : "Failed to create user");
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

          {selectedRole !== "admin" && <BucketPermissionsField form={form} />}

          {selectedRole === "admin" && (
            <div className="alert alert-info">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              <span>Admin users have access to all buckets and management features.</span>
            </div>
          )}

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
