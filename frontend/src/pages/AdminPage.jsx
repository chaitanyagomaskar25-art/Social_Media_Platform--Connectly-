import React, { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, Check, Clock3, ShieldCheck, X } from 'lucide-react';
import { userService } from '../services/userService';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const STATUSES = ['open', 'reviewed', 'actioned', 'dismissed'];

export default function AdminPage() {
  const { user } = useAuth();
  const { showError, showSuccess } = useToast();
  const [reports, setReports] = useState([]);
  const [status, setStatus] = useState('open');
  const [loading, setLoading] = useState(true);

  const loadReports = useCallback(async () => {
    setLoading(true);
    try {
      const response = await userService.listReports({ status });
      setReports(response.reports || []);
    } catch (error) {
      showError(error.message || 'Could not load reports.');
    } finally {
      setLoading(false);
    }
  }, [status, showError]);

  useEffect(() => { loadReports(); }, [loadReports]);

  const updateReport = async (reportId, newStatus) => {
    try {
      const response = await userService.updateReport(reportId, { status: newStatus });
      setReports((current) => current.map((report) =>
        report._id === reportId ? response.report : report
      ));
      showSuccess(`Report marked ${newStatus}.`);
    } catch (error) {
      showError(error.message || 'Could not update report.');
    }
  };

  if (user?.role !== 'admin') {
    return (
      <section className="rounded-2xl border border-border-subtle bg-surface p-8 text-center shadow-editorial-sm">
        <ShieldCheck className="mx-auto h-8 w-8 text-txt-muted" />
        <h1 className="mt-3 font-serif font-semibold text-txt-primary">Admin access required</h1>
        <p className="mt-1 text-sm text-txt-secondary">This dashboard is only available to administrators.</p>
      </section>
    );
  }

  return (
    <div className="space-y-5">
      <header className="flex items-center justify-between rounded-2xl border border-border-subtle bg-surface p-5 shadow-editorial-sm">
        <div>
          <h1 className="text-xl font-bold font-serif tracking-tight text-txt-primary">Moderation reports</h1>
          <p className="mt-1 text-sm text-txt-secondary">Review reports submitted by the community.</p>
        </div>
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          className="rounded-xl border border-border-subtle bg-surface-elevated px-3 py-2 text-sm text-txt-primary outline-none focus:border-accent"
        >
          {STATUSES.map((entry) => (
            <option key={entry} value={entry}>{entry[0].toUpperCase() + entry.slice(1)}</option>
          ))}
        </select>
      </header>
      {loading ? (
        <p className="rounded-2xl border border-border-subtle bg-surface p-6 text-center text-sm text-txt-secondary">Loading reports…</p>
      ) : reports.length ? (
        reports.map((report) => (
          <article key={report._id} className="space-y-3 rounded-2xl border border-border-subtle bg-surface p-5 shadow-editorial-sm">
            <div className="flex items-start justify-between gap-4">
              <div className="flex gap-3">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
                <div>
                  <p className="font-serif font-semibold capitalize text-txt-primary">{report.targetType} report</p>
                  <p className="text-xs text-txt-muted">Reported by @{report.reporter?.username || 'unknown'} · {new Date(report.createdAt).toLocaleString()}</p>
                </div>
              </div>
              <span className="rounded-full bg-surface-elevated border border-border-subtle px-2.5 py-1 text-xs capitalize text-txt-secondary">{report.status}</span>
            </div>
            <p className="rounded-xl bg-surface-elevated border border-border-subtle p-3 text-sm text-txt-primary">{report.reason}</p>
            <p className="break-all text-xs font-mono text-txt-muted">Target: {String(report.targetId)}</p>
            {report.adminNotes && <p className="text-xs text-txt-secondary">Admin notes: {report.adminNotes}</p>}
            <div className="flex flex-wrap gap-2 pt-1">
              {report.status !== 'reviewed' && (
                <button
                  type="button"
                  onClick={() => updateReport(report._id, 'reviewed')}
                  className="inline-flex items-center gap-1 rounded-xl border border-border-subtle bg-surface-elevated px-3 py-1.5 text-xs text-txt-secondary hover:text-txt-primary hover:border-border-strong transition-colors"
                >
                  <Clock3 className="h-3.5 w-3.5" /> Mark reviewed
                </button>
              )}
              {report.status !== 'actioned' && (
                <button
                  type="button"
                  onClick={() => updateReport(report._id, 'actioned')}
                  className="inline-flex items-center gap-1 rounded-xl bg-rose-600 px-3 py-1.5 text-xs text-white hover:bg-rose-700 transition-colors"
                >
                  <Check className="h-3.5 w-3.5" /> Action taken
                </button>
              )}
              {report.status !== 'dismissed' && (
                <button
                  type="button"
                  onClick={() => updateReport(report._id, 'dismissed')}
                  className="inline-flex items-center gap-1 rounded-xl border border-border-subtle bg-surface-elevated px-3 py-1.5 text-xs text-txt-secondary hover:text-txt-primary hover:border-border-strong transition-colors"
                >
                  <X className="h-3.5 w-3.5" /> Dismiss
                </button>
              )}
            </div>
          </article>
        ))
      ) : (
        <p className="rounded-2xl border border-border-subtle bg-surface p-6 text-center text-sm text-txt-secondary">No {status} reports.</p>
      )}
    </div>
  );
}
