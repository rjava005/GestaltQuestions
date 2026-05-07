import { deleteUser } from "firebase/auth";
import { toast } from "react-toastify";

import { useAuth } from "../..";

export default function AccountActions() {
  const { user, logout } = useAuth();

  const handleDeleteAccount = async () => {
    if (!user) return;

    const confirmed = window.confirm(
      "Are you sure you want to permanently delete your account?"
    );
    if (!confirmed) return;

    try {
      await deleteUser(user);
      toast.success("Account deleted successfully.");
      window.location.reload();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      toast.error(`Could not delete account: ${message}`);
    }
  };

  return (
    <section className="rounded-2xl border border-border bg-surface p-5 shadow-soft backdrop-blur-md">
      <h2 className="mb-4 text-lg font-semibold text-text">Account Actions</h2>
      <div className="flex flex-col justify-start gap-10">
        <button
          type="button"
          onClick={logout}
          className="rounded-lg border border-border bg-surface-muted px-4 py-2.5 text-sm font-medium text-text transition-colors hover:bg-surface-strong dark:hover:bg-blue-800/60"
        >
          Logout
        </button>
        <button
          type="button"
          disabled={true}
          onClick={handleDeleteAccount}
          className="rounded-lg border border-red-400/40 bg-red-500/15 px-4 py-2.5 text-sm font-medium light:text-black dark:text-red-200 transition-colors hover:bg-red-500/25 cursor-not-allowed"
        >
          Delete Account
        </button>
      </div>
    </section>
  );
}
