import Header from '@/components/Header'
import Link from 'next/link'

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="max-w-3xl mx-auto px-6 py-16 space-y-8">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Last updated: March 1, 2026</p>
          <h1 className="text-3xl font-bold">Terms of Service</h1>
          <p className="text-muted-foreground">By using AgroGebeya, you agree to these terms. Please read them carefully.</p>
        </div>

        {[
          { title: '1. Acceptance of Terms', body: 'By registering or using AgroGebeya, you agree to be bound by these Terms of Service and our Privacy Policy. If you do not agree, you may not use the platform.' },
          { title: '2. Eligibility', body: 'You must be at least 18 years old and legally able to enter contracts under Ethiopian law. Business accounts must be registered entities in Ethiopia.' },
          { title: '3. User Accounts', body: 'You are responsible for maintaining the confidentiality of your account credentials. You must provide accurate information during registration. AgroGebeya reserves the right to suspend accounts that violate these terms.' },
          { title: '4. Farmer Obligations', body: 'Farmers must list only products they own or have the right to sell. Product descriptions, quantities, and prices must be accurate. Farmers must fulfill confirmed orders in a timely manner.' },
          { title: '5. Retailer Obligations', body: 'Retailers must only place orders they intend to fulfill. Payment must be completed through the platform\'s approved payment gateway. Cancellations of confirmed orders may incur fees.' },
          { title: '6. Prohibited Activities', body: 'You may not use AgroGebeya to list counterfeit or prohibited goods, engage in price manipulation, harass other users, attempt to circumvent the platform\'s payment system, or violate any applicable Ethiopian law.' },
          { title: '7. Payments and Fees', body: 'AgroGebeya charges a platform fee on completed transactions. Fees are displayed before order confirmation. All payments are processed through licensed payment gateways. Refunds are subject to our refund policy.' },
          { title: '8. Dispute Resolution', body: 'Disputes between farmers and retailers should first be reported to AgroGebeya support. We will attempt mediation. Unresolved disputes are subject to Ethiopian law and the jurisdiction of Addis Ababa courts.' },
          { title: '9. Limitation of Liability', body: 'AgroGebeya is a marketplace platform and is not responsible for the quality of goods, delivery failures, or disputes between users. Our liability is limited to the platform fees paid in the relevant transaction.' },
          { title: '10. Changes to Terms', body: 'We may update these terms at any time. Continued use of the platform after changes constitutes acceptance. We will notify users of material changes via email.' },
        ].map(({ title, body }) => (
          <section key={title} className="space-y-2">
            <h2 className="text-lg font-semibold">{title}</h2>
            <p className="text-muted-foreground text-sm leading-relaxed">{body}</p>
          </section>
        ))}

        <div className="flex gap-4 pt-4 border-t text-sm">
          <Link href="/legal/privacy" className="text-primary hover:underline">Privacy Policy</Link>
          <Link href="/legal/cookies" className="text-primary hover:underline">Cookie Policy</Link>
        </div>
      </main>
    </div>
  )
}
