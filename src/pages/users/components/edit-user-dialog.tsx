import Button from "@/components/ui/button";
import { InputField, SelectField } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { Modal } from "react-daisyui";
import { useForm, useWatch } from "react-hook-form";
import { updateUserSchema, UpdateUserInput } from "../schema";
import { useUpdateUser } from "../hooks";
import { User } from "../types";
import { useEffect } from "react";
import BucketPermissionsField from "./bucket-permissions-field";
import { toast } from "sonner";

type Props = {
  user: User | null;
  open: boolean;
  onClose: () => void;
};

export default function EditUserDialog({ user, open, onClose }: Props) {
  const form = useForm<UpdateUserInput>({
    resolver: zodResolver(updateUserSchema),
    defaultValues: {
      password: "",
      role: user?.role,
      bucket_permissions: user?.bucket_permissions || [],
    },
  });

  const updateUser = useUpdateUser();
  const selectedRole = useWatch({ control: form.control, name: "role" });

  useEffect(() => {
    if (user) {
      form.reset({
        password: "",
        role: user.role,
        bucket_permissions: user.bucket_permissions || [],
      });
    }
  }, [user, form]);

  const handleSubmit = async (data: UpdateUserInput) => {
    if (!user) return;

    try {
      // Prepare update data
      const updateData: UpdateUserInput = {
        role: data.role,
        bucket_permissions: data.role === "admin" ? [] : (data.bucket_permissions || []),
      };
      
      // Only send password if it's provided
      if (data.password && data.password.length > 0) {
        updateData.password = data.password;
      }

      console.log("Updating user with data:", updateData);
      await updateUser.mutateAsync({ id: user.id, data: updateData });
      toast.success("User updated successfully!");
      form.reset();
      onClose();
    } catch (error) {
      console.error("Error updating user:", error);
      toast.error(error instanceof Error ? error.message : "Failed to update user");
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!user) return null;

  return (
    <Modal open={open} onClick={handleBackdropClick}>
      <Modal.Header className="font-bold">Edit User</Modal.Header>
      <Modal.Body>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <div className="form-control">
            <label className="label">
              <span className="label-text font-medium">Username</span>
            </label>
            <input
              type="text"
              value={user.username}
              disabled
              className="input input-bordered bg-base-200"
            />
          </div>

          <InputField
            form={form}
            name="password"
            title="New Password (leave blank to keep current)"
            type="password"
            placeholder="Enter new password"
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
              disabled={updateUser.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" color="primary" loading={updateUser.isPending}>
              Update User
            </Button>
          </Modal.Actions>
        </form>
      </Modal.Body>
    </Modal>
  );
}
