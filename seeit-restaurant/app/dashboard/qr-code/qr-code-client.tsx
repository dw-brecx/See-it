'use client';

import * as React from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { Copy, Download, Printer, Check } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type Brand = {
  id: string;
  name: string;
  logo_url: string | null;
  tagline: string | null;
};
type Location = { id: string; name: string; address: string };

type Target =
  | { kind: 'brand'; id: string; label: string; addressLine: string | null }
  | { kind: 'location'; id: string; label: string; addressLine: string | null };

function targetUrl(t: Target): { deep: string; web: string } {
  if (t.kind === 'brand') {
    return {
      deep: `seeit://storefront/${t.id}`,
      web: `https://seeit.app/s/${t.id}`,
    };
  }
  return {
    deep: `seeit://location/${t.id}`,
    web: `https://seeit.app/l/${t.id}`,
  };
}

export function QrCodeClient({
  brand,
  locations,
}: {
  brand: Brand;
  locations: Location[];
}) {
  const targets: Target[] = React.useMemo(() => {
    const list: Target[] = [
      { kind: 'brand', id: brand.id, label: `${brand.name} — all locations`, addressLine: null },
    ];
    for (const l of locations) {
      list.push({
        kind: 'location',
        id: l.id,
        label: `${l.name}`,
        addressLine: l.address,
      });
    }
    return list;
  }, [brand, locations]);

  const [selectedId, setSelectedId] = React.useState<string>(targets[0].id);
  const selected = targets.find((t) => t.id === selectedId) ?? targets[0];
  const { deep, web } = targetUrl(selected);

  // We encode the deep link in the QR — Expo Router handles the seeit://
  // scheme. The web URL is the fallback for users without the app
  // installed; it lives as a short-code redirect on the marketing site.
  const qrValue = deep;

  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const [copied, setCopied] = React.useState(false);

  function downloadPng(scale: number) {
    const node = canvasRef.current;
    if (!node) return;
    const offscreen = document.createElement('canvas');
    offscreen.width = node.width * scale;
    offscreen.height = node.height * scale;
    const ctx = offscreen.getContext('2d');
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(node, 0, 0, offscreen.width, offscreen.height);
    const dataUrl = offscreen.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `${brand.name.replace(/\s+/g, '-').toLowerCase()}-${selected.kind}-qr.png`;
    a.click();
    toast.success('Downloaded');
  }

  function copyLink() {
    void navigator.clipboard.writeText(web).then(() => {
      setCopied(true);
      toast.success('Link copied');
      setTimeout(() => setCopied(false), 1800);
    });
  }

  function printTableTent() {
    const tagline = brand.tagline || 'Scan to see real photos & reviews';
    const win = window.open('', '_blank', 'width=720,height=900');
    if (!win) return;
    const node = canvasRef.current;
    if (!node) return;
    const qrPng = node.toDataURL('image/png');
    win.document.write(`
      <html>
        <head>
          <title>${brand.name} — SeeIt table tent</title>
          <meta name="viewport" content="width=device-width,initial-scale=1" />
          <style>
            *{box-sizing:border-box;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif}
            html,body{margin:0;background:#FAFAF7}
            .tent{width:5in;margin:0.5in auto;padding:0.5in;border-radius:24px;background:white;box-shadow:0 8px 40px rgba(0,0,0,0.08);text-align:center;page-break-inside:avoid}
            .band{margin:-0.5in -0.5in 0.4in -0.5in;background:#E85D3A;color:white;padding:18px;border-radius:24px 24px 0 0}
            .band .name{font-size:24px;font-weight:800;letter-spacing:-0.3px}
            .qr{margin:24px auto;display:inline-block;padding:18px;background:white;border-radius:18px}
            .tag{font-size:14px;color:#64748B;margin-top:6px}
            .cta{font-size:18px;font-weight:700;color:#1A1A1A;margin-top:24px}
            .small{font-size:11px;color:#9CA3AF;margin-top:18px;letter-spacing:1px;text-transform:uppercase}
            @media print {body{background:white}.tent{box-shadow:none}}
          </style>
        </head>
        <body onload="setTimeout(()=>{window.print();},250)">
          <div class="tent">
            <div class="band">
              <div class="name">${brand.name}</div>
              <div style="font-size:12px;opacity:0.85;margin-top:4px;letter-spacing:1px">${tagline}</div>
            </div>
            <div class="cta">Scan to see real photos &amp; reviews</div>
            <div class="qr"><img src="${qrPng}" width="280" height="280" alt="QR" /></div>
            ${selected.addressLine ? `<div class="tag">${selected.addressLine}</div>` : ''}
            <div class="small">Powered by SeeIt</div>
          </div>
        </body>
      </html>
    `);
    win.document.close();
  }

  return (
    <div className="mx-auto grid max-w-3xl gap-6 sm:grid-cols-[1fr_280px]">
      <Card>
        <CardContent className="space-y-6 p-6 sm:p-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              QR code for
            </p>
            <div className="mt-2 max-w-md">
              <Select value={selectedId} onValueChange={setSelectedId}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {targets.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-col items-center gap-3 rounded-2xl bg-warm-50 p-6 sm:p-8">
            <QRCodeCanvas
              ref={canvasRef as any}
              value={qrValue}
              size={300}
              level="M"
              includeMargin
              imageSettings={
                brand.logo_url
                  ? {
                      src: brand.logo_url,
                      height: 48,
                      width: 48,
                      excavate: true,
                    }
                  : undefined
              }
            />
            <p className="mt-2 text-center text-sm font-semibold text-foreground">
              {selected.label}
            </p>
            {selected.addressLine && (
              <p className="text-xs text-muted-foreground">{selected.addressLine}</p>
            )}
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <Button onClick={() => downloadPng(2)} className="gap-2">
              <Download className="h-4 w-4" /> Download (1024×1024)
            </Button>
            <Button onClick={printTableTent} variant="outline" className="gap-2">
              <Printer className="h-4 w-4" /> Print table tent
            </Button>
            <Button onClick={copyLink} variant="outline" className="gap-2 sm:col-span-2">
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? 'Copied!' : 'Copy web link'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-3 p-5">
          <p className="text-sm font-semibold text-foreground">How to use it</p>
          <p className="text-xs leading-relaxed text-muted-foreground">
            Print this and place it at your tables, takeout counter, or
            storefront window. Customers scan to see real photos and reviews of
            your menu inside the SeeIt app — no app required at the QR step,
            we redirect through the web fallback.
          </p>
          <div className="mt-3 rounded-md bg-warm-50 p-3">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Deep link
            </p>
            <p className="mt-1 break-all font-mono text-[11px] text-foreground">
              {deep}
            </p>
            <p className="mt-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Web fallback
            </p>
            <p className="mt-1 break-all font-mono text-[11px] text-foreground">
              {web}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
