"use client";

import React from "react";
import { Shield } from "lucide-react";

export default function PrivacyPolicyPage() {
  return (
    <div className="w-full max-w-4xl mx-auto px-4 md:px-6 py-20 space-y-10">
      <div className="space-y-4 border-b border-[var(--m-border-primary)] pb-8">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-emerald-500/25 bg-emerald-950/20 text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
          <Shield className="size-3" /> Legal Document
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-[var(--m-text-heading)] tracking-tight">
          Privacy Policy
        </h1>
        <p className="text-xs text-[var(--m-text-muted)]">Last updated: April 11, 2026</p>
      </div>

      <div className="space-y-8 text-xs sm:text-sm text-[var(--m-text-secondary)] leading-relaxed">
        <p>
          This Privacy Policy (the &quot;Policy&quot;) describes how ChatNexGen Ai (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) collects, uses, maintains, and discloses information from users of our Platform. By accessing or using ChatNexGen Ai, you consent to the practices described in this Policy. If you do not agree, please do not use the Platform.
        </p>

        <section className="space-y-3">
          <h3 className="text-lg font-bold text-[var(--m-text-heading)]">1. Our Platform and Services</h3>
          <p>
            ChatNexGen Ai is a WhatsApp automation platform for businesses. We offer subscription plans that align with what we describe on our pricing page, including:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-[var(--m-text-tertiary)]">
            <li>
              <strong className="text-[var(--m-text-secondary)]">Starter (self-service):</strong> Full platform access for you to build and run your own automation — including automated campaigns, a no-code chatbot builder, workflow automation, a visual flow builder, access to the official WhatsApp Business API, Click-to-WhatsApp (CTWA) ads and attribution, contact list segmentation, rich media (images, video, documents, interactive elements), custom fields and contact tags, team collaboration (for example, multiple seats in one workspace), integrations such as Shopify, WooCommerce, Razorpay, Google Sheets, Zapier, Make, and similar tools, plus API and webhook access. WhatsApp conversation fees are charged by Meta; we pass those rates through without markup. We also provide migration assistance from other WhatsApp platforms and onboarding support.
            </li>
            <li>
              <strong className="text-[var(--m-text-secondary)]">Managed (done-for-you):</strong> Everything in Starter, plus services where our team configures and operates automation on your behalf — such as setup and integration of your WhatsApp Business Account (WABA), custom chatbot flows, recurring message campaigns, connected integrations, performance reporting, a dedicated account contact, support for Meta message template workflows, and ongoing optimization under the terms of your agreement with us.
            </li>
          </ul>
          <p>
            Providing these services requires us to process account, billing, technical, messaging, and — where applicable — integration data as described below.
          </p>
        </section>

        <section className="space-y-3">
          <h3 className="text-lg font-bold text-[var(--m-text-heading)]">2. Personal Information</h3>
          <p>
            &quot;Personal Information&quot; means information that identifies you, such as your name, email address, and WhatsApp account details. &quot;Sensitive Personal Information&quot; includes passwords, payment data, and other data protected by law. We only collect information necessary to provide our services.
          </p>
        </section>

        <section className="space-y-3">
          <h3 className="text-lg font-bold text-[var(--m-text-heading)]">3. Information We Collect</h3>
          <ul className="list-disc pl-5 space-y-2 text-[var(--m-text-tertiary)]">
            <li><strong className="text-[var(--m-text-secondary)]">Account and identity:</strong> Name, email address, phone number, company name, and similar details you provide when you sign up, apply for a plan, or contact us — including information we use to provision access manually where described on our pricing or checkout flows.</li>
            <li><strong className="text-[var(--m-text-secondary)]">Billing and payments:</strong> Payment-related information is processed by our payment partners (for example, Razorpay). We receive limited billing details needed to confirm subscription status and comply with accounting and legal obligations.</li>
            <li><strong className="text-[var(--m-text-secondary)]">WhatsApp and messaging:</strong> Data required to connect and operate your WhatsApp Business Account through the platform — such as identifiers, configuration, template and messaging metadata, and content that passes through our systems when you send or receive messages — in accordance with Meta&#39;s WhatsApp Business policies and your settings.</li>
            <li><strong className="text-[var(--m-text-secondary)]">Your customers&#39; data (contacts and conversations):</strong> Contact lists, tags, custom fields, conversation content, and related data you or your team upload or generate while using campaigns, chatbots, workflows, and the inbox. You are responsible for having a lawful basis to collect and use that data; we process it only to provide the services you request.</li>
            <li><strong className="text-[var(--m-text-secondary)]">Integrations:</strong> When you connect third-party services (e.g. e-commerce, payments, sheets, or automation tools), we may receive or store credentials, tokens, or payloads needed to sync data and run workflows you configure.</li>
            <li><strong className="text-[var(--m-text-secondary)]">Advertising and attribution:</strong> Where you use Click-to-WhatsApp or related features, we may process campaign and attribution data as needed to report performance within the Platform.</li>
            <li><strong className="text-[var(--m-text-secondary)]">Managed services:</strong> If you use our Managed offering, we may collect additional operational information you share with our team (briefs, assets, schedules, performance feedback) to deliver setup, campaigns, and reporting.</li>
            <li><strong className="text-[var(--m-text-secondary)]">Cookies:</strong> We use cookies to enhance your experience. You may disable cookies in your browser, but some features may not function properly.</li>
            <li><strong className="text-[var(--m-text-secondary)]">Technical and usage data:</strong> Browser type, device, IP address, logs, and usage statistics to operate, secure, and improve our Platform.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h3 className="text-lg font-bold text-[var(--m-text-heading)]">4. How We Use and Share Information</h3>
          <ul className="list-disc pl-5 space-y-2 text-[var(--m-text-tertiary)]">
            <li>To provide and operate the Platform and the features above — including account setup, chatbots, custom workflows, integrations, APIs, team access, and (where purchased) Managed services.</li>
            <li>To communicate with you about your account, billing, onboarding, support, product updates, and (where permitted) offers — and to respond to inquiries.</li>
            <li>To work with service providers and infrastructure that help us host, secure, analyze, or deliver the Platform — including Meta (WhatsApp), payment processors, email and messaging providers, and cloud hosting — subject to confidentiality and purpose limitations.</li>
            <li>To improve, secure, and customize our Platform.</li>
          </ul>
          <p>
            We do not sell, trade, or rent your personal information. We may share aggregated, non-identifiable data for analytics or business purposes. We may disclose information if required by law or to protect our rights, users, or the public.
          </p>
        </section>

        <section className="space-y-3">
          <h3 className="text-lg font-bold text-[var(--m-text-heading)]">5. Your Choices</h3>
          <p>
            You may disable cookies in your browser settings. You may opt out of marketing communications at any time by contacting us. You may update or delete your information by contacting us. Some information may be required to use our services.
          </p>
        </section>

        <section className="space-y-3">
          <h3 className="text-lg font-bold text-[var(--m-text-heading)]">6. Your Rights</h3>
          <p>
            Depending on your location, you may have rights regarding your personal information, such as access, correction, deletion, or restriction. To exercise your rights, contact us at <a href="mailto:chatnexgenai@gmail.com" className="text-emerald-400 hover:underline">chatnexgenai@gmail.com</a>.
          </p>
        </section>

        <section className="space-y-3">
          <h3 className="text-lg font-bold text-[var(--m-text-heading)]">7. Data Security</h3>
          <p>
            We implement reasonable security measures to protect your information. However, no method of transmission or storage is 100% secure. Use the Platform at your own risk.
          </p>
        </section>

        <section className="space-y-3">
          <h3 className="text-lg font-bold text-[var(--m-text-heading)]">8. Changes to This Policy</h3>
          <p>
            We may update this Policy from time to time. Changes will be posted on this page. Continued use of ChatNexGen Ai after changes means you accept the updated Policy.
          </p>
        </section>

        <section className="space-y-3 text-center pt-8 border-t border-[var(--m-border-primary)]/50">
          <h3 className="text-lg font-bold text-[var(--m-text-heading)]">9. Contact</h3>
          <p>
            For questions or concerns about this Policy, contact us at <a href="mailto:chatnexgenai@gmail.com" className="text-emerald-400 hover:underline">chatnexgenai@gmail.com</a>.
          </p>
        </section>
      </div>
    </div>
  );
}
