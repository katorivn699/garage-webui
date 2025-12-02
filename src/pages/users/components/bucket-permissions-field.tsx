import { UseFormReturn } from "react-hook-form";
import { useBuckets } from "@/pages/buckets/hooks";
import { BucketPermission } from "../types";
import { Checkbox } from "react-daisyui";
import { useEffect, useState } from "react";

type Props = {
  form: UseFormReturn<any>;
};

export default function BucketPermissionsField({ form }: Props) {
  const { data: buckets } = useBuckets();
  const [permissions, setPermissions] = useState<BucketPermission[]>([]);

  // Watch for changes in form bucket_permissions
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === "bucket_permissions") {
        setPermissions(value.bucket_permissions || []);
      }
    });
    
    // Initial load
    const currentPermissions = form.getValues("bucket_permissions") || [];
    setPermissions(currentPermissions);
    
    return () => subscription.unsubscribe();
  }, [form]);

  const handleBucketToggle = (bucketName: string, checked: boolean) => {
    let newPermissions: BucketPermission[];
    
    if (checked) {
      // Add bucket with default permissions
      newPermissions = [
        ...permissions,
        {
          bucket_name: bucketName,
          read: true,
          write: false,
          delete: false,
          manage_lifecycle: false,
          delete_bucket: false,
        },
      ];
    } else {
      // Remove bucket
      newPermissions = permissions.filter((p) => p.bucket_name !== bucketName);
    }

    setPermissions(newPermissions);
    form.setValue("bucket_permissions", newPermissions);
  };

  const handlePermissionToggle = (
    bucketName: string,
    permission: keyof Omit<BucketPermission, "bucket_name">,
    checked: boolean
  ) => {
    const newPermissions = permissions.map((p) =>
      p.bucket_name === bucketName ? { ...p, [permission]: checked } : p
    );

    setPermissions(newPermissions);
    form.setValue("bucket_permissions", newPermissions);
  };

  const isBucketSelected = (bucketName: string) =>
    permissions.some((p) => p.bucket_name === bucketName);

  const getBucketPermission = (bucketName: string) =>
    permissions.find((p) => p.bucket_name === bucketName);

  return (
    <div className="form-control">
      <label className="label">
        <span className="label-text font-medium">Bucket Permissions</span>
      </label>
      <div className="space-y-3 max-h-96 overflow-y-auto border border-base-300 rounded-lg p-3">
        {buckets && buckets.length > 0 ? (
          buckets.map((bucket) => {
            const bucketName = bucket.globalAliases?.[0] || bucket.id;
            const isSelected = isBucketSelected(bucketName);
            const perm = getBucketPermission(bucketName);

            return (
              <div key={bucket.id} className="border-b border-base-300 pb-3 last:border-b-0">
                <div className="flex items-center gap-2 mb-2">
                  <Checkbox
                    color="primary"
                    checked={isSelected}
                    onChange={(e) => handleBucketToggle(bucketName, e.target.checked)}
                  />
                  <span className="font-medium">{bucketName}</span>
                </div>

                {isSelected && perm && (
                  <div className="ml-7 grid grid-cols-2 gap-2 text-sm">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <Checkbox
                        size="sm"
                        checked={perm.read}
                        onChange={(e) =>
                          handlePermissionToggle(bucketName, "read", e.target.checked)
                        }
                      />
                      <span>Read (view files)</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <Checkbox
                        size="sm"
                        checked={perm.write}
                        onChange={(e) =>
                          handlePermissionToggle(bucketName, "write", e.target.checked)
                        }
                      />
                      <span>Write (upload files)</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <Checkbox
                        size="sm"
                        checked={perm.delete}
                        onChange={(e) =>
                          handlePermissionToggle(bucketName, "delete", e.target.checked)
                        }
                      />
                      <span>Delete (remove files)</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <Checkbox
                        size="sm"
                        checked={perm.manage_lifecycle}
                        onChange={(e) =>
                          handlePermissionToggle(bucketName, "manage_lifecycle", e.target.checked)
                        }
                      />
                      <span>Manage lifecycle rules</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer col-span-2">
                      <Checkbox
                        size="sm"
                        checked={perm.delete_bucket}
                        onChange={(e) =>
                          handlePermissionToggle(bucketName, "delete_bucket", e.target.checked)
                        }
                      />
                      <span className="text-error">Delete bucket</span>
                    </label>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <p className="text-sm text-base-content/60">No buckets available</p>
        )}
      </div>
      <label className="label">
        <span className="label-text-alt text-base-content/60">
          Select buckets and specific permissions for this user
        </span>
      </label>
    </div>
  );
}
