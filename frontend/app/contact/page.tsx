'use client'
import { useState } from 'react'
import Header from '@/components/Header'

export default function ContactPage() {
  const [sent, setSent] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSent(true)
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="max-w-5xl mx-auto px-6 py-16">
        <div className="text-center space-y-3 mb-12">
          <h1 className="text-4xl font-bold">Contact Us</h1>
          <p className="text-muted-foreground">Have a question or need support? We're here to help.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-12">
          {/* Info */}
          <div className="space-y-8">
            {[
              { icon: '📍', title: 'Address', lines: ['Bole Sub-City, Woreda 03', 'Addis Ababa, Ethiopia'] },
              { icon: '📧', title: 'Email', lines: ['support@agrogebeya.com', 'info@agrogebeya.com'] },
              { icon: '📞', title: 'Phone', lines: ['+251 11 234 5678', '+251 91 234 5678'] },
              { icon: '🕐', title: 'Hours', lines: ['Monday – Friday: 8am – 6pm', 'Saturday: 9am – 2pm'] },
            ].map(({ icon, title, lines }) => (
              <div key={title} className="flex gap-4">
                <span className="text-2xl">{icon}</span>
                <div>
                  <p className="font-semibold">{title}</p>
                  {lines.map(l => <p key={l} className="text-muted-foreground text-sm">{l}</p>)}
                </div>
              </div>
            ))}
          </div>

          {/* Form */}
          <div className="rounded-xl border bg-card p-8">
            {sent ? (
              <div className="text-center py-8 space-y-3">
                <span className="text-4xl">✅</span>
                <h3 className="font-semibold text-lg">Message Sent!</h3>
                <p className="text-muted-foreground text-sm">We'll get back to you within 24 hours.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {(['name', 'email', 'subject'] as const).map(field => (
                  <div key={field} className="space-y-1">
                    <label className="text-sm font-medium capitalize">{field}</label>
                    <input
                      type={field === 'email' ? 'email' : 'text'}
                      required
                      value={form[field]}
                      onChange={e => setForm(p => ({ ...p, [field]: e.target.value }))}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                ))}
                <div className="space-y-1">
                  <label className="text-sm font-medium">Message</label>
                  <textarea
                    required rows={4}
                    value={form.message}
                    onChange={e => setForm(p => ({ ...p, message: e.target.value }))}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                  />
                </div>
                <button type="submit" className="w-full bg-primary text-primary-foreground rounded-md py-2.5 text-sm font-medium hover:bg-primary/90 transition-colors">
                  Send Message
                </button>
              </form>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
