import { X, CheckCircle, XCircle, Loader2, FileUp } from "lucide-react";
import { readableBytes } from "@/lib/utils";

export type UploadFile = {
  name: string;
  size: number;
  progress: number;
  status: "pending" | "uploading" | "success" | "error";
  error?: string;
};

type Props = {
  files: UploadFile[];
  isOpen: boolean;
  onClose: () => void;
};

const UploadProgressDialog = ({ files, isOpen, onClose }: Props) => {
  if (!isOpen || files.length === 0) return null;

  const allCompleted = files.every(
    (f) => f.status === "success" || f.status === "error"
  );

  const successCount = files.filter((f) => f.status === "success").length;
  const errorCount = files.filter((f) => f.status === "error").length;
  const uploadingCount = files.filter(
    (f) => f.status === "uploading" || f.status === "pending"
  ).length;

  return (
    <div className="fixed bottom-6 right-6 z-50 w-96 max-w-[calc(100vw-3rem)] animate-in slide-in-from-bottom-4 fade-in duration-300">
      <div className="bg-base-100 rounded-2xl shadow-2xl border border-base-300/50 overflow-hidden backdrop-blur-sm">
        {/* Header with gradient */}
        <div className="relative px-4 py-3 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-b border-base-300/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${allCompleted ? 'bg-success/20' : 'bg-primary/20'}`}>
                {allCompleted ? (
                  <CheckCircle size={18} className="text-success" />
                ) : (
                  <FileUp size={18} className="text-primary animate-pulse" />
                )}
              </div>
              <div>
                <h3 className="font-semibold text-sm">
                  {allCompleted ? "Upload Complete" : "Uploading Files"}
                </h3>
                <p className="text-xs text-base-content/60">
                  {!allCompleted && uploadingCount > 0 && (
                    <span>{uploadingCount} of {files.length} files</span>
                  )}
                  {allCompleted && (
                    <span>
                      {successCount > 0 && <span className="text-success">{successCount} succeeded</span>}
                      {successCount > 0 && errorCount > 0 && <span className="mx-1">·</span>}
                      {errorCount > 0 && <span className="text-error">{errorCount} failed</span>}
                    </span>
                  )}
                </p>
              </div>
            </div>
            {allCompleted && (
              <button
                onClick={onClose}
                className="btn btn-ghost btn-xs btn-circle hover:bg-base-300/50 transition-colors"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Body with custom scrollbar */}
        <div className="p-4 max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-base-300 scrollbar-track-transparent">
          <div className="space-y-3">
            {files.map((file, idx) => (
              <div
                key={idx}
                className="group p-3 rounded-xl bg-base-200/50 hover:bg-base-200 transition-all duration-200 border border-transparent hover:border-base-300/50"
              >
                <div className="flex items-start gap-3">
                  {/* Status Icon */}
                  <div className="mt-0.5">
                    {file.status === "pending" && (
                      <div className="p-1.5 rounded-lg bg-base-300/50">
                        <Loader2 size={14} className="text-base-content/50" />
                      </div>
                    )}
                    {file.status === "uploading" && (
                      <div className="p-1.5 rounded-lg bg-info/20">
                        <Loader2 size={14} className="text-info animate-spin" />
                      </div>
                    )}
                    {file.status === "success" && (
                      <div className="p-1.5 rounded-lg bg-success/20">
                        <CheckCircle size={14} className="text-success" />
                      </div>
                    )}
                    {file.status === "error" && (
                      <div className="p-1.5 rounded-lg bg-error/20">
                        <XCircle size={14} className="text-error" />
                      </div>
                    )}
                  </div>

                  {/* File Info */}
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium truncate" title={file.name}>
                        {file.name}
                      </span>
                      <span className="text-xs text-base-content/50 flex-shrink-0 font-mono">
                        {readableBytes(file.size)}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    {file.status === "uploading" && (
                      <div className="space-y-1">
                        <div className="relative w-full h-1.5 bg-base-300 rounded-full overflow-hidden">
                          <div
                            className="absolute top-0 left-0 h-full bg-gradient-to-r from-info to-info/80 transition-all duration-300 ease-out rounded-full"
                            style={{ width: `${file.progress}%` }}
                          >
                            <div className="absolute inset-0 bg-white/20 animate-pulse" />
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-base-content/50">
                            {file.progress < 100 ? 'Uploading...' : 'Processing...'}
                          </span>
                          <span className="text-xs font-semibold text-info">
                            {Math.round(file.progress)}%
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Error Message */}
                    {file.status === "error" && file.error && (
                      <p className="text-xs text-error bg-error/10 px-2 py-1 rounded-lg truncate" title={file.error}>
                        {file.error}
                      </p>
                    )}

                    {/* Success Message */}
                    {file.status === "success" && (
                      <p className="text-xs text-success">
                        Upload completed successfully
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        {allCompleted && (
          <div className="px-4 py-3 bg-base-200/50 border-t border-base-300/50 flex justify-end">
            <button 
              onClick={onClose} 
              className="btn btn-sm btn-primary gap-2 shadow-lg hover:shadow-xl transition-shadow"
            >
              <CheckCircle size={14} />
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default UploadProgressDialog;
