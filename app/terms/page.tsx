import type { Metadata } from "next";

// TODO: replace with your real support address before launch.
const CONTACT_EMAIL = "support@repurpose.tools";
const LAST_UPDATED = "28 July 2026";

export const metadata: Metadata = {
  title: "Terms of Service — Repurpose",
  description:
    "The terms that govern your use of Repurpose, including subscriptions, acceptable use, and refunds.",
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
      <div className="mt-3 space-y-3 text-slate-700 leading-relaxed">{children}</div>
    </section>
  );
}

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-16">
      <div className="mx-auto max-w-3xl">
        <a href="/" className="text-sm text-slate-500 hover:text-slate-900">
          &larr; Back to Repurpose
        </a>

        <h1 className="mt-6 text-3xl font-bold text-slate-900">Terms of Service</h1>
        <p className="mt-2 text-sm text-slate-500">Last updated: {LAST_UPDATED}</p>

        <Section title="1. Who we are">
          <p>
            Repurpose (&quot;the Service&quot;) is operated from Qatar and is available at
            repurpose.tools. These terms form an agreement between you and us. By creating an
            account or using the Service, you accept them. If you do not accept them, do not use
            the Service.
          </p>
        </Section>

        <Section title="2. What the Service does">
          <p>
            Repurpose takes text you provide — a transcript, notes, or any long-form writing — and
            uses third-party AI models to generate a social post, thread, caption, or article from
            it. Paid plans can also transcribe audio and video files you upload.
          </p>
          <p>
            AI output is generated automatically. It can be inaccurate, incomplete, or unsuitable
            for your purpose. You are responsible for reviewing anything you publish.
          </p>
        </Section>

        <Section title="3. Your account">
          <p>
            You need an account to generate content. You must give a valid email address, keep your
            login details secure, and be old enough to enter a contract where you live. You are
            responsible for everything that happens under your account.
          </p>
        </Section>

        <Section title="4. Plans, quotas and billing">
          <p>
            The free plan includes a monthly word allowance. Paid plans (Starter and Pro) include
            larger allowances and additional features, and are billed monthly in advance. Allowances
            reset at the start of each calendar month and do not carry over.
          </p>
          <p>
            Payments are processed by <strong>Lemon Squeezy</strong>, which acts as the Merchant of
            Record for all purchases. Lemon Squeezy handles the transaction, invoicing, and any
            applicable sales tax or VAT. Your subscription is governed by their checkout terms in
            addition to these terms.
          </p>
          <p>
            Paid plans include a 7-day free trial. If you do not cancel before the trial ends, the
            subscription continues and the first payment is taken.
          </p>
        </Section>

        <Section title="5. Cancellation and refunds">
          <p>
            You can cancel at any time from your billing portal. Cancellation stops future charges;
            your plan stays active until the end of the period you have already paid for.
          </p>
          <p>
            If the Service did not work as described, contact us at {CONTACT_EMAIL} within 14 days
            of a charge and we will review a refund. Refunds are issued through Lemon Squeezy.
            Because allowances are consumed as you use them, we may decline a refund where a
            substantial part of the plan&apos;s allowance has already been used.
          </p>
        </Section>

        <Section title="6. Acceptable use">
          <p>You agree not to use the Service to:</p>
          <ul className="list-disc space-y-1 pl-6">
            <li>break the law, or infringe someone else&apos;s copyright or other rights;</li>
            <li>process content you have no right to process;</li>
            <li>produce spam, harassment, hateful content, or deliberate misinformation;</li>
            <li>generate sexual content involving minors, or content that promotes serious harm;</li>
            <li>resell the Service, or access it by automated means outside your plan.</li>
          </ul>
          <p>
            We may suspend or close an account that breaches this section, and we may report
            unlawful activity to the relevant authorities.
          </p>
        </Section>

        <Section title="7. Your content and ownership">
          <p>
            You keep ownership of the text and files you submit. You grant us permission to process
            them only to run the Service for you — generating output, transcribing audio, and
            counting usage against your plan.
          </p>
          <p>
            As between you and us, output generated from your input is yours to use. Similar output
            may be produced for other users from similar input, so we cannot promise it is unique.
          </p>
        </Section>

        <Section title="8. Availability">
          <p>
            We aim to keep the Service running but do not promise uninterrupted access. It depends
            on third-party providers, and we may change, pause, or discontinue features. If we
            discontinue a paid feature entirely, we will refund the unused part of your period.
          </p>
        </Section>

        <Section title="9. Liability">
          <p>
            The Service is provided &quot;as is&quot;. To the extent the law allows, we are not
            liable for indirect or consequential loss, lost profits, or lost data, and our total
            liability for any claim is limited to the amount you paid us in the 12 months before the
            claim.
          </p>
          <p>Nothing here limits liability that cannot legally be limited.</p>
        </Section>

        <Section title="10. Changes to these terms">
          <p>
            We may update these terms. If a change materially affects you, we will notify you by
            email or in the app before it takes effect. Continuing to use the Service after that
            means you accept the updated terms.
          </p>
        </Section>

        <Section title="11. Governing law">
          <p>
            These terms are governed by the laws of the State of Qatar, and the courts of Qatar have
            jurisdiction over any dispute.
          </p>
        </Section>

        <Section title="12. Contact">
          <p>
            Questions about these terms: <a className="underline" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
          </p>
        </Section>

        <p className="mt-12 text-sm text-slate-500">
          See also our <a className="underline" href="/privacy">Privacy Policy</a>.
        </p>
      </div>
    </main>
  );
}
