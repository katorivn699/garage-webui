import Button from "@/components/ui/button";
import { useState } from "react";
import { useUsers, useDeleteUser } from "./hooks";
import { Pencil, Trash2 } from "lucide-react";
import CreateUserDialog from "./components/create-user-dialog";
import EditUserDialog from "./components/edit-user-dialog";
import ConfirmDialog from "@/components/ui/confirm-dialog";
import { User } from "./types";
import { useConfirmDialogStore } from "@/stores/confirm-dialog-store";
import { Card } from "react-daisyui";

export default function UsersPage() {
  const { data: users, isLoading } = useUsers();
  const deleteUser = useDeleteUser();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const confirmDialog = useConfirmDialogStore();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return "just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    return `${Math.floor(diffInSeconds / 86400)} days ago`;
  };

  const handleDelete = (user: User) => {
    confirmDialog.open({
      title: "Delete User",
      message: `Are you sure you want to delete user "${user.username}"? This action cannot be undone.`,
      confirmText: "Delete",
      confirmColor: "error",
      onConfirm: async () => {
        await deleteUser.mutateAsync(user.id);
      },
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Users</h1>
          <p className="text-base-content/60 mt-1">
            Manage user accounts and permissions
          </p>
        </div>
        <Button color="primary" onClick={() => setCreateDialogOpen(true)}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="w-5 h-5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 4.5v15m7.5-7.5h-15"
            />
          </svg>
          Create User
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      ) : users && users.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="table table-zebra">
            <thead>
              <tr>
                <th>Username</th>
                <th>Role</th>
                <th>Bucket Permissions</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>
                    <div className="font-medium">{user.username}</div>
                  </td>
                  <td>
                    <div
                      className={`badge ${
                        user.role === "admin"
                          ? "badge-primary"
                          : "badge-ghost"
                      }`}
                    >
                      {user.role}
                    </div>
                  </td>
                  <td>
                    {user.role === "admin" ? (
                      <span className="text-sm text-base-content/60">
                        All buckets (admin)
                      </span>
                    ) : user.bucket_permissions.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {user.bucket_permissions.map((bucket, i) => (
                          <span key={i} className="badge badge-sm">
                            {bucket}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-sm text-base-content/60">
                        No permissions
                      </span>
                    )}
                  </td>
                  <td className="text-sm text-base-content/60">
                    {formatDate(user.created_at)}
                  </td>
                  <td>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        color="ghost"
                        onClick={() => setEditUser(user)}
                      >
                        <Pencil size={16} />
                      </Button>
                      <Button
                        size="sm"
                        color="error"
                        onClick={() => handleDelete(user)}
                        disabled={deleteUser.isPending}
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <Card className="text-center py-12" bordered>
          <Card.Body>
            <div className="text-6xl mb-4">👥</div>
            <h3 className="text-xl font-bold mb-2">No users yet</h3>
            <p className="text-base-content/60 mb-4">
              Create your first user to get started
            </p>
            <Button color="primary" onClick={() => setCreateDialogOpen(true)}>
              Create User
            </Button>
          </Card.Body>
        </Card>
      )}

      <CreateUserDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
      />

      <EditUserDialog
        user={editUser}
        open={editUser !== null}
        onClose={() => setEditUser(null)}
      />

      <ConfirmDialog />
    </div>
  );
}
