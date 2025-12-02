import { useState, useEffect } from "react";
import { Button } from "react-daisyui";
import { LifecycleRule } from "../../types";

type Props = {
  rule: LifecycleRule | null;
  onSave: (rule: LifecycleRule) => void;
  onCancel: () => void;
};

const LifecycleRuleForm = ({ rule, onSave, onCancel }: Props) => {
  const [formData, setFormData] = useState<LifecycleRule>(
    rule || {
      id: "",
      status: "Enabled",
      prefix: "",
      expiration: { days: 7 },
    }
  );

  // Sync form data when rule prop changes
  useEffect(() => {
    if (rule) {
      setFormData(rule);
    } else {
      setFormData({
        id: "",
        status: "Enabled",
        prefix: "",
        expiration: { days: 7 },
      });
    }
  }, [rule]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clean up form data before saving
    const cleanedData: LifecycleRule = {
      ...formData,
      prefix: formData.prefix?.trim() || undefined,
    };
    
    onSave(cleanedData);
  };

  const updateField = <K extends keyof LifecycleRule>(
    field: K,
    value: LifecycleRule[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const updateExpiration = (days: number) => {
    setFormData((prev) => ({
      ...prev,
      expiration: { days },
    }));
  };

  const updateAbortMultipart = (days: number | null) => {
    setFormData((prev) => ({
      ...prev,
      abortIncompleteMultipartUpload: days
        ? { daysAfterInitiation: days }
        : undefined,
    }));
  };

  const handleAbortMultipartToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateAbortMultipart(e.target.checked ? 7 : null);
  };

  const handleAbortMultipartDaysChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value > 0) {
      updateAbortMultipart(value);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="form-control">
        <label className="label">
          <span className="label-text">Rule ID</span>
        </label>
        <input
          type="text"
          className="input input-bordered"
          value={formData.id}
          onChange={(e) => updateField("id", e.target.value)}
          placeholder="e.g., temp-files-expiration"
          required
          disabled={!!rule}
        />
      </div>

      <div className="form-control">
        <label className="label">
          <span className="label-text">Status</span>
        </label>
        <select
          className="select select-bordered"
          value={formData.status}
          onChange={(e) =>
            updateField("status", e.target.value as "Enabled" | "Disabled")
          }
        >
          <option value="Enabled">Enabled</option>
          <option value="Disabled">Disabled</option>
        </select>
      </div>

      <div className="form-control">
        <label className="label">
          <span className="label-text">Prefix (Optional)</span>
        </label>
        <input
          type="text"
          className="input input-bordered"
          value={formData.prefix || ""}
          onChange={(e) => updateField("prefix", e.target.value)}
          placeholder="e.g., temp/ (leave empty for all objects)"
        />
      </div>

      <div className="divider">Expiration Settings</div>

      <div className="form-control">
        <label className="label">
          <span className="label-text">Delete objects after (days)</span>
        </label>
        <input
          type="number"
          className="input input-bordered"
          min="1"
          value={formData.expiration?.days || 7}
          onChange={(e) => updateExpiration(parseInt(e.target.value))}
          required
        />
      </div>

      <div className="divider">Multipart Upload Cleanup</div>

      <div className="form-control">
        <label className="label cursor-pointer justify-start gap-4">
          <input
            type="checkbox"
            className="toggle toggle-primary"
            checked={!!formData.abortIncompleteMultipartUpload}
            onChange={handleAbortMultipartToggle}
          />
          <span className="label-text">
            Abort incomplete multipart uploads
          </span>
        </label>
      </div>

      {formData.abortIncompleteMultipartUpload && (
        <div className="form-control">
          <label className="label">
            <span className="label-text">Abort after (days)</span>
          </label>
          <input
            type="number"
            className="input input-bordered"
            min="1"
            value={
              formData.abortIncompleteMultipartUpload.daysAfterInitiation || 7
            }
            onChange={handleAbortMultipartDaysChange}
          />
        </div>
      )}

      <div className="flex justify-end gap-2 mt-6">
        <Button type="button" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" color="primary">
          Save Rule
        </Button>
      </div>
    </form>
  );
};

export default LifecycleRuleForm;
