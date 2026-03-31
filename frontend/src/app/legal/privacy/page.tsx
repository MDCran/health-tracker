import Link from 'next/link';

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-y-auto h-dvh">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <div className="mb-12">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-[13px] font-medium text-primary hover:text-primary-dark transition-colors mb-8"
          >
            <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 12L6 8l4-4" />
            </svg>
            Back to Health Tracker
          </Link>
          <h1 className="text-[32px] font-bold tracking-tight text-foreground">
            Privacy Policy
          </h1>
          <p className="mt-2 text-[14px] text-muted">
            Last updated: March 2026
          </p>
        </div>

        <div className="space-y-10">
          <section className="rounded-xl border border-card-border bg-card-bg p-6">
            <h2 className="text-[18px] font-semibold text-foreground mb-3">
              1. Introduction
            </h2>
            <p className="text-[14px] leading-relaxed text-muted">
              Health Tracker by MDCran (&ldquo;the application&rdquo;) respects your privacy. This Privacy
              Policy explains what information is collected, how it is used, and your rights regarding
              your data. This application is an educational and personal project developed by a student.
            </p>
          </section>

          <section className="rounded-xl border border-card-border bg-card-bg p-6">
            <h2 className="text-[18px] font-semibold text-foreground mb-3">
              2. Information We Collect
            </h2>
            <div className="space-y-3 text-[14px] leading-relaxed text-muted">
              <p>
                All data collected by this application is <strong className="text-foreground">voluntarily provided
                by you</strong>. We do not collect data from third-party sources. The types of information
                you may provide include:
              </p>
              <ul className="list-disc pl-6 space-y-1.5">
                <li><strong className="text-foreground">Account information:</strong> username, display name, date of birth</li>
                <li><strong className="text-foreground">Health metrics:</strong> weight, body measurements, vital signs, sleep data, and other wellness indicators</li>
                <li><strong className="text-foreground">Activity data:</strong> workouts, habits, substance tracking, and therapeutic regimens</li>
                <li><strong className="text-foreground">Nutrition data:</strong> meal logs, calorie and macronutrient information</li>
                <li><strong className="text-foreground">Files:</strong> progress photos, medical records, journal entries</li>
                <li><strong className="text-foreground">Appointments:</strong> healthcare appointment records</li>
              </ul>
              <p>
                All health data is entered by you at your discretion. The application does not
                automatically collect health data from wearables, devices, or other external sources.
              </p>
            </div>
          </section>

          <section className="rounded-xl border border-card-border bg-card-bg p-6">
            <h2 className="text-[18px] font-semibold text-foreground mb-3">
              3. How Your Data Is Stored
            </h2>
            <div className="space-y-3 text-[14px] leading-relaxed text-muted">
              <p>
                Your data is stored in an <strong className="text-foreground">encrypted database</strong>.
                Reasonable security measures are employed to protect your data from unauthorized access.
              </p>
              <p>
                If you choose to connect your Google Drive, files such as progress photos, medical
                records, and journal PDFs may be stored on your personal Google Drive. The application
                only accesses folders and files it creates and does not access your other Google Drive content.
              </p>
            </div>
          </section>

          <section className="rounded-xl border border-card-border bg-card-bg p-6">
            <h2 className="text-[18px] font-semibold text-foreground mb-3">
              4. Data Sharing and Third Parties
            </h2>
            <div className="space-y-3 text-[14px] leading-relaxed text-muted">
              <p>
                Your data is <strong className="text-foreground">not sold, rented, or shared with third
                parties</strong> for marketing, advertising, or any other commercial purpose.
              </p>
              <p>
                Data may be processed by the following third-party services only when you explicitly
                opt in:
              </p>
              <ul className="list-disc pl-6 space-y-1.5">
                <li>
                  <strong className="text-foreground">OpenAI API:</strong> If you provide your own OpenAI API
                  key and use AI-powered features (such as nutrition analysis), meal descriptions and/or
                  images may be sent to OpenAI for processing. This data is subject to OpenAI&apos;s own
                  privacy policy and terms of use.
                </li>
                <li>
                  <strong className="text-foreground">Google Drive:</strong> If you connect your Google Drive
                  account, files are stored on your personal Drive using your own Google account credentials.
                  This is done only with your explicit consent.
                </li>
              </ul>
            </div>
          </section>

          <section className="rounded-xl border border-card-border bg-card-bg p-6">
            <h2 className="text-[18px] font-semibold text-foreground mb-3">
              5. Cookies and Local Storage
            </h2>
            <div className="space-y-3 text-[14px] leading-relaxed text-muted">
              <p>
                This application does <strong className="text-foreground">not use traditional tracking
                cookies</strong>. We do not use cookies for analytics, advertising, or user profiling.
              </p>
              <p>
                The application uses <strong className="text-foreground">browser localStorage</strong> to
                store your authentication token, which keeps you signed in between sessions. This is a
                functional requirement and does not track your activity across websites.
              </p>
            </div>
          </section>

          <section className="rounded-xl border border-card-border bg-card-bg p-6">
            <h2 className="text-[18px] font-semibold text-foreground mb-3">
              6. Data Retention
            </h2>
            <p className="text-[14px] leading-relaxed text-muted">
              Your data is retained for as long as your account exists. When you delete your account,
              all associated data stored in the application&apos;s database is permanently deleted.
              Files stored on your Google Drive, if applicable, may need to be removed separately
              through your Google account.
            </p>
          </section>

          <section className="rounded-xl border border-card-border bg-card-bg p-6">
            <h2 className="text-[18px] font-semibold text-foreground mb-3">
              7. Your Rights
            </h2>
            <div className="space-y-3 text-[14px] leading-relaxed text-muted">
              <p>
                You have the following rights regarding your personal data:
              </p>
              <ul className="list-disc pl-6 space-y-1.5">
                <li><strong className="text-foreground">Right to access:</strong> You can view all of your data within the application at any time.</li>
                <li><strong className="text-foreground">Right to export:</strong> You can export your data as PDF reports through the application&apos;s built-in export features.</li>
                <li><strong className="text-foreground">Right to rectification:</strong> You can edit or update any of your data entries at any time.</li>
                <li><strong className="text-foreground">Right to deletion:</strong> You can delete individual entries or your entire account and all associated data.</li>
                <li><strong className="text-foreground">Right to restriction:</strong> You can choose which modules and features to use, limiting what data is collected.</li>
              </ul>
              <p>
                These rights are provided in the spirit of GDPR and similar data protection regulations,
                though this application, as an educational project, may not be formally subject to all
                such requirements.
              </p>
            </div>
          </section>

          <section className="rounded-xl border border-danger/30 bg-danger/5 p-6">
            <h2 className="text-[18px] font-semibold text-foreground mb-3">
              8. HIPAA Disclaimer
            </h2>
            <p className="text-[14px] leading-relaxed text-muted">
              This application is <strong className="text-foreground">not HIPAA-compliant software</strong>.
              It is not a covered entity or business associate under HIPAA. While reasonable security
              measures are in place, this application does not meet the technical safeguards, administrative
              safeguards, or physical safeguards required by HIPAA. Do not use this application as your
              sole storage for critical medical records.
            </p>
          </section>

          <section className="rounded-xl border border-card-border bg-card-bg p-6">
            <h2 className="text-[18px] font-semibold text-foreground mb-3">
              9. Children&apos;s Privacy
            </h2>
            <p className="text-[14px] leading-relaxed text-muted">
              This application is not intended for use by individuals under the age of 13. We do not
              knowingly collect personal information from children under 13. If you believe a child under
              13 has provided data through this application, please contact us so that the data can be
              removed.
            </p>
          </section>

          <section className="rounded-xl border border-card-border bg-card-bg p-6">
            <h2 className="text-[18px] font-semibold text-foreground mb-3">
              10. Changes to This Policy
            </h2>
            <p className="text-[14px] leading-relaxed text-muted">
              This Privacy Policy may be updated from time to time. Continued use of the application
              after any changes constitutes acceptance of the revised policy. Users are encouraged to
              review this policy periodically.
            </p>
          </section>

          <section className="rounded-xl border border-warning/30 bg-warning/5 p-6">
            <h2 className="text-[18px] font-semibold text-foreground mb-3">
              11. Data Breach Notification
            </h2>
            <div className="space-y-3 text-[14px] leading-relaxed text-muted">
              <p>
                In the event of a data breach affecting your personal information, the developer will
                make reasonable efforts to notify affected users via the email or contact information
                associated with their account. However, the developer shall not be held liable for
                any damages resulting from any data breach or unauthorized access.
              </p>
            </div>
          </section>

          <section className="rounded-xl border border-card-border bg-card-bg p-6">
            <h2 className="text-[18px] font-semibold text-foreground mb-3">
              12. AI and Data Training
            </h2>
            <div className="space-y-3 text-[14px] leading-relaxed text-muted">
              <p>
                Your personal data is <strong className="text-foreground">never used for AI model training,
                machine learning, or data mining</strong> by the developer. Data sent to OpenAI via your
                own API key is subject to OpenAI&apos;s data usage policies. The developer does not
                retain, analyze, or use any data processed by third-party AI services.
              </p>
            </div>
          </section>

          <section className="rounded-xl border border-card-border bg-card-bg p-6">
            <h2 className="text-[18px] font-semibold text-foreground mb-3">
              13. Service Discontinuation
            </h2>
            <div className="space-y-3 text-[14px] leading-relaxed text-muted">
              <p>
                The developer may discontinue the service at any time. Upon discontinuation, all stored
                data will be deleted. Users are encouraged to regularly export their data using the
                built-in PDF export feature.
              </p>
            </div>
          </section>

          <section className="rounded-xl border border-card-border bg-card-bg p-6">
            <h2 className="text-[18px] font-semibold text-foreground mb-3">
              14. Contact
            </h2>
            <p className="text-[14px] leading-relaxed text-muted">
              If you have any questions about this Privacy Policy, please visit{' '}
              <a
                href="https://mdcran.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:text-primary-dark transition-colors underline"
              >
                mdcran.com
              </a>.
            </p>
          </section>
        </div>

        <div className="mt-12 border-t border-card-border pt-6 flex items-center justify-between">
          <p className="text-[12px] text-muted-light">
            Health Tracker by MDCran
          </p>
          <Link
            href="/legal/terms"
            className="text-[13px] font-medium text-primary hover:text-primary-dark transition-colors"
          >
            Terms of Service
          </Link>
        </div>
      </div>
    </div>
  );
}
