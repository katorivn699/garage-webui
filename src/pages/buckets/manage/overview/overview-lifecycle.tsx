import { useState, useRef, useEffect } from "react";
import { Button, Card, Modal } from "react-daisyui";
import { Clock, Plus, Trash2, Pencil } from "lucide-react";
import { useBucketContext } from "../context";
import { useLifecycleConfiguration } from "../hooks";
import { LifecycleRule } from "../../types";
import LifecycleRuleForm from "./lifecycle-rule-form";
import { useAuth } from "@/hooks/useAuth";

const LifecycleSection = () => {
  const { bucketName } = useBucketContext();
  const { isAdmin, hasPermission } = useAuth();
  const canManageLifecycle = isAdmin || hasPermission(bucketName, "manage_lifecycle");
  
  const {
    data: lifecycle,
    isLoading,
    updateLifecycle,
    deleteLifecycle,
  } = useLifecycleConfiguration(bucketName);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<LifecycleRule | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isModalOpen && !dialog.open) {
      dialog.showModal();
    } else if (!isModalOpen && dialog.open) {
      dialog.close();
    }
  }, [isModalOpen]);

  const handleAddRule = () => {
    setEditingRule(null);
    setIsModalOpen(true);
  };

  const handleEditRule = (rule: LifecycleRule) => {
    setEditingRule(rule);
    setIsModalOpen(true);
  };

  const handleDeleteRule = async (ruleId: string) => {
    if (!lifecycle) return;

    const updatedRules = lifecycle.rules.filter((r) => r.id !== ruleId);
    await updateLifecycle({ rules: updatedRules });
  };

  const handleSaveRule = async (rule: LifecycleRule) => {
    if (!lifecycle) return;

    let updatedRules: LifecycleRule[];
    if (editingRule) {
      // Update existing rule
      updatedRules = lifecycle.rules.map((r) =>
        r.id === editingRule.id ? rule : r
      );
    } else {
      // Add new rule
      updatedRules = [...lifecycle.rules, rule];
    }

    await updateLifecycle({ rules: updatedRules });
    setIsModalOpen(false);
  };

  const handleClearAll = async () => {
    if (confirm("Are you sure you want to remove all lifecycle rules?")) {
      await deleteLifecycle();
    }
  };

  return (
    <>
      <div className="divider my-6" />

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Clock size={18} />
          <h3 className="font-medium">Lifecycle Rules</h3>
        </div>
        {canManageLifecycle && (
          <div className="flex gap-2 px-4">
            {lifecycle && lifecycle.rules.length > 0 && (
              <Button size="sm" color="error" onClick={handleClearAll}>
                Clear All
              </Button>
            )}
            <Button size="sm" color="primary" onClick={handleAddRule}>
              <Plus size={16} />
              Add Rule
            </Button>
          </div>
        )}
      </div>

      {isLoading && <p className="text-sm text-base-content/60">Loading...</p>}

      {!isLoading && lifecycle && lifecycle.rules.length === 0 && (
        <p className="text-sm text-base-content/60">
          No lifecycle rules configured. Add rules to automatically delete
          objects after a specified time period.
        </p>
      )}

      {!isLoading && lifecycle && lifecycle.rules.length > 0 && (
        <div className="space-y-2">
          {lifecycle.rules.map((rule) => (
            <Card
              key={rule.id}
              className="p-4 bg-base-200 flex flex-row items-center justify-between"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{rule.id}</span>
                  <span
                    className={`badge badge-sm ${
                      rule.status === "Enabled" ? "badge-success" : "badge-error"
                    }`}
                  >
                    {rule.status}
                  </span>
                </div>

                {rule.prefix && (
                  <p className="text-sm text-base-content/60 mt-1">
                    Prefix: {rule.prefix}
                  </p>
                )}

                {rule.expiration?.days && (
                  <p className="text-sm text-base-content/60 mt-1">
                    Delete after {rule.expiration.days} days
                  </p>
                )}

                {rule.abortIncompleteMultipartUpload?.daysAfterInitiation && (
                  <p className="text-sm text-base-content/60 mt-1">
                    Abort incomplete uploads after{" "}
                    {rule.abortIncompleteMultipartUpload.daysAfterInitiation}{" "}
                    days
                  </p>
                )}
              </div>

              {canManageLifecycle && (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    color="ghost"
                    onClick={() => handleEditRule(rule)}
                  >
                    <Pencil size={16} />
                  </Button>
                  <Button
                    size="sm"
                    color="ghost"
                    onClick={() => handleDeleteRule(rule.id)}
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      <Modal ref={dialogRef} backdrop open={isModalOpen} className="max-w-2xl">
        <Modal.Header className="font-bold">
          {editingRule ? "Edit Lifecycle Rule" : "Add Lifecycle Rule"}
        </Modal.Header>
        <Modal.Body>
          <LifecycleRuleForm
            rule={editingRule}
            onSave={handleSaveRule}
            onCancel={() => setIsModalOpen(false)}
          />
        </Modal.Body>
      </Modal>
    </>
  );
};

export default LifecycleSection;
