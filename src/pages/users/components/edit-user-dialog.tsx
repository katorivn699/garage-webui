import Button from "@/components/ui/button";
import { InputField, SelectField } from "@/components/ui/input";
import { CheckboxField } from "@/components/ui/checkbox";
import { zodResolver } from "@hookform/resolvers/zod";
import { Modal } from "react-daisyui";
import { useForm } from "react-hook-form";
import { updateUserSchema, UpdateUserInput } from "../schema";
import { useUpdateUser } from "../hooks";
import { User } from "../types";
import { useBuckets } from "@/pages/buckets/hooks";
import { useEffect } from "react";

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
  const { data: buckets } = useBuckets();

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
      // Only send password if it's provided
      const updateData: UpdateUserInput = {
        role: data.role,
        bucket_permissions: data.bucket_permissions,
      };
      if (data.password && data.password.length > 0) {
        updateData.password = data.password;
      }

      await updateUser.mutateAsync({ id: user.id, data: updateData });
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
