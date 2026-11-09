import { officePage } from "@/components/admin/office-page";
import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/session";
import { PageHeader } from "@/components/admin/ui";
import { SubmitButton } from "@/components/admin/submit-button";
import { PasswordForm } from "./password-form";
import { signOutEverywhere, updateProfile } from "./actions";

export const metadata: Metadata = { title: "Account" };

async function AccountPage({ searchParams }: PageProps<"/admin/account">) {
  const admin = await requireAdmin({ allowPasswordChange: true });
  if (admin.id === null) return <PageHeader title="Local office" description="This dashboard opens on this computer without a login. Account and password settings are available on the signed-in dashboard." />;
  const sp = await searchParams;
  return (
    <>
      <PageHeader title="Account" description="Your admin login. Sessions are stored in admin_sessions and last 14 days." />
      {admin.mustChangePassword || sp.first ? (
        <div className="mb-6 rounded-lg border border-accent/50 bg-accent/10 p-4 text-sm">
          You are signed in with the bootstrap password. Choose a new one to unlock the rest of the console.
        </div>
      ) : null}
      <section className="card mb-6">
        <h2 className="mb-4 font-serif text-xl">Password</h2>
        <PasswordForm />
      </section>
      {!admin.mustChangePassword ? (
        <section className="card mb-6">
          <h2 className="mb-4 font-serif text-xl">Profile</h2>
          <form action={updateProfile} className="grid max-w-md gap-4">
            <label className="block">
              <span className="label">Name</span>
              <input name="name" defaultValue={admin.name} className="input" />
            </label>
            <label className="block">
              <span className="label">Email (login)</span>
              <input name="email" type="email" defaultValue={admin.email} className="input" />
            </label>
            <SubmitButton className="btn w-fit">Save profile</SubmitButton>
          </form>
        </section>
      ) : null}
      <section className="card">
        <h2 className="mb-2 font-serif text-xl">Sessions</h2>
        <p className="mb-4 text-sm text-muted">Sign out of every browser where you are logged in.</p>
        <form action={signOutEverywhere}>
          <SubmitButton className="btn-danger" confirm="Sign out everywhere?">
            Sign out everywhere
          </SubmitButton>
        </form>
      </section>
    </>
  );
}

export default officePage(AccountPage);
