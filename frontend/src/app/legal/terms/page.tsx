import Link from 'next/link';

export default function TermsOfServicePage() {
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
            Terms of Service
          </h1>
          <p className="mt-2 text-[14px] text-muted">
            Last updated: March 2026
          </p>
        </div>

        <div className="space-y-10">
          <section className="rounded-xl border border-card-border bg-card-bg p-6">
            <h2 className="text-[18px] font-semibold text-foreground mb-3">
              1. Introduction and Acceptance
            </h2>
            <p className="text-[14px] leading-relaxed text-muted">
              Welcome to Health Tracker by MDCran. By accessing or using this application, you agree to
              be bound by these Terms of Service. If you do not agree to these terms, please do not use
              the application. This application is developed and maintained as an educational and personal
              project by a student developer. It is provided on an &ldquo;as-is&rdquo; basis.
            </p>
          </section>

          <section className="rounded-xl border border-card-border bg-card-bg p-6">
            <h2 className="text-[18px] font-semibold text-foreground mb-3">
              2. Nature of the Application
            </h2>
            <div className="space-y-3 text-[14px] leading-relaxed text-muted">
              <p>
                Health Tracker is a <strong className="text-foreground">personal wellness and health tracking tool</strong>.
                It is <strong className="text-foreground">not medical software</strong>, a medical device, or a
                diagnostic tool of any kind. This application does not provide medical advice, diagnoses,
                treatment recommendations, or any form of clinical guidance.
              </p>
              <p>
                This application is <strong className="text-foreground">not a substitute for professional medical advice</strong>,
                diagnosis, or treatment. Always seek the advice of a qualified healthcare provider with any
                questions you may have regarding a medical condition. Never disregard professional medical
                advice or delay in seeking it because of information entered into or displayed by this application.
              </p>
              <p>
                The developer of this application is a student, and this project is created for
                educational and personal use purposes. It should be treated accordingly.
              </p>
            </div>
          </section>

          <section className="rounded-xl border border-danger/30 bg-danger/5 p-6">
            <h2 className="text-[18px] font-semibold text-foreground mb-3">
              3. HIPAA Disclaimer
            </h2>
            <div className="space-y-3 text-[14px] leading-relaxed text-muted">
              <p>
                This application is <strong className="text-foreground">not a HIPAA-covered entity</strong>.
                Health Tracker is not a healthcare provider, health plan, or healthcare clearinghouse as
                defined under the Health Insurance Portability and Accountability Act of 1996 (HIPAA).
              </p>
              <p>
                While reasonable measures are taken to protect your data, this application does not
                guarantee compliance with HIPAA security or privacy standards. By using this application,
                you acknowledge that any health-related information you enter is done so voluntarily and
                at your own discretion.
              </p>
            </div>
          </section>

          <section className="rounded-xl border border-card-border bg-card-bg p-6">
            <h2 className="text-[18px] font-semibold text-foreground mb-3">
              4. User Data and Responsibilities
            </h2>
            <div className="space-y-3 text-[14px] leading-relaxed text-muted">
              <p>
                All health data entries in this application are <strong className="text-foreground">voluntary and user-initiated</strong>.
                You are solely responsible for the accuracy, completeness, and appropriateness of any
                information you enter into the application.
              </p>
              <p>
                The developer assumes no responsibility for verifying, validating, or interpreting any
                health data that you enter. Any summaries, calculations, or visualizations generated from
                your data are based solely on the information you provide and should not be relied upon
                for medical or health decisions.
              </p>
            </div>
          </section>

          <section className="rounded-xl border border-card-border bg-card-bg p-6">
            <h2 className="text-[18px] font-semibold text-foreground mb-3">
              5. Data Storage
            </h2>
            <div className="space-y-3 text-[14px] leading-relaxed text-muted">
              <p>
                Your data is stored in an encrypted database maintained by the application. Additionally,
                you may optionally connect your Google Drive account for file storage.
              </p>
              <p>
                When Google Drive integration is enabled, the following types of files may be stored on
                your personal Google Drive:
              </p>
              <ul className="list-disc pl-6 space-y-1.5">
                <li>Progress photos</li>
                <li>Medical records and documents</li>
                <li>Journal entry PDFs</li>
                <li>Other user-uploaded files</li>
              </ul>
              <p>
                Google Drive storage is used only with your explicit consent and authorization. The
                application accesses only the files and folders it creates; it does not access your
                other Google Drive content.
              </p>
            </div>
          </section>

          <section className="rounded-xl border border-card-border bg-card-bg p-6">
            <h2 className="text-[18px] font-semibold text-foreground mb-3">
              6. OpenAI API Usage
            </h2>
            <div className="space-y-3 text-[14px] leading-relaxed text-muted">
              <p>
                Certain features of this application, such as AI-powered nutrition analysis, require an
                OpenAI API key. You are responsible for providing your own API key and for any costs
                associated with its usage.
              </p>
              <p>
                When you use AI-powered features, data such as meal descriptions or images may be sent
                to OpenAI&apos;s API for processing. This data is subject to{' '}
                <a
                  href="https://openai.com/policies/terms-of-use"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:text-primary-dark transition-colors underline"
                >
                  OpenAI&apos;s Terms of Use
                </a>{' '}
                and{' '}
                <a
                  href="https://openai.com/policies/privacy-policy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:text-primary-dark transition-colors underline"
                >
                  Privacy Policy
                </a>.
                The developer is not responsible for how OpenAI processes, stores, or uses data sent
                through their API.
              </p>
            </div>
          </section>

          <section className="rounded-xl border border-card-border bg-card-bg p-6">
            <h2 className="text-[18px] font-semibold text-foreground mb-3">
              7. Limitation of Liability
            </h2>
            <div className="space-y-3 text-[14px] leading-relaxed text-muted">
              <p>
                The developer is <strong className="text-foreground">not liable for any health decisions</strong> made
                based on data entered into, stored by, or displayed by this application. You use this
                application entirely at your own risk.
              </p>
              <p>
                To the maximum extent permitted by applicable law, the developer shall not be liable for
                any indirect, incidental, special, consequential, or punitive damages, including but not
                limited to loss of data, loss of profits, personal injury, or damages arising from your
                use of or inability to use the application.
              </p>
            </div>
          </section>

          <section className="rounded-xl border border-card-border bg-card-bg p-6">
            <h2 className="text-[18px] font-semibold text-foreground mb-3">
              8. Disclaimer of Warranties
            </h2>
            <div className="space-y-3 text-[14px] leading-relaxed text-muted">
              <p>
                This application is provided <strong className="text-foreground">&ldquo;as is&rdquo; and
                &ldquo;as available&rdquo;</strong> without warranties of any kind, whether express or implied,
                including but not limited to implied warranties of merchantability, fitness for a particular
                purpose, and non-infringement.
              </p>
              <p>
                The developer makes no warranty that the application will be uninterrupted, timely,
                secure, or error-free, or that any data stored within the application will be preserved
                indefinitely.
              </p>
            </div>
          </section>

          <section className="rounded-xl border border-card-border bg-card-bg p-6">
            <h2 className="text-[18px] font-semibold text-foreground mb-3">
              9. Account Deletion
            </h2>
            <p className="text-[14px] leading-relaxed text-muted">
              You may delete your account and all associated data at any time through the application&apos;s
              settings. Upon account deletion, all data stored in the application&apos;s database will be
              permanently removed. Files stored on your Google Drive, if applicable, may require separate
              removal through your Google Drive account.
            </p>
          </section>

          <section className="rounded-xl border border-card-border bg-card-bg p-6">
            <h2 className="text-[18px] font-semibold text-foreground mb-3">
              10. Changes to These Terms
            </h2>
            <p className="text-[14px] leading-relaxed text-muted">
              The developer reserves the right to modify these terms at any time. Continued use of the
              application after any changes constitutes acceptance of the updated terms. Users are
              encouraged to review these terms periodically.
            </p>
          </section>

          <section className="rounded-xl border border-warning/30 bg-warning/5 p-6">
            <h2 className="text-[18px] font-semibold text-foreground mb-3">
              11. Data Security and Breach Disclosure
            </h2>
            <div className="space-y-3 text-[14px] leading-relaxed text-muted">
              <p>
                While the developer implements reasonable security measures including encryption at rest
                and secure authentication, <strong className="text-foreground">no system is completely immune
                to security breaches</strong>. By using this application, you acknowledge and accept this
                inherent risk.
              </p>
              <p>
                In the event of a data breach or unauthorized access to stored data, the developer will
                make reasonable efforts to notify affected users. However, the developer shall{' '}
                <strong className="text-foreground">not be held liable for any damages, losses, or consequences</strong>{' '}
                resulting from any data breach, unauthorized access, data leak, or security incident,
                whether caused by the developer, third-party services (including but not limited to
                database providers, hosting services, Google Drive, or OpenAI), or any other party.
              </p>
              <p>
                You acknowledge that all data you enter into this application is entered voluntarily and
                at your own risk. The developer strongly recommends not entering highly sensitive medical
                information (such as Social Security numbers, insurance details, or diagnosis codes) into
                this application.
              </p>
            </div>
          </section>

          <section className="rounded-xl border border-card-border bg-card-bg p-6">
            <h2 className="text-[18px] font-semibold text-foreground mb-3">
              12. AI Training and Data Usage
            </h2>
            <div className="space-y-3 text-[14px] leading-relaxed text-muted">
              <p>
                The developer does <strong className="text-foreground">not use your personal data for AI
                training, machine learning model development, or any form of automated analysis</strong>{' '}
                beyond the features you explicitly use within the application (such as AI-powered
                nutrition analysis via your own OpenAI API key).
              </p>
              <p>
                Your data is not sold, licensed, shared with, or made available to any third party for
                the purposes of AI training, data mining, advertising, profiling, or research of any kind.
              </p>
              <p>
                When you use AI-powered features with your own OpenAI API key, data is sent directly to
                OpenAI under their terms. The developer does not intercept, store, or retain any data
                processed by OpenAI beyond what is displayed to you in the application. Please review{' '}
                <a href="https://openai.com/policies/api-data-usage-policies" target="_blank" rel="noopener noreferrer"
                  className="text-primary hover:text-primary-dark transition-colors underline">
                  OpenAI&apos;s API Data Usage Policy
                </a>{' '}
                for information on how they handle API data.
              </p>
              <p>
                The developer reserves the right to collect anonymized, non-identifiable aggregate
                statistics (such as total number of users or total workouts logged) for operational
                purposes only. No individual user data is included in such statistics.
              </p>
            </div>
          </section>

          <section className="rounded-xl border border-danger/30 bg-danger/5 p-6">
            <h2 className="text-[18px] font-semibold text-foreground mb-3">
              13. Service Availability, Termination, and Account Removal
            </h2>
            <div className="space-y-3 text-[14px] leading-relaxed text-muted">
              <p>
                The developer reserves the right to{' '}
                <strong className="text-foreground">modify, suspend, or discontinue the application at any
                time, with or without notice</strong>, for any reason, including but not limited to
                technical issues, security concerns, legal obligations, or the developer&apos;s discretion.
              </p>
              <p>
                The developer reserves the right to{' '}
                <strong className="text-foreground">delete, suspend, or terminate any user account at any
                time</strong>, with or without cause and with or without notice. Reasons may include but
                are not limited to violation of these terms, abuse of the application, security concerns,
                or discontinuation of the service.
              </p>
              <p>
                In the event of service discontinuation, the developer will make reasonable efforts to
                provide advance notice when possible. However, the developer shall{' '}
                <strong className="text-foreground">not be held liable for any data loss, disruption, or
                damages</strong>{' '}
                resulting from the suspension, modification, or termination of the service or any
                user account.
              </p>
              <p>
                Users are strongly encouraged to regularly export their data using the application&apos;s
                built-in PDF export feature and to maintain their own backups of any important health
                information.
              </p>
            </div>
          </section>

          <section className="rounded-xl border border-card-border bg-card-bg p-6">
            <h2 className="text-[18px] font-semibold text-foreground mb-3">
              14. Indemnification
            </h2>
            <div className="space-y-3 text-[14px] leading-relaxed text-muted">
              <p>
                You agree to indemnify, defend, and hold harmless the developer and any associated
                parties from and against any and all claims, damages, losses, liabilities, costs, and
                expenses (including reasonable legal fees) arising out of or in connection with:
              </p>
              <ul className="list-disc pl-6 space-y-1.5">
                <li>Your use of or inability to use the application</li>
                <li>Any data you enter into the application</li>
                <li>Your violation of these Terms of Service</li>
                <li>Any health decisions you make based on data in the application</li>
                <li>Your use of third-party services (OpenAI, Google Drive) through the application</li>
                <li>Any claim by a third party related to your use of the application</li>
              </ul>
            </div>
          </section>

          <section className="rounded-xl border border-card-border bg-card-bg p-6">
            <h2 className="text-[18px] font-semibold text-foreground mb-3">
              15. Governing Law
            </h2>
            <p className="text-[14px] leading-relaxed text-muted">
              These Terms of Service shall be governed by and construed in accordance with the laws of
              the United States. Any disputes arising from or relating to these terms or your use of
              the application shall be resolved through binding arbitration or in the courts of
              competent jurisdiction, at the developer&apos;s discretion.
            </p>
          </section>

          <section className="rounded-xl border border-card-border bg-card-bg p-6">
            <h2 className="text-[18px] font-semibold text-foreground mb-3">
              16. Contact
            </h2>
            <p className="text-[14px] leading-relaxed text-muted">
              If you have any questions about these Terms of Service, please visit{' '}
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
            href="/legal/privacy"
            className="text-[13px] font-medium text-primary hover:text-primary-dark transition-colors"
          >
            Privacy Policy
          </Link>
        </div>
      </div>
    </div>
  );
}
