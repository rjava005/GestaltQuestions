import { Navigate } from "react-router-dom";

import { useAuth } from "../features/Auth";
import {
  AccountActions,
  AccountHeader,
  AccountProfile,
} from "../features/Auth/components/account";

export default function AccountPage() {
  const { user, userData, loading } = useAuth();

  if (loading) {
    return (
      <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <p className="text-sm text-text-muted">Loading account...</p>
      </main>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
      <AccountHeader />
      {!userData ? (
        <section className="rounded-2xl border border-border bg-surface p-5 text-text-muted">
          Could not load account information.
        </section>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_280px]">
          <AccountProfile />
          <AccountActions />
        </div>
      )}
    </main>
  );
}
