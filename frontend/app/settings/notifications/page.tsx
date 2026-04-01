'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Bell, Mail, MessageSquare, Smartphone, ShoppingBag, CreditCard, Truck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { useAuth } from '@/hooks/use-auth'
import { notificationService } from '@/lib/services/notification-service'
import { NotificationPreferences } from '@/lib/types-extended'
import { toast } from 'sonner'

const PREF_GROUPS = [
  {
    title: 'Channels',
    items: [
      { key: 'email_notifications' as const, label: 'Email', description: 'Receive updates via email', icon: Mail },
      { key: 'sms_notifications' as const, label: 'SMS', description: 'Receive text message alerts', icon: Smartphone },
      { key: 'push_notifications' as const, label: 'Push', description: 'In-app push notifications', icon: Bell },
    ],
  },
  {
    title: 'Activity',
    items: [
      { key: 'order_updates' as const, label: 'Order Updates', description: 'Status changes on your orders', icon: ShoppingBag },
      { key: 'payment_updates' as const, label: 'Payment Updates', description: 'Payment confirmations and receipts', icon: CreditCard },
      { key: 'transport_updates' as const, label: 'Transport Updates', description: 'Delivery and pickup notifications', icon: Truck },
      { key: 'message_notifications' as const, label: 'New Messages', description: 'When someone sends you a message', icon: MessageSquare },
    ],
  },
]

export default function NotificationPreferencesPage() {
  const { token } = useAuth()
  const [prefs, setPrefs] = useState<NotificationPreferences | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!token) return
    notificationService.getPreferences(token)
      .then(setPrefs)
      .catch(() => toast.error('Failed to load preferences'))
      .finally(() => setLoading(false))
  }, [token])

  const toggle = (key: keyof NotificationPreferences) => {
    if (!prefs) return
    setPrefs({ ...prefs, [key]: !prefs[key] })
  }

  const save = async () => {
    if (!token || !prefs) return
    setSaving(true)
    try {
      await notificationService.updatePreferences(prefs, token)
      toast.success('Preferences saved')
    } catch {
      toast.error('Failed to save preferences')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <Link href="/dashboard" className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors text-sm">
            <ArrowLeft className="w-4 h-4" />Back to Dashboard
          </Link>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 flex-shrink-0">
            <Bell className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Notifications</h1>
            <p className="text-sm text-muted-foreground">Choose what you want to be notified about</p>
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-16 rounded-lg bg-secondary/50 animate-pulse" />
            ))}
          </div>
        ) : !prefs ? (
          <div className="bg-card rounded-lg border border-border p-6 text-center text-sm text-destructive">
            Failed to load preferences. Please refresh.
          </div>
        ) : (
          <>
            {PREF_GROUPS.map(group => (
              <div key={group.title} className="bg-card rounded-lg border border-border overflow-hidden">
                <div className="px-4 py-3 border-b border-border bg-secondary/30">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{group.title}</p>
                </div>
                <div className="divide-y divide-border">
                  {group.items.map(({ key, label, description, icon: Icon }) => (
                    <div key={key} className="flex items-center gap-3 px-4 py-3.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary flex-shrink-0">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">{label}</p>
                        <p className="text-xs text-muted-foreground truncate">{description}</p>
                      </div>
                      <Switch
                        id={key}
                        checked={!!prefs[key]}
                        onCheckedChange={() => toggle(key)}
                        className="flex-shrink-0"
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <Button onClick={save} disabled={saving} className="w-full">
              {saving ? 'Saving...' : 'Save Preferences'}
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
