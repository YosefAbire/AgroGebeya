import Header from '@/components/Header'
import Link from 'next/link'

export default function CookiesPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="max-w-3xl mx-auto px-6 py-16 space-y-8">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Last updated: March 1, 2026</p>
          <h1 className="text-3xl font-bold">Cookie Policy</h1>
          <p className="text-muted-foreground">This policy explains how AgroGebeya uses cookies and similar technologies.</p>
        </div>

        {[
          { title: 'What Are Cookies?', body: 'Cookies are small text files stored on your device when you visit a website. They help the site remember your preferences and improve your experience.' },
          { title: 'Cookies We Use', body: '' },
          { title: 'How to Control Cookies', body: 'You can control cookies through your browser settings. Disabling essential cookies may affect platform functionality. You can opt out of analytics cookies without affecting your ability to use the platform.' },
          { title: 'Third-Party Cookies', body: 'Our payment provider (Chapa) may set cookies for fraud prevention and payment processing. These are governed by Chapa\'s own cookie policy.' },
          { title: 'Updates to This Policy', body: 'We may update this Cookie Policy from time to time. Continued use of the platform after changes constitutes acceptance.' },
        ].map(({ title, body }) => (
          <section key={title} className="space-y-3">
            <h2 className="text-lg font-semibold">{title}</h2>
            {title === 'Cookies We Use' ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 pr-4 font-medium">Type</th>
                      <th className="text-left py-2 pr-4 font-medium">Purpose</th>
                      <th className="text-left py-2 font-medium">Duration</th>
                    </tr>
                  </thead>
                  <tbody className="text-muted-foreground">
                    {[
                      ['Essential', 'Authentication, session management, security', 'Session'],
                      ['Functional', 'Remember language and display preferences', '1 year'],
                      ['Analytics', 'Understand how users interact with the platform (anonymized)', '2 years'],
                      ['Payment', 'Fraud prevention during checkout (Chapa)', 'Session'],
                    ].map(([type, purpose, duration]) => (
                      <tr key={type} className="border-b last:border-0">
                        <td className="py-2 pr-4 font-medium text-foreground">{type}</td>
                        <td className="py-2 pr-4">{purpose}</td>
                        <td className="py-2">{duration}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-muted-foreground text-sm leading-relaxed">{body}</p>
            )}
          </section>
        ))}

        <div className="flex gap-4 pt-4 border-t text-sm">
          <Link href="/legal/privacy" className="text-primary hover:underline">Privacy Policy</Link>
          <Link href="/legal/terms" className="text-primary hover:underline">Terms of Service</Link>
        </div>
      </main>
    </div>
  )
}
