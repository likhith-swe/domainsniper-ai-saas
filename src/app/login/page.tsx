import type { Metadata } from "next";
import LoginForm from "./LoginForm";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Passwordless magic-link sign in for DomainSniper AI.",
};

export default function LoginPage() {
  return (
    <div className="term-grid flex min-h-[75vh] items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        <div className="clip-terminal border border-line bg-panel p-7">
          <p className="font-mono text-[10px] tracking-[0.3em] text-radar">
            // AUTHENTICATION
          </p>
          <h1 className="mt-2 text-2xl font-bold text-paper">
            Sign in to the sniper deck
          </h1>
          <p className="mt-2 text-sm text-fog">
            No passwords. Enter your email and we&apos;ll fire a single-use magic
            link that expires in 15 minutes.
          </p>
          <div className="mt-6">
            <LoginForm />
          </div>
          <ul className="mt-6 space-y-1.5 border-t border-line pt-5 font-mono text-[11px] text-fog2">
            <li>✓ Arm unlimited Telegram / WhatsApp / email tripwires</li>
            <li>✓ Sync saved drops across devices</li>
            <li>✓ Club Pro billing attaches to this identity</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
