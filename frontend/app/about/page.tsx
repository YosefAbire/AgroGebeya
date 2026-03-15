import Link from 'next/link'
import Header from '@/components/Header'

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="max-w-4xl mx-auto px-6 py-16 space-y-16">
        {/* Hero */}
        <section className="text-center space-y-4">
          <h1 className="text-4xl font-bold">About AgroGebeya</h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Ethiopia's digital agricultural marketplace — connecting farmers directly with retailers to build a fairer, more transparent food supply chain.
          </p>
        </section>

        {/* Mission */}
        <section className="grid md:grid-cols-2 gap-10 items-center">
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Our Mission</h2>
            <p className="text-muted-foreground leading-relaxed">
              AgroGebeya was built to eliminate the middlemen that have historically kept Ethiopian farmers from receiving fair prices for their produce. By connecting farmers and retailers on a single platform, we enable direct trade, transparent pricing, and real-time order tracking.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              We believe technology can transform agriculture — not just for profit, but for food security, rural livelihoods, and sustainable growth across Ethiopia.
            </p>
          </div>
          <div className="bg-green-50 rounded-2xl p-8 space-y-4">
            {[
              { stat: '10,000+', label: 'Farmers registered' },
              { stat: '3,000+', label: 'Active retailers' },
              { stat: '50+', label: 'Cities covered' },
              { stat: '₿ 2M+', label: 'ETB in transactions' },
            ].map(({ stat, label }) => (
              <div key={label} className="flex items-center justify-between border-b border-green-100 pb-3 last:border-0 last:pb-0">
                <span className="text-muted-foreground text-sm">{label}</span>
                <span className="font-bold text-green-700 text-lg">{stat}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Values */}
        <section className="space-y-6">
          <h2 className="text-2xl font-bold text-center">Our Values</h2>
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              { icon: '🌱', title: 'Sustainability', desc: 'Supporting farming practices that protect Ethiopia\'s land and future generations.' },
              { icon: '🤝', title: 'Fairness', desc: 'Ensuring farmers receive fair compensation and retailers get quality produce.' },
              { icon: '🔒', title: 'Trust', desc: 'Verified users, secure payments, and transparent transactions at every step.' },
            ].map(({ icon, title, desc }) => (
              <div key={title} className="rounded-xl border p-6 space-y-3">
                <span className="text-3xl">{icon}</span>
                <h3 className="font-semibold">{title}</h3>
                <p className="text-muted-foreground text-sm">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="text-center space-y-4 bg-green-700 text-white rounded-2xl p-12">
          <h2 className="text-2xl font-bold">Join the Movement</h2>
          <p className="text-green-200 max-w-md mx-auto">Whether you're a farmer with produce to sell or a retailer looking for quality supply, AgroGebeya is built for you.</p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Link href="/auth/register" className="bg-white text-green-700 font-semibold px-6 py-2.5 rounded-lg hover:bg-green-50 transition-colors">
              Get Started
            </Link>
            <Link href="/contact" className="border border-white/40 text-white px-6 py-2.5 rounded-lg hover:bg-white/10 transition-colors">
              Contact Us
            </Link>
          </div>
        </section>
      </main>
    </div>
  )
}
