import type { Metadata } from "next";

// TODO: replace with your real support address before launch.
const CONTACT_EMAIL = "support@repurpose.tools";
const LAST_UPDATED = "28 July 2026";

export const metadata: Metadata = {
  title: "Privacy Policy — Repurpose",
  description:
    "What data Repurpose collects, who processes it, how long it is kept, and how to delete it.",
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
      <div className="mt-3 space-y-3 text-slate-700 leading-relaxed">{children}</div>
    </section>
  );
}

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-16">
      <div className="mx-auto max-w-3xl">
        <a href="/" className="text-sm text-slate-500 hover:text-slate-900">
          &larr; Back to Repurpose
        </a>

        <h1 className="mt-6 text-3xl font-bold text-slate-900">Privacy Policy</h1>
        <p className="mt-2 text-sm text-slate-500">Last updated: {LAST_UPDATED}</p>

        <p className="mt-6 text-slate-700 leading-relaxed">
          This policy explains what Repurpose collects, why, and who else touches your data. We keep
          it short and specific on purpose.
        </p>

        <Section title="What we collect">
          <ul className="list-disc space-y-2 pl-6">
            <li>
              <strong>Account details.</strong> Your email address and an authentication record. We
              never see or store your password.
            </li>
            <li>
              <strong>Content you submit.</strong> The text you paste, and any audio or video file
              you upload for transcription.
            </li>
            <li>
              <strong>Usage data.</strong> How many words you have generated in the current month,
              and your plan and subscription status.
            </li>
            <li>
              <strong>Technical logs.</strong> Standard server logs kept by our hosting provider,
              including IP address and request time, used for security and debugging.
            </li>
          </ul>
          <p>
            We do not run advertising or third-party analytics trackers, and we do not sell your
            data to anyone.
          </p>
        </Section>

        <Section title="Why we process it">
          <p>
            To create your account and sign you in, to generate the output you ask for, to count
            usage against your plan, to send you service email such as sign-in confirmations, and to
            keep the Service secure. If you contact us, we use your message to reply.
          </p>
        </Section>

        <Section title="Who else processes your data">
          <p>
            We use a small number of providers to run the Service. Each one only receives what it
            needs:
          </p>
          <ul className="list-disc space-y-2 pl-6">
            <li>
              <strong>Vercel</strong> — hosting and file storage for uploads.
            </li>
            <li>
              <strong>Supabase</strong> — authentication and the database holding your account and
              usage record.
            </li>
            <li>
              <strong>Anthropic</strong> — receives the text you submit in order to generate output.
            </li>
            <li>
              <strong>OpenAI</strong> — receives audio and video you upload in order to transcribe
              it.
            </li>
            <li>
              <strong>Resend</strong> — delivers service email.
            </li>
            <li>
              <strong>Lemon Squeezy</strong> — our Merchant of Record. It processes payments and
              holds your billing details. We never receive your full card number.
            </li>
          </ul>
          <p>
            These providers operate outside Qatar, so using the Service involves transferring your
            data internationally.
          </p>
        </Section>

        <Section title="AI processing and training">
          <p>
            Your content is sent to the AI providers listed above only to produce the result you
            requested. We do not use your content to train our own models, and we do not grant these
            providers permission to train on it. Their own API terms apply to how they handle data
            in transit.
          </p>
        </Section>

        <Section title="How long we keep things">
          <p>
            Account and usage records are kept while your account exists. Uploaded audio and video
            files are kept only as long as needed to transcribe them and are then removed. Server
            logs are kept for a short retention period by our hosting provider.
          </p>
        </Section>

        <Section title="Cookies">
          <p>
            We set cookies for one purpose: keeping you signed in. There are no advertising,
            profiling, or cross-site tracking cookies. Clearing them signs you out.
          </p>
        </Section>

        <Section title="Your choices">
          <p>
            You can ask us to show you the data we hold about you, correct it, or delete your
            account and everything attached to it. Email {CONTACT_EMAIL} and we will action it.
            Deleting your account removes your profile and usage record; billing records held by
            Lemon Squeezy are kept as long as their own tax and accounting duties require.
          </p>
        </Section>

        <Section title="Children">
          <p>
            The Service is not intended for children under 16, and we do not knowingly collect their
            data. If you believe a child has created an account, contact us and we will remove it.
          </p>
        </Section>

        <Section title="Security">
          <p>
            Traffic is encrypted in transit, access to the database is restricted, and secrets are
            held as server-side environment variables. No service can promise perfect security, but
            if a breach affects your data we will tell you.
          </p>
        </Section>

        <Section title="Changes">
          <p>
            If we change this policy in a way that materially affects you, we will notify you by
            email or in the app before it takes effect.
          </p>
        </Section>

        <Section title="Contact">
          <p>
            Privacy questions or requests:{" "}
            <a className="underline" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
          </p>
        </Section>

        <p className="mt-12 text-sm text-slate-500">
          See also our <a className="underline" href="/terms">Terms of Service</a>.
        </p>
      </div>
    </main>
  );
}
