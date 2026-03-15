import Header from '@/components/Header'
import Link from 'next/link'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="max-w-3xl mx-auto px-6 py-16 space-y-8">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Last updated: March 1, 2026</p>
          <h1 className="text-3xl font-bold">Privacy Policy</h1>
          <p className="text-muted-foreground">This policy explains how AgroGebeya collects, uses, and protects your personal information.</p>
        </div>

        {[
          { title: '1. Information We Collect', body: 'We collect information you provide directly (name, email, phone, national ID for verification), information generated through your use of the platform (orders, messages, transaction history), and technical data (IP address, device type, browser).' },
          { title: '2. How We Use Your Information', body: 'We use your information to operate the marketplace, process payments, verify your identity, send order and payment notifications, improve our services, and comply with Ethiopian law.' },
          { title: '3. Information Sharing', body: 'We share your information with other users only as necessary to complete transactions (e.g., your name and location with a farmer when you place an order). We do not sell your personal data to third parties.' },
          { title: '4. Payment Data', body: 'Payment processing is handled by Chapa, a licensed Ethiopian payment gateway. We do not store your full card or bank details. Please review Chapa\'s privacy policy for details on how they handle payment data.' },
          { title: '5. Data Security', body: 'We use industry-standard encryption (TLS) for data in transit and AES-256 for sensitive data at rest. Access to personal data is restricted to authorized personnel only.' },
          { title: '6. Your Rights', body: 'You have the right to access, correct, or delete your personal data. You may also request a copy of your data or withdraw consent for marketing communications at any time by contacting support@agrogebeya.com.' },
          { title: '7. Data Retention', body: 'We retain your data for as long as your account is active or as required by Ethiopian law. Transaction records are retained for 7 years for tax and audit purposes.' },
          { title: '8. Contact', body: 'For privacy-related questions, contact our Data Protection Officer at privacy@agrogebeya.com or write to us at Bole Sub-City, Woreda 03, Addis Ababa, Ethiopia.' },
        ].map(({ title, body }) => (
          <section key={title} className="space-y-2">
            <h2 className="text-lg font-semibold">{title}</h2>
            <p className="text-muted-foreground text-sm leading-relaxed">{body}</p>
          </section>
        ))}

        <div className="flex gap-4 pt-4 border-t text-sm">
          <Link href="/legal/terms" className="text-primary hover:underline">Terms of Service</Link>
          <Link href="/legal/cookies" className="text-primary hover:underline">Cookie Policy</Link>
        </div>
      </main>
    </div>
  )
}
