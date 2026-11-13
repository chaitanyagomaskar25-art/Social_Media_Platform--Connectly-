import React, { useEffect, useState } from 'react';
import { BarChart3, Heart, MessageCircle, TrendingUp } from 'lucide-react';
import { analyticsService } from '../services/analyticsService';
import { useToast } from '../context/ToastContext';

export default function AnalyticsPage() {
  const { showError } = useToast();
  const [analytics, setAnalytics] = useState(null);
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    analyticsService.getCreatorAnalytics(days)
      .then((result) => { if (active) setAnalytics(result); })
      .catch((error) => showError(error.message || 'Could not load creator analytics.'))
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [days, showError]);

  if (loading) return <div className="rounded-2xl border border-border-subtle bg-surface p-8 text-center text-sm text-txt-secondary">Loading analytics…</div>;
  if (!analytics) return <div className="rounded-2xl border border-border-subtle bg-surface p-8 text-center text-sm text-txt-secondary">Analytics are not available right now.</div>;
  const maxComments = Math.max(1, ...analytics.daily.map((day) => day.comments || 0));

  return (
    <div className="space-y-5">
      <header className="flex items-center justify-between rounded-2xl border border-border-subtle bg-surface p-5 shadow-editorial-sm">
        <div>
          <h1 className="text-xl font-bold font-serif tracking-tight text-txt-primary">Creator insights</h1>
          <p className="mt-1 text-sm text-txt-secondary">Private analytics for your account.</p>
        </div>
        <select
          value={days}
          onChange={(event) => setDays(Number(event.target.value))}
          className="rounded-xl border border-border-subtle bg-surface-elevated px-3 py-2 text-sm text-txt-primary outline-none focus:border-accent"
        >
          <option value={7}>7 days</option>
          <option value={30}>30 days</option>
          <option value={90}>90 days</option>
        </select>
      </header>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Posts', value: analytics.summary.totalPosts, icon: BarChart3 },
          { label: 'Likes', value: analytics.summary.totalLikes, icon: Heart },
          { label: 'Comments', value: analytics.summary.totalComments, icon: MessageCircle },
          { label: 'Engagement', value: analytics.summary.totalEngagement, icon: TrendingUp },
        ].map((metric) => (
          <div key={metric.label} className="rounded-2xl border border-border-subtle bg-surface p-4 shadow-editorial-sm">
            <metric.icon className="h-4 w-4 text-accent" />
            <p className="mt-3 text-2xl font-bold font-serif text-txt-primary">{metric.value}</p>
            <p className="text-xs text-txt-muted">{metric.label}</p>
          </div>
        ))}
      </div>
      <section className="rounded-2xl border border-border-subtle bg-surface p-5 shadow-editorial-sm">
        <h2 className="font-serif font-semibold text-txt-primary">Comments per day</h2>
        <p className="mt-1 text-xs text-txt-muted">Historical like-by-day data is unavailable because likes do not have timestamps.</p>
        <div className="mt-5 flex h-48 items-end gap-1 overflow-x-auto border-b border-border-subtle pb-1">
          {analytics.daily.map((day) => (
            <div key={day.date} title={`${day.date}: ${day.comments} comments`} className="flex h-full min-w-2 flex-1 flex-col justify-end">
              <div className="rounded-t bg-accent transition-all hover:opacity-80" style={{ height: `${Math.max(4, (day.comments / maxComments) * 100)}%` }} />
            </div>
          ))}
        </div>
      </section>
      <section className="rounded-2xl border border-border-subtle bg-surface p-5 shadow-editorial-sm">
        <h2 className="mb-3 font-serif font-semibold text-txt-primary">Most engaging posts</h2>
        {analytics.topPosts.length ? (
          analytics.topPosts.map((post) => (
            <div key={post.postId} className="flex items-center justify-between gap-3 border-t border-border-subtle py-3">
              <p className="line-clamp-2 text-sm text-txt-secondary">{post.caption || 'Media post'}</p>
              <p className="shrink-0 text-xs font-mono text-txt-muted">{post.likes} likes · {post.comments} comments</p>
            </div>
          ))
        ) : (
          <p className="text-sm text-txt-muted">Create posts to see engagement insights.</p>
        )}
      </section>
      <section className="rounded-2xl border border-border-subtle bg-surface p-5 shadow-editorial-sm">
        <h2 className="font-serif font-semibold text-txt-primary">Follower growth</h2>
        <p className="mt-1 text-xs text-txt-muted">{analytics.followerGrowth.reason}</p>
        <p className="mt-3 text-2xl font-bold font-serif text-txt-primary">
          {analytics.followerGrowth.currentFollowers} <span className="text-sm font-normal text-txt-secondary">current followers</span>
        </p>
        {analytics.followerGrowth.series.length > 0 && (
          <div className="mt-3 space-y-1">
            {analytics.followerGrowth.series.map((point, index) => (
              <p key={`${point.date}-${index}`} className="text-xs text-txt-secondary">
                {point.date}: {point.count} followers
              </p>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
