"use client";

import React, { useEffect, useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Flag } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

const statusStyles: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-200',
  under_review: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-200',
  escalated: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-200',
  resolved: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-200',
  dismissed: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
};

const MyReports = () => {
  const { currentUser } = useApp();
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadReports = async () => {
      if (!currentUser?.id) return;
      setLoading(true);
      const { data, error } = await supabase
        .from('reports')
        .select('id, content_type, reason, status, created_at, updated_at, resolution_reason, action_taken')
        .eq('reporter_id', currentUser.id)
        .order('created_at', { ascending: false });
      if (error) toast.error(error.message || 'Unable to load your reports.');
      setReports(data || []);
      setLoading(false);
    };
    loadReports();
  }, [currentUser?.id]);

  return (
    <AppLayout title="My Reports" showBack>
      <div className="mx-auto max-w-3xl space-y-6 px-4 py-8 sm:px-6">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-primary">Community safety</p>
          <h1 className="mt-2 text-3xl font-black">Your reports</h1>
          <p className="mt-2 text-muted-foreground">Track the review status of content you have reported.</p>
        </div>
        <Card className="border-border shadow-sm">
          <CardHeader><CardTitle className="flex items-center gap-2"><Flag size={19} /> Report history</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {loading ? <div className="flex justify-center py-12"><Loader2 className="animate-spin text-primary" /></div> : reports.length === 0 ? <p className="rounded-2xl bg-muted/50 p-8 text-center text-sm text-muted-foreground">You have not submitted any reports.</p> : reports.map((report) => (
              <div key={report.id} className="rounded-2xl border border-border p-4">
                <div className="flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-2"><Badge variant="outline" className="capitalize">{report.content_type}</Badge><span className="font-semibold capitalize">{report.reason}</span></div><Badge className={`${statusStyles[report.status] || ''} border-0 capitalize`}>{report.status.replace(/_/g, ' ')}</Badge></div>
                <p className="mt-2 text-xs text-muted-foreground">Submitted {new Date(report.created_at).toLocaleString()}</p>
                {report.resolution_reason && <p className="mt-3 text-sm text-foreground/80">Decision: {report.resolution_reason}</p>}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default MyReports;
