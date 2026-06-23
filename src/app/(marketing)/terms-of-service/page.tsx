"use client";

import React from "react";
import { Scale } from "lucide-react";

export default function TermsOfServicePage() {
  return (
    <div className="w-full max-w-4xl mx-auto px-4 md:px-6 py-20 space-y-10">
      <div className="space-y-4 border-b border-[var(--m-border-primary)] pb-8">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-emerald-500/25 bg-emerald-950/20 text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
          <Scale className="size-3" /> Legal Document
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-[var(--m-text-heading)] tracking-tight">
          Terms of Service
        </h1>
        <p className="text-xs text-[var(--m-text-muted)]">Last updated: March 10, 2026</p>
      </div>

      <div className="space-y-8 text-xs sm:text-sm text-[var(--m-text-secondary)] leading-relaxed">
        <p>
          These Terms of Service (&quot;Terms&quot;) govern your use of ChatNexGen Ai (the &quot;Platform&quot;), a WhatsApp automation SaaS, and any content, services, or features offered on or through the Platform. By accessing or using ChatNexGen Ai, you agree to be bound by these Terms, our Privacy Policy, and any other policies referenced herein. If you do not agree, please do not use the Platform.
        </p>

        <section className="space-y-3">
          <h3 className="text-lg font-bold text-[var(--m-text-heading)]">1. Access and Registration</h3>
          <p>
            You must be at least 18 years old, or have parental/guardian consent if between 13 and 18, to use ChatNexGen Ai. By registering, you represent that all information provided is accurate and complete. You are responsible for maintaining the confidentiality of your account and password.
          </p>
        </section>

        <section className="space-y-3">
          <h3 className="text-lg font-bold text-[var(--m-text-heading)]">2. License to Use</h3>
          <p>
            ChatNexGen Ai grants you a limited, non-exclusive, non-transferable license to access and use the Platform for your personal or business WhatsApp account(s), subject to these Terms. You may not:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-[var(--m-text-tertiary)]">
            <li>Resell, sublicense, or transfer your access to any third party.</li>
            <li>Remove any copyright, trademark, or proprietary notices.</li>
            <li>Reverse engineer, decompile, or attempt to extract the source code of the Platform.</li>
            <li>Use the Platform for any unlawful, abusive, or unauthorized purpose, including spam or activity prohibited by WhatsApp/Meta.</li>
            <li>Modify, copy, or create derivative works of any part of the Platform.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h3 className="text-lg font-bold text-[var(--m-text-heading)]">3. User Content & Conduct</h3>
          <p>
            You are solely responsible for any content, messages, or data you send or automate using ChatNexGen Ai. You agree not to use the Platform to harass, threaten, or violate the rights of others, or to post or transmit any unlawful, harmful, or offensive material. We reserve the right to suspend or terminate accounts for violations.
          </p>
        </section>

        <section className="space-y-3">
          <h3 className="text-lg font-bold text-[var(--m-text-heading)]">4. Payments & Refunds</h3>
          <p>
            Access to certain features may require payment of a subscription fee. All payments are processed via third-party providers. All purchases are final and non-refundable, unless otherwise stated in our Refund Policy.
          </p>
        </section>

        <section className="space-y-3">
          <h3 className="text-lg font-bold text-[var(--m-text-heading)]">5. Intellectual Property</h3>
          <p>
            All content, software, trademarks, and materials on ChatNexGen Ai are the property of ChatNexGen Ai or its licensors. You may not use, reproduce, or distribute any part of the Platform except as expressly permitted by these Terms.
          </p>
        </section>

        <section className="space-y-3">
          <h3 className="text-lg font-bold text-[var(--m-text-heading)]">6. Disclaimer</h3>
          <p>
            THE PLATFORM IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT WARRANTY OF ANY KIND. CHATNEXGEN AI DISCLAIMS ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. WE DO NOT WARRANT THAT THE PLATFORM WILL BE UNINTERRUPTED, ERROR-FREE, OR SECURE.
          </p>
        </section>

        <section className="space-y-3">
          <h3 className="text-lg font-bold text-[var(--m-text-heading)]">7. Limitation of Liability</h3>
          <p>
            To the maximum extent permitted by law, ChatNexGen Ai shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or data, arising from your use of the Platform.
          </p>
        </section>

        <section className="space-y-3">
          <h3 className="text-lg font-bold text-[var(--m-text-heading)]">8. Indemnity</h3>
          <p>
            You agree to indemnify and hold harmless ChatNexGen Ai, its officers, directors, and employees from any claims, damages, or expenses arising from your use of the Platform or violation of these Terms.
          </p>
        </section>

        <section className="space-y-3">
          <h3 className="text-lg font-bold text-[var(--m-text-heading)]">9. Changes to Terms</h3>
          <p>
            We may update these Terms at any time. Continued use of ChatNexGen Ai after changes constitutes acceptance of the new Terms. Please review this page periodically.
          </p>
        </section>

        <section className="space-y-3">
          <h3 className="text-lg font-bold text-[var(--m-text-heading)]">10. Governing Law</h3>
          <p>
            These Terms are governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of the courts in India.
          </p>
        </section>

        <section className="space-y-3 text-center pt-8 border-t border-[var(--m-border-primary)]/50">
          <h3 className="text-lg font-bold text-[var(--m-text-heading)]">11. Contact</h3>
          <p>
            For questions or concerns about these Terms, please contact us at <a href="mailto:chatnexgenai@gmail.com" className="text-emerald-400 hover:underline">chatnexgenai@gmail.com</a>.
          </p>
        </section>
      </div>
    </div>
  );
}
