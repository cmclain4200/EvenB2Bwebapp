'use client';

export default function SupportPage() {
  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-8">
        <h2 className="text-[16px] font-semibold text-text">Support</h2>
        <p className="text-[12px] text-text-muted mt-0.5">
          Get help from the Even team
        </p>
      </div>

      <div className="space-y-4">
        {/* Phone */}
        <a
          href="tel:+17207635244"
          className="block bg-white border border-border rounded-lg p-5 hover:border-primary/30 hover:shadow-sm transition-all group"
        >
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-primary-soft flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h3 className="text-[14px] font-semibold text-text group-hover:text-primary transition-colors">
                  Call Support
                </h3>
                <span className="text-[11px] font-medium text-success bg-success-soft px-2 py-0.5 rounded">
                  Quick response
                </span>
              </div>
              <p className="text-[12px] text-text-muted mt-1">
                Speak directly with our support team for immediate assistance.
              </p>
              <p className="text-[13px] font-medium text-primary mt-2">
                (720) 763-5244
              </p>
            </div>
          </div>
        </a>

        {/* Email */}
        <a
          href="mailto:support@useeven.com"
          className="block bg-white border border-border rounded-lg p-5 hover:border-primary/30 hover:shadow-sm transition-all group"
        >
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-primary-soft flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h3 className="text-[14px] font-semibold text-text group-hover:text-primary transition-colors">
                  Email Support
                </h3>
                <span className="text-[11px] font-medium text-text-muted bg-surface px-2 py-0.5 rounded">
                  Within 2 business days
                </span>
              </div>
              <p className="text-[12px] text-text-muted mt-1">
                Send us a detailed message and we&apos;ll get back to you.
              </p>
              <p className="text-[13px] font-medium text-primary mt-2">
                support@useeven.com
              </p>
            </div>
          </div>
        </a>
      </div>
    </div>
  );
}
