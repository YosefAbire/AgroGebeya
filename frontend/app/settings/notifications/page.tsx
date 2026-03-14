'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/hooks/use-auth'
import { notificationService } from '@/lib/services/notification-service'
import { NotificationPreferences } from '@/lib/types-extended'
import { Bell } from 'lucide-react'
import { toast } from 'sonner'

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

  const PREF_LABELS: { key: keyof NotificationPreferences; label: string }[] = [
    { key: 'email_notifications', label: 'Email Notifications' },
    { key: 'sms_notifications', label: 'SMS Notifications' },
    { key: 'push_notifications', label: 'Push Notifications' },
    { key: 'order_updates', label: 'Order Updates' },
    { key: 'payment_updates', label: 'Payment Updates' },
    { key: 'transport_updates', label: 'Transport Updates' },
    { key: 'message_notifications', label: 'New Messages' },
  ]

  return (
    <div className="max-w-xl mx-auto py-8 px-4">
      <div className="flex items-center gap-3 mb-6">
        <Bell className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Notification Preferences</h1>
      </div>
      <Card>
        <CardHeader><CardTitle>Configure Notifications</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <p className="text-muted-foreground text-sm">Loading...</p>
          ) : !prefs ? (
            <p className="text-destructive text-sm">Failed to load preferences</p>
          ) : (
            <>
              {PREF_LABELS.map(({ key, label }) => (
                <div key={key} className="flex items-center justify-between py-2 border-b last:border-0">
                  <Label htmlFor={key}>{label}</Label>
                  <Switch id={key} checked={!!prefs[key]} onCheckedChange={() => toggle(key)} />
                </div>
              ))}
              <Button onClick={save} disabled={saving} className="w-full mt-4">
                {saving ? 'Saving...' : 'Save Preferences'}
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
