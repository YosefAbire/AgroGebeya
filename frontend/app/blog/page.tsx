import Link from 'next/link'
import Header from '@/components/Header'

const POSTS = [
  { slug: 'fair-pricing-for-farmers', title: 'How Direct Trade is Changing Fair Pricing for Ethiopian Farmers', date: 'March 10, 2026', category: 'Farming', excerpt: 'Eliminating middlemen has allowed thousands of farmers to increase their income by up to 40% through direct retailer connections.' },
  { slug: 'digital-agriculture-ethiopia', title: 'The Rise of Digital Agriculture in Ethiopia', date: 'February 28, 2026', category: 'Technology', excerpt: 'Mobile-first platforms are transforming how rural farmers access markets, track orders, and receive payments.' },
  { slug: 'supply-chain-transparency', title: 'Why Supply Chain Transparency Matters for Food Security', date: 'February 14, 2026', category: 'Supply Chain', excerpt: 'Real-time tracking and verified transactions are building trust between farmers and retailers across the country.' },
  { slug: 'chapa-payments-agriculture', title: 'Secure Digital Payments Are Coming to Ethiopian Agriculture', date: 'January 30, 2026', category: 'Payments', excerpt: 'Integrated payment gateways like Chapa are making it easier than ever for farmers to receive instant, secure payments.' },
  { slug: 'seasonal-produce-guide', title: 'A Retailer\'s Guide to Seasonal Produce in Ethiopia', date: 'January 15, 2026', category: 'Guide', excerpt: 'Understanding seasonal availability helps retailers plan inventory and farmers plan their planting cycles.' },
  { slug: 'transport-logistics', title: 'Solving the Last-Mile Logistics Problem in Ethiopian Agriculture', date: 'January 5, 2026', category: 'Logistics', excerpt: 'Transport request management and government-approved routes are reducing delivery times and spoilage.' },
]

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="max-w-5xl mx-auto px-6 py-16 space-y-12">
        <div className="text-center space-y-3">
          <h1 className="text-4xl font-bold">Blog</h1>
          <p className="text-muted-foreground">Insights on agriculture, technology, and trade in Ethiopia.</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {POSTS.map(({ slug, title, date, category, excerpt }) => (
            <article key={slug} className="rounded-xl border bg-card overflow-hidden hover:shadow-md transition-shadow">
              <div className="bg-green-700 h-2" />
              <div className="p-6 space-y-3">
                <span className="text-xs font-medium text-green-700 bg-green-50 px-2 py-0.5 rounded-full">{category}</span>
                <h2 className="font-semibold leading-snug line-clamp-2">{title}</h2>
                <p className="text-muted-foreground text-sm line-clamp-3">{excerpt}</p>
                <div className="flex items-center justify-between pt-2">
                  <span className="text-xs text-muted-foreground">{date}</span>
                  <Link href={`/blog/${slug}`} className="text-xs text-primary font-medium hover:underline">Read more →</Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </main>
    </div>
  )
}
