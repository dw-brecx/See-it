'use client';

import * as React from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Lock,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  Store,
  Wand2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/EmptyState';
import { Skeleton } from '@/components/ui/skeleton';
import {
  HealthScoreCard,
  type HealthBreakdownItem,
} from '@/components/HealthScoreCard';
import {
  AIRecommendationCard,
  type RecCategory,
  type RecSeverity,
} from '@/components/AIRecommendationCard';
import { ALL_LOCATIONS, useBrand } from '@/components/BrandContext';
import { createClient } from '@/lib/supabase/client';
import { WEEKDAYS, type DayHours, type WeekdayKey } from '@/lib/constants';
import { toast } from 'sonner';

type Brand = {
  id: string;
  logo_url: string | null;
  tagline: string | null;
  cover_photo_url: string | null;
  story: string | null;
  storefront_published: boolean | null;
};

type Location = {
  id: string;
  name: string;
  phone: string | null;
  hours: Record<string, unknown> | null;
  cover_photo_url: string | null;
  dietary_tags: string[] | null;
};

type Recommendation = {
  id: string;
  severity: RecSeverity;
  category: RecCategory;
  title: string;
  description: string;
  fixHref: string;
  fixLabel?: string;
  aiGenerated?: boolean;
};

type ReviewThemes = {
  positive: string[];
  negative: string[];
  summary: string;
};

function hasHours(hours: Record<string, unknown> | null): boolean {
  if (!hours) return false;
  // hours filled if at least one day is open with open/close set
  for (const wd of WEEKDAYS) {
    const d = (hours as Record<string, DayHours>)[wd.key];
    if (d && !d.is_closed && (d.open || d.open_note)) return true;
  }
  return false;
}

function closedDays(hours: Record<string, unknown> | null): WeekdayKey[] {
  if (!hours) return WEEKDAYS.map((w) => w.key);
  const out: WeekdayKey[] = [];
  for (const wd of WEEKDAYS) {
    const d = (hours as Record<string, DayHours>)[wd.key];
    if (!d || d.is_closed) out.push(wd.key);
  }
  return out;
}

function dayLabel(key: WeekdayKey): string {
  return WEEKDAYS.find((w) => w.key === key)?.label ?? key;
}

export function RecommendationsList() {
  const { currentBrand, currentBrandId, currentLocationId, brandLocations } = useBrand();
  const [loading, setLoading] = React.useState(true);
  const [brand, setBrand] = React.useState<Brand | null>(null);
  const [locations, setLocations] = React.useState<Location[]>([]);
  const [menuMissingPhotos, setMenuMissingPhotos] = React.useState(0);
  const [menuMissingDescriptions, setMenuMissingDescriptions] = React.useState(0);
  const [menuTotal, setMenuTotal] = React.useState(0);
  const [menuWithPhotos, setMenuWithPhotos] = React.useState(0);
  const [menuWithDescriptions, setMenuWithDescriptions] = React.useState(0);
  const [unrepliedCount, setUnrepliedCount] = React.useState(0);
  const [recentReviewCount, setRecentReviewCount] = React.useState(0);
  const [repliedRecentCount, setRepliedRecentCount] = React.useState(0);
  const [avgRating, setAvgRating] = React.useState<number | null>(null);
  const [reviewsTotal, setReviewsTotal] = React.useState(0);
  const [kosherCerts, setKosherCerts] = React.useState<
    { location_id: string; agency: string }[]
  >([]);
  const [reviewSnippets, setReviewSnippets] = React.useState<string[]>([]);

  // AI state
  const [aiRecs, setAiRecs] = React.useState<Recommendation[]>([]);
  const [aiLoading, setAiLoading] = React.useState(false);
  const [aiAvailable, setAiAvailable] = React.useState<boolean | null>(null);
  const [themesLoading, setThemesLoading] = React.useState(false);
  const [themes, setThemes] = React.useState<ReviewThemes | null>(null);
  const [themesAvailable, setThemesAvailable] = React.useState<boolean | null>(null);

  const scopedLocationIds = React.useMemo(() => {
    if (!currentBrandId) return [];
    if (currentLocationId === ALL_LOCATIONS) {
      return brandLocations.map((l) => l.id);
    }
    return [currentLocationId];
  }, [currentBrandId, currentLocationId, brandLocations]);

  React.useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!currentBrandId) {
        if (!cancelled) {
          setLoading(false);
          setBrand(null);
        }
        return;
      }
      setLoading(true);
      setAiRecs([]);
      setThemes(null);

      const supabase = createClient();

      // Brand
      const { data: b } = await supabase
        .from('brands')
        .select(
          'id, logo_url, tagline, cover_photo_url, story, storefront_published',
        )
        .eq('id', currentBrandId)
        .maybeSingle();

      // Locations (scoped)
      const scopedIds =
        currentLocationId === ALL_LOCATIONS
          ? brandLocations.map((l) => l.id)
          : [currentLocationId as string];
      let locs: Location[] = [];
      if (scopedIds.length > 0) {
        const { data } = await supabase
          .from('locations')
          .select('id, name, phone, hours, cover_photo_url, dietary_tags')
          .in('id', scopedIds);
        locs = (data ?? []) as Location[];
      }

      const locIds = locs.map((l) => l.id);

      // Menu items + photos
      let menuItems: {
        id: string;
        description: string | null;
        menu_item_photos: { id: string }[] | null;
      }[] = [];
      if (locIds.length > 0) {
        const { data } = await supabase
          .from('menu_items')
          .select('id, description, menu_item_photos(id)')
          .in('location_id', locIds);
        menuItems = (data ?? []) as any[];
      }
      const missingPhotos = menuItems.filter(
        (m) => !m.menu_item_photos || m.menu_item_photos.length === 0,
      ).length;
      const missingDescs = menuItems.filter(
        (m) => !m.description || m.description.trim().length < 12,
      ).length;
      const withPhotos = menuItems.length - missingPhotos;
      const withDescs = menuItems.length - missingDescs;

      // Reviews aggregates
      let reviewsCount = 0;
      let avg: number | null = null;
      let recentRepliedCount = 0;
      let recentCount = 0;
      let unreplied = 0;
      let snippets: string[] = [];
      if (locIds.length > 0) {
        const ninetyDaysAgo = new Date(
          Date.now() - 90 * 24 * 60 * 60 * 1000,
        ).toISOString();
        const [countRes, ratingRes, recentRes] = await Promise.all([
          supabase
            .from('reviews')
            .select('id', { count: 'exact', head: true })
            .in('location_id', locIds),
          supabase
            .from('reviews')
            .select('rating')
            .in('location_id', locIds),
          supabase
            .from('reviews')
            .select('id, text, review_replies(id)')
            .in('location_id', locIds)
            .gte('created_at', ninetyDaysAgo)
            .order('created_at', { ascending: false })
            .limit(60),
        ]);
        reviewsCount = countRes.count ?? 0;
        const rated = (ratingRes.data ?? []) as { rating: number }[];
        if (rated.length > 0) {
          avg = rated.reduce((s, r) => s + Number(r.rating), 0) / rated.length;
        }
        const recent = (recentRes.data ?? []) as unknown as {
          text: string | null;
          review_replies: { id: string }[] | null;
        }[];
        recentCount = recent.length;
        recentRepliedCount = recent.filter(
          (r) => (r.review_replies?.length ?? 0) > 0,
        ).length;
        // Unreplied: across the entire scope (not just last 90d), keep simple — count all unreplied
        const { data: unrep } = await supabase
          .from('reviews')
          .select('id, review_replies(id)')
          .in('location_id', locIds);
        const allRows = (unrep ?? []) as unknown as {
          review_replies: { id: string }[] | null;
        }[];
        unreplied = allRows.filter(
          (r) => (r.review_replies?.length ?? 0) === 0,
        ).length;
        snippets = recent
          .map((r) => r.text)
          .filter((t): t is string => !!t && t.trim().length > 0)
          .slice(0, 20);
      }

      // Kosher certifications
      let kosher: { location_id: string; agency: string }[] = [];
      if (locIds.length > 0) {
        const { data } = await supabase
          .from('kosher_certifications')
          .select('location_id, agency')
          .in('location_id', locIds);
        kosher = (data ?? []) as any[];
      }

      if (!cancelled) {
        setBrand(b as Brand);
        setLocations(locs);
        setMenuTotal(menuItems.length);
        setMenuMissingPhotos(missingPhotos);
        setMenuMissingDescriptions(missingDescs);
        setMenuWithPhotos(withPhotos);
        setMenuWithDescriptions(withDescs);
        setUnrepliedCount(unreplied);
        setRecentReviewCount(recentCount);
        setRepliedRecentCount(recentRepliedCount);
        setAvgRating(avg);
        setReviewsTotal(reviewsCount);
        setKosherCerts(kosher);
        setReviewSnippets(snippets);
        setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [currentBrandId, currentLocationId, brandLocations]);

  // ──────────────────────────────────────────────────────────────────
  // Health score breakdown
  // ──────────────────────────────────────────────────────────────────
  const { score, breakdown } = React.useMemo<{
    score: number;
    breakdown: HealthBreakdownItem[];
  }>(() => {
    if (!brand) return { score: 0, breakdown: [] };
    const items: HealthBreakdownItem[] = [];
    const allLocs = locations;

    // 1. Has logo (+10)
    items.push({
      label: 'Brand logo uploaded',
      max: 10,
      points: brand.logo_url ? 10 : 0,
      met: !!brand.logo_url,
    });
    // 2. Has cover photo on brand (+5)
    items.push({
      label: 'Brand cover photo',
      max: 5,
      points: brand.cover_photo_url ? 5 : 0,
      met: !!brand.cover_photo_url,
    });
    // 3. Has tagline (+5)
    items.push({
      label: 'Tagline written',
      max: 5,
      points: brand.tagline && brand.tagline.trim().length > 0 ? 5 : 0,
      met: !!(brand.tagline && brand.tagline.trim().length > 0),
    });
    // 4. Has story (+5)
    items.push({
      label: 'Story written',
      max: 5,
      points: brand.story && brand.story.trim().length > 0 ? 5 : 0,
      met: !!(brand.story && brand.story.trim().length > 0),
    });
    // 5. All locations have cover photos (+10)
    const locsWithCover = allLocs.filter((l) => !!l.cover_photo_url).length;
    items.push({
      label: 'All locations have cover photos',
      max: 10,
      points:
        allLocs.length === 0
          ? 0
          : locsWithCover === allLocs.length
            ? 10
            : 0,
      met: allLocs.length > 0 && locsWithCover === allLocs.length,
    });
    // 6. All locations have phone (+5)
    const locsWithPhone = allLocs.filter(
      (l) => !!l.phone && l.phone.trim().length > 0,
    ).length;
    items.push({
      label: 'All locations have phone numbers',
      max: 5,
      points:
        allLocs.length === 0
          ? 0
          : locsWithPhone === allLocs.length
            ? 5
            : 0,
      met: allLocs.length > 0 && locsWithPhone === allLocs.length,
    });
    // 7. All locations have hours filled (+10)
    const locsWithHours = allLocs.filter((l) => hasHours(l.hours)).length;
    items.push({
      label: 'All locations have hours set',
      max: 10,
      points:
        allLocs.length === 0
          ? 0
          : locsWithHours === allLocs.length
            ? 10
            : 0,
      met: allLocs.length > 0 && locsWithHours === allLocs.length,
    });
    // 8. Avg rating >= 4 (+10) or any reviews (+5)
    const ratingPoints =
      avgRating != null && avgRating >= 4.0
        ? 10
        : reviewsTotal > 0
          ? 5
          : 0;
    items.push({
      label: 'Strong customer ratings',
      max: 10,
      points: ratingPoints,
      met: ratingPoints >= 5,
    });
    // 9. % of menu items with description (10 pts * pct)
    const descPct =
      menuTotal === 0 ? 0 : menuWithDescriptions / menuTotal;
    items.push({
      label: 'Menu items have descriptions',
      max: 10,
      points: Math.round(descPct * 10),
      met: descPct >= 0.99,
    });
    // 10. % of menu items with photo (10 pts * pct)
    const photoPct = menuTotal === 0 ? 0 : menuWithPhotos / menuTotal;
    items.push({
      label: 'Menu items have photos',
      max: 10,
      points: Math.round(photoPct * 10),
      met: photoPct >= 0.99,
    });
    // 11. Kosher-tagged locations have an agency (+5)
    const kosherTagged = allLocs.filter(
      (l) => l.dietary_tags?.includes('Kosher'),
    );
    const kosherAgencyMap = new Map(
      kosherCerts.map((k) => [k.location_id, k.agency]),
    );
    const kosherOk =
      kosherTagged.length === 0
        ? true
        : kosherTagged.every((l) => !!kosherAgencyMap.get(l.id));
    items.push({
      label:
        kosherTagged.length === 0
          ? 'No kosher locations to certify'
          : 'Kosher locations have an agency',
      max: 5,
      points: kosherOk ? 5 : 0,
      met: kosherOk,
    });
    // 12. Replied to >= 80% recent reviews (+10)
    const replyPct =
      recentReviewCount === 0
        ? 1
        : repliedRecentCount / recentReviewCount;
    items.push({
      label: 'Replied to recent reviews',
      max: 10,
      points: replyPct >= 0.8 ? 10 : Math.round(replyPct * 10),
      met: replyPct >= 0.8,
    });
    // 13. Storefront published (+5)
    items.push({
      label: 'Storefront published',
      max: 5,
      points: brand.storefront_published ? 5 : 0,
      met: !!brand.storefront_published,
    });

    const total = items.reduce((s, i) => s + i.points, 0);
    return { score: Math.min(100, total), breakdown: items };
  }, [
    brand,
    locations,
    avgRating,
    reviewsTotal,
    menuTotal,
    menuWithDescriptions,
    menuWithPhotos,
    kosherCerts,
    recentReviewCount,
    repliedRecentCount,
  ]);

  // ──────────────────────────────────────────────────────────────────
  // Rule-based recommendations
  // ──────────────────────────────────────────────────────────────────
  const ruleRecs = React.useMemo<Recommendation[]>(() => {
    if (!brand) return [];
    const recs: Recommendation[] = [];

    if (menuMissingPhotos > 0) {
      recs.push({
        id: 'menu-photos',
        severity: menuMissingPhotos > 5 ? 'high' : 'medium',
        category: 'photos',
        title: `${menuMissingPhotos} menu item${menuMissingPhotos === 1 ? '' : 's'} missing photos`,
        description:
          'Items with photos get up to 3x more taps from diners. Add at least one photo per dish.',
        fixHref: '/dashboard/menu',
        fixLabel: 'Add photos',
      });
    }
    if (menuMissingDescriptions > 0) {
      recs.push({
        id: 'menu-descriptions',
        severity: menuMissingDescriptions > 5 ? 'medium' : 'low',
        category: 'menu',
        title: `${menuMissingDescriptions} menu item${menuMissingDescriptions === 1 ? '' : 's'} missing descriptions`,
        description:
          'A short description helps diners with allergies and dietary needs. Use the AI helper to draft them fast.',
        fixHref: '/dashboard/menu',
        fixLabel: 'Write descriptions',
      });
    }
    if (unrepliedCount > 0) {
      recs.push({
        id: 'unreplied-reviews',
        severity: unrepliedCount > 10 ? 'high' : 'medium',
        category: 'reviews',
        title: `${unrepliedCount} unreplied review${unrepliedCount === 1 ? '' : 's'}`,
        description:
          'Responding to reviews — especially negative ones — signals you care. Aim to reply within 48 hours.',
        fixHref: '/dashboard/reviews',
        fixLabel: 'Reply now',
      });
    }
    if (!brand.tagline || brand.tagline.trim().length === 0) {
      recs.push({
        id: 'add-tagline',
        severity: 'low',
        category: 'profile',
        title: 'Add a tagline',
        description:
          'A one-line hook tells diners what makes you special. Keep it under 60 characters.',
        fixHref: '/dashboard/settings/profile',
        fixLabel: 'Write tagline',
      });
    }
    if (!brand.story || brand.story.trim().length === 0) {
      recs.push({
        id: 'add-story',
        severity: 'low',
        category: 'profile',
        title: 'Tell your story',
        description:
          'Your origin, your craft, your people — diners read it. A couple of paragraphs is plenty.',
        fixHref: '/dashboard/settings/profile',
        fixLabel: 'Write story',
      });
    }
    if (!brand.logo_url) {
      recs.push({
        id: 'add-logo',
        severity: 'medium',
        category: 'profile',
        title: 'Upload your logo',
        description:
          'Your logo appears on your storefront and in search results. Add a square version (512x512 minimum).',
        fixHref: '/dashboard/settings/profile',
        fixLabel: 'Upload logo',
      });
    }

    // Per-location issues
    for (const l of locations) {
      const closed = closedDays(l.hours);
      // If every day is closed (or hours unset), flag it as one rec
      if (closed.length === WEEKDAYS.length) {
        recs.push({
          id: `hours-${l.id}`,
          severity: 'high',
          category: 'hours',
          title: `Hours not set for ${l.name}`,
          description:
            'Without hours, diners can\'t tell when you\'re open and you\'ll be filtered out of "open now" searches.',
          fixHref: '/dashboard/locations',
          fixLabel: 'Set hours',
        });
      } else if (closed.length >= 4) {
        // 4+ closed days is unusual — likely incomplete setup
        const dayNames = closed.map(dayLabel).slice(0, 3).join(', ');
        recs.push({
          id: `hours-light-${l.id}`,
          severity: 'low',
          category: 'hours',
          title: `${l.name} closed on ${closed.length} days`,
          description: `Marked closed on ${dayNames}${closed.length > 3 ? ', and more' : ''}. Make sure that's right.`,
          fixHref: '/dashboard/locations',
          fixLabel: 'Review hours',
        });
      }

      if (!l.cover_photo_url) {
        recs.push({
          id: `cover-${l.id}`,
          severity: 'medium',
          category: 'photos',
          title: `No cover photo on ${l.name}`,
          description:
            'The cover photo is the first thing diners see. Use a wide, well-lit shot of your space or signature dish.',
          fixHref: '/dashboard/locations',
          fixLabel: 'Add photo',
        });
      }

      // Kosher tag + no agency
      if (l.dietary_tags?.includes('Kosher')) {
        const cert = kosherCerts.find((k) => k.location_id === l.id);
        if (!cert || !cert.agency) {
          recs.push({
            id: `kosher-${l.id}`,
            severity: 'high',
            category: 'kosher',
            title: `${l.name} is tagged Kosher but missing certification`,
            description:
              'Diners filter by hechsher. Add the agency on your kosher certification so you appear in those searches.',
            fixHref: '/dashboard/locations',
            fixLabel: 'Add agency',
          });
        }
      }
    }

    // Severity order: high → medium → low
    const sevWeight = { high: 0, medium: 1, low: 2 };
    return recs.sort((a, b) => sevWeight[a.severity] - sevWeight[b.severity]);
  }, [
    brand,
    locations,
    menuMissingPhotos,
    menuMissingDescriptions,
    unrepliedCount,
    kosherCerts,
  ]);

  async function runDeepAnalysis() {
    if (!currentBrandId) return;
    setAiLoading(true);
    try {
      const res = await fetch('/api/ai/listing-health', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ brand_id: currentBrandId }),
      });
      if (res.status === 503) {
        setAiAvailable(false);
        toast.error('AI is not configured. Ask the platform team to enable it.');
        return;
      }
      if (!res.ok) {
        toast.error('Deep analysis failed. Try again in a moment.');
        return;
      }
      setAiAvailable(true);
      const payload = (await res.json()) as {
        recommendations?: {
          id?: string;
          severity?: RecSeverity;
          category?: RecCategory;
          title?: string;
          description?: string;
          fix_href?: string;
          fix_label?: string;
        }[];
      };
      const recs: Recommendation[] = (payload.recommendations ?? [])
        .filter((r) => r.title && r.description)
        .map((r, i) => ({
          id: r.id ?? `ai-${i}`,
          severity: (r.severity ?? 'medium') as RecSeverity,
          category: (r.category ?? 'profile') as RecCategory,
          title: r.title!,
          description: r.description!,
          fixHref: r.fix_href ?? '/dashboard',
          fixLabel: r.fix_label ?? 'Open',
          aiGenerated: true,
        }));
      setAiRecs(recs);
      if (recs.length === 0) {
        toast.success('Looks good — AI found nothing to flag.');
      } else {
        toast.success(`AI surfaced ${recs.length} recommendation${recs.length === 1 ? '' : 's'}.`);
      }
    } catch (e) {
      toast.error('Could not reach the AI service.');
    } finally {
      setAiLoading(false);
    }
  }

  async function analyzeReviews() {
    if (!currentBrandId || reviewSnippets.length === 0) return;
    setThemesLoading(true);
    try {
      const res = await fetch('/api/ai/review-themes', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ brand_id: currentBrandId, snippets: reviewSnippets }),
      });
      if (res.status === 503) {
        setThemesAvailable(false);
        toast.error('AI is not configured.');
        return;
      }
      if (!res.ok) {
        toast.error('Could not analyze reviews.');
        return;
      }
      setThemesAvailable(true);
      const payload = (await res.json()) as {
        themes?: ReviewThemes;
      };
      const t = payload.themes;
      if (t) {
        setThemes(t);
      } else {
        toast.error('No themes returned.');
      }
    } catch (e) {
      toast.error('Could not reach the AI service.');
    } finally {
      setThemesLoading(false);
    }
  }

  if (!currentBrand) {
    return (
      <Card>
        <CardContent className="p-0">
          <EmptyState
            icon={Store}
            title="Pick a store first"
            description="Choose a brand from the switcher above to see your AI assistant."
          />
        </CardContent>
      </Card>
    );
  }

  if (loading || !brand) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-[260px] w-full" />
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          <div className="space-y-3 lg:col-span-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-[96px] w-full" />
            ))}
          </div>
          <Skeleton className="h-[300px] w-full" />
        </div>
      </div>
    );
  }

  const combinedRecs = [...ruleRecs, ...aiRecs];

  return (
    <>
      <HealthScoreCard score={score} breakdown={breakdown} />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Main column — recommendations */}
        <div className="space-y-5 lg:col-span-2">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-terracotta-600" />
                    Recommendations
                  </CardTitle>
                  <p className="mt-1 text-[12.5px] text-muted-foreground">
                    Concrete steps to improve your listing — sorted by impact.
                  </p>
                </div>
                <Button
                  variant="default"
                  size="sm"
                  onClick={runDeepAnalysis}
                  disabled={aiLoading || aiAvailable === false}
                  className="gap-1.5"
                  title={
                    aiAvailable === false
                      ? 'Connect Anthropic in Settings → Integrations'
                      : undefined
                  }
                >
                  {aiLoading ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Analyzing…
                    </>
                  ) : (
                    <>
                      <Wand2 className="h-3.5 w-3.5" />
                      Run deep analysis
                    </>
                  )}
                </Button>
              </div>
              {aiAvailable === false && (
                <p className="mt-2 inline-flex items-center gap-1.5 text-[11.5px] text-muted-foreground">
                  <Lock className="h-3 w-3" />
                  Connect Anthropic in Settings → Integrations to unlock AI
                  analysis.
                </p>
              )}
            </CardHeader>
            <CardContent className="space-y-3">
              {combinedRecs.length === 0 ? (
                <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-5 text-center">
                  <CheckCircle2 className="mx-auto h-6 w-6 text-emerald-600" />
                  <p className="mt-2 text-[14px] font-semibold text-emerald-900">
                    Nothing to fix right now
                  </p>
                  <p className="mt-1 text-[12.5px] text-emerald-800">
                    Your listing looks great. Run deep analysis to surface
                    smaller wins.
                  </p>
                </div>
              ) : (
                combinedRecs.map((r) => (
                  <AIRecommendationCard
                    key={r.id}
                    severity={r.severity}
                    category={r.category}
                    title={r.title}
                    description={r.description}
                    fixHref={r.fixHref}
                    fixLabel={r.fixLabel}
                    aiGenerated={r.aiGenerated}
                  />
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar — review themes */}
        <div className="space-y-5">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-terracotta-600" />
                Trends in your reviews
              </CardTitle>
              <p className="mt-1 text-[12.5px] text-muted-foreground">
                AI-grouped themes from your recent reviews.
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              {themesAvailable === false ? (
                <div className="rounded-xl border border-dashed border-warm-200 bg-warm-25 p-4 text-center">
                  <ShieldCheck className="mx-auto h-6 w-6 text-warm-500" />
                  <p className="mt-2 text-[13px] font-semibold">
                    Connect AI to unlock
                  </p>
                  <p className="mt-1 text-[12px] text-muted-foreground">
                    Once Anthropic is configured, you'll see grouped themes
                    here.
                  </p>
                </div>
              ) : reviewSnippets.length === 0 ? (
                <p className="text-[12.5px] text-muted-foreground">
                  No recent reviews yet. Once you have a few, run an analysis to
                  see what diners are talking about.
                </p>
              ) : !themes ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full gap-1.5"
                  onClick={analyzeReviews}
                  disabled={themesLoading}
                >
                  {themesLoading ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Analyzing…
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-3.5 w-3.5" />
                      Analyze reviews
                    </>
                  )}
                </Button>
              ) : (
                <div className="space-y-4">
                  {themes.summary && (
                    <p className="text-[12.5px] leading-relaxed text-foreground">
                      {themes.summary}
                    </p>
                  )}
                  {themes.positive.length > 0 && (
                    <div>
                      <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-emerald-700">
                        What diners love
                      </p>
                      <ul className="space-y-1.5">
                        {themes.positive.map((t, i) => (
                          <li
                            key={`pos-${i}`}
                            className="flex items-start gap-2 text-[12.5px]"
                          >
                            <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
                            <span>{t}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {themes.negative.length > 0 && (
                    <div>
                      <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-amber-700">
                        Could be better
                      </p>
                      <ul className="space-y-1.5">
                        {themes.negative.map((t, i) => (
                          <li
                            key={`neg-${i}`}
                            className="flex items-start gap-2 text-[12.5px]"
                          >
                            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600" />
                            <span>{t}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full gap-1.5"
                    onClick={analyzeReviews}
                    disabled={themesLoading}
                  >
                    {themesLoading ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        Re-analyzing…
                      </>
                    ) : (
                      'Refresh analysis'
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
