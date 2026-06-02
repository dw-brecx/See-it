'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  Cloud,
  CreditCard,
  ExternalLink,
  Eye,
  EyeOff,
  Loader2,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Power,
  PowerOff,
  Save,
  Slack,
  Sparkles,
  type LucideIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { createClient } from '@/lib/supabase/client';
import { logAudit } from '@/lib/audit';
import { cn } from '@/lib/utils';
import type { Integration } from '@/lib/database.types';
import {
  CATEGORIES,
  INTEGRATIONS,
  type IntegrationDef,
} from './integrations-catalog';

const ICONS: Record<IntegrationDef['icon'], LucideIcon> = {
  CreditCard,
  Mail,
  MessageCircle,
  MapPin,
  BarChart3,
  AlertTriangle,
  Sparkles,
  Cloud,
  Slack,
  Phone,
};

export function IntegrationsPanel({
  integrations,
  missing,
}: {
  integrations: Integration[];
  missing: boolean;
}) {
  const byProvider = React.useMemo(() => {
    const m = new Map<string, Integration>();
    for (const i of integrations) m.set(i.provider, i);
    return m;
  }, [integrations]);

  const [editing, setEditing] = React.useState<IntegrationDef | null>(null);

  if (missing) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Run migration 005 first</CardTitle>
          <CardDescription>
            The <code className="rounded bg-warm-100 px-1.5 py-0.5">integrations</code>{' '}
            table doesn't exist yet. Paste{' '}
            <code className="rounded bg-warm-100 px-1.5 py-0.5">
              migrations/005_integrations.sql
            </code>{' '}
            into Supabase to enable this view.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Integrations</CardTitle>
          <CardDescription>
            Connect external services. Keys are stored encrypted-at-rest by
            Supabase and only readable by admins. Toggle on once you've added
            valid credentials.
          </CardDescription>
        </CardHeader>
      </Card>

      {CATEGORIES.map((cat) => {
        const items = INTEGRATIONS.filter((i) => i.category === cat.id);
        if (items.length === 0) return null;
        return (
          <div key={cat.id} className="space-y-3">
            <h3 className="px-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              {cat.label}
            </h3>
            <div className="grid gap-3 md:grid-cols-2">
              {items.map((def) => (
                <IntegrationCard
                  key={def.provider}
                  def={def}
                  state={byProvider.get(def.provider)}
                  onOpenEditor={() => setEditing(def)}
                />
              ))}
            </div>
          </div>
        );
      })}

      <IntegrationDialog
        def={editing}
        state={editing ? byProvider.get(editing.provider) : undefined}
        onClose={() => setEditing(null)}
      />
    </>
  );
}

function IntegrationCard({
  def,
  state,
  onOpenEditor,
}: {
  def: IntegrationDef;
  state: Integration | undefined;
  onOpenEditor: () => void;
}) {
  const router = useRouter();
  const Icon = ICONS[def.icon];
  const enabled = !!state?.is_enabled;
  const configured =
    state?.config &&
    Object.values(state.config as Record<string, unknown>).some(
      (v) => v != null && v !== '',
    );

  async function toggle() {
    if (!configured) {
      toast.error('Add credentials first');
      return;
    }
    const supabase = createClient();
    const next = !enabled;
    const { error } = await supabase
      .from('integrations')
      .upsert(
        {
          provider: def.provider,
          is_enabled: next,
          config: state?.config ?? {},
        },
        { onConflict: 'provider' },
      );
    if (error) {
      toast.error(`Failed: ${error.message}`);
      return;
    }
    await logAudit(supabase, {
      action: next ? 'enable' : 'disable',
      targetType: 'integration',
      targetLabel: def.name,
      metadata: { provider: def.provider },
    });
    toast.success(`${def.name} ${next ? 'enabled' : 'disabled'}`);
    router.refresh();
  }

  return (
    <Card className="relative overflow-hidden">
      <div
        aria-hidden
        className="absolute left-0 top-0 h-full w-[3px]"
        style={{ backgroundColor: enabled ? def.accent : 'transparent' }}
      />
      <CardContent className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
              style={{ backgroundColor: def.accent + '15', color: def.accent }}
            >
              <Icon className="h-4.5 w-4.5" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5">
                <p className="text-[14px] font-semibold">{def.name}</p>
                {enabled ? (
                  <Badge variant="success" className="gap-1">
                    <CheckCircle2 className="h-3 w-3" /> Connected
                  </Badge>
                ) : configured ? (
                  <Badge variant="warning">Configured</Badge>
                ) : (
                  <Badge variant="default">Not connected</Badge>
                )}
                {!def.wired && (
                  <Badge variant="secondary" title="Server-side wiring not yet built">
                    UI only
                  </Badge>
                )}
              </div>
              <p className="mt-0.5 text-[12.5px] text-muted-foreground">
                {def.description}
              </p>
            </div>
          </div>
        </div>

        <p className="text-[11.5px] text-muted-foreground">
          <span className="font-medium text-foreground">Unlocks:</span>{' '}
          {def.unlocks}
        </p>

        <div className="flex flex-wrap items-center gap-2 pt-1">
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenEditor}
            className="h-8 gap-1.5"
          >
            {configured ? 'Edit credentials' : 'Add credentials'}
          </Button>
          {configured && (
            <Button
              variant="outline"
              size="sm"
              onClick={toggle}
              className={cn(
                'h-8 gap-1.5',
                enabled && 'text-destructive hover:bg-destructive/10',
              )}
            >
              {enabled ? (
                <>
                  <PowerOff className="h-3.5 w-3.5" /> Disable
                </>
              ) : (
                <>
                  <Power className="h-3.5 w-3.5" /> Enable
                </>
              )}
            </Button>
          )}
          <a
            href={def.docsUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11.5px] font-semibold text-muted-foreground hover:bg-warm-50 hover:text-foreground"
          >
            Docs <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </CardContent>
    </Card>
  );
}

function IntegrationDialog({
  def,
  state,
  onClose,
}: {
  def: IntegrationDef | null;
  state: Integration | undefined;
  onClose: () => void;
}) {
  const router = useRouter();
  const [values, setValues] = React.useState<Record<string, string>>({});
  const [shown, setShown] = React.useState<Record<string, boolean>>({});
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (!def) return;
    const next: Record<string, string> = {};
    const cfg = (state?.config ?? {}) as Record<string, unknown>;
    for (const f of def.fields) {
      const v = cfg[f.key];
      next[f.key] = typeof v === 'string' ? v : v == null ? '' : String(v);
    }
    setValues(next);
    setShown({});
  }, [def, state?.id]);

  if (!def) return null;

  async function save() {
    if (!def) return;
    setSaving(true);
    try {
      const supabase = createClient();
      const cleanConfig: Record<string, string> = {};
      for (const [k, v] of Object.entries(values)) {
        if (v.trim() !== '') cleanConfig[k] = v.trim();
      }
      const { error } = await supabase
        .from('integrations')
        .upsert(
          {
            provider: def.provider,
            is_enabled: state?.is_enabled ?? false,
            config: cleanConfig,
          },
          { onConflict: 'provider' },
        );
      if (error) {
        toast.error(`Save failed: ${error.message}`);
        return;
      }
      await logAudit(supabase, {
        action: 'configure',
        targetType: 'integration',
        targetLabel: def.name,
        metadata: { provider: def.provider, fields: Object.keys(cleanConfig) },
      });
      toast.success(`${def.name} credentials saved`);
      onClose();
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  async function disconnect() {
    if (!def) return;
    if (!state) {
      onClose();
      return;
    }
    setSaving(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('integrations')
        .delete()
        .eq('provider', def.provider);
      if (error) {
        toast.error(`Disconnect failed: ${error.message}`);
        return;
      }
      await logAudit(supabase, {
        action: 'disconnect',
        targetType: 'integration',
        targetLabel: def.name,
        metadata: { provider: def.provider },
      });
      toast.success(`${def.name} disconnected`);
      onClose();
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={!!def} onOpenChange={(o) => !o && !saving && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div
              className="flex h-7 w-7 items-center justify-center rounded-md"
              style={{ backgroundColor: def.accent + '15', color: def.accent }}
            >
              {React.createElement(ICONS[def.icon], { className: 'h-4 w-4' })}
            </div>
            {def.name}
          </DialogTitle>
          <DialogDescription>{def.description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-3.5">
          {def.fields.map((f) => (
            <div key={f.key} className="space-y-1.5">
              <Label htmlFor={`int-${f.key}`}>{f.label}</Label>
              <div className="relative">
                {f.multiline ? (
                  <Textarea
                    id={`int-${f.key}`}
                    rows={3}
                    placeholder={f.placeholder}
                    value={values[f.key] ?? ''}
                    onChange={(e) =>
                      setValues((v) => ({ ...v, [f.key]: e.target.value }))
                    }
                    className="font-mono text-[12.5px]"
                  />
                ) : (
                  <Input
                    id={`int-${f.key}`}
                    type={f.secret && !shown[f.key] ? 'password' : 'text'}
                    placeholder={f.placeholder}
                    value={values[f.key] ?? ''}
                    onChange={(e) =>
                      setValues((v) => ({ ...v, [f.key]: e.target.value }))
                    }
                    className={cn(f.secret && 'pr-10 font-mono')}
                    autoComplete="off"
                    spellCheck={false}
                  />
                )}
                {f.secret && !f.multiline && (
                  <button
                    type="button"
                    onClick={() => setShown((s) => ({ ...s, [f.key]: !s[f.key] }))}
                    className="absolute right-2.5 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:bg-warm-100 hover:text-foreground"
                    aria-label={shown[f.key] ? 'Hide' : 'Show'}
                  >
                    {shown[f.key] ? (
                      <EyeOff className="h-3.5 w-3.5" />
                    ) : (
                      <Eye className="h-3.5 w-3.5" />
                    )}
                  </button>
                )}
              </div>
              {f.description && (
                <p className="text-[11.5px] text-muted-foreground">
                  {f.description}
                </p>
              )}
            </div>
          ))}

          <a
            href={def.docsUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-[12px] font-semibold text-primary hover:underline"
          >
            How to get these credentials <ExternalLink className="h-3 w-3" />
          </a>
        </div>

        <DialogFooter>
          {state && (
            <Button
              type="button"
              variant="outline"
              onClick={disconnect}
              disabled={saving}
              className="mr-auto text-destructive hover:bg-destructive/10"
            >
              Disconnect
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button type="button" onClick={save} disabled={saving} className="gap-1.5">
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Saving…
              </>
            ) : (
              <>
                <Save className="h-4 w-4" /> Save credentials
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
