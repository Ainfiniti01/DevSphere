"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, CheckCircle2, ChevronLeft, Crown, ExternalLink, Flag, Gavel, Loader2, Search, ShieldCheck, UserCog, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useApp } from '@/context/AppContext';
import type { AppRole } from '@/context/AppContext';
import LoadingScreen from '@/components/LoadingScreen';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

type ManagedUser = {
  id: string;
  email: string;
  name: string | null;
  title: string | null;
  role: AppRole;
  is_premium_override: boolean;
  account_status: 'active' | 'restricted' | 'suspended';
  restricted_until: string | null;
  restriction_reason: string | null;
  created_at: string | null;
  total_count: number;
};

type AdminReport = {
  id: string;
  content_type: 'project' | 'comment' | 'user' | 'message' | 'conversation' | 'group';
  reason: string;
  details: string | null;
  status: 'pending' | 'under_review' | 'escalated' | 'resolved' | 'dismissed';
  severity: 'low' | 'medium' | 'high' | 'critical';
  created_at: string;
  updated_at: string;
  reporter_id: string;
  reporter_name: string | null;
  reported_user_id: string | null;
  reported_user_name: string | null;
  reported_project_id: string | null;
  reported_project_title: string | null;
  reported_comment_id: string | null;
  reported_comment_content: string | null;
  assigned_to: string | null;
  assigned_name: string | null;
  resolution_reason: string | null;
  action_taken: string | null;
  reported_chat_id: string | null;
  reported_message_id: string | null;
  reported_message_content: string | null;
  reported_message_created_at: string | null;
  reported_chat_type: string | null;
  reported_group_id: string | null;
  reported_group_title: string | null;
  total_count: number;
};

type AuditLog = {
  id: string;
  actor_name: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  reason: string | null;
  created_at: string;
};

const roleLabels: Record<AppRole, string> = {
  member: 'Member',
  moderator: 'Moderator',
  admin: 'Admin',
  super_admin: 'Super Admin',
};

const roleStyles: Record<AppRole, string> = {
  member: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200',
  moderator: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-200',
  admin: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-200',
  super_admin: 'bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-200',
};

const statusStyles: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-200',
  under_review: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-200',
  escalated: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-200',
  resolved: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-200',
  dismissed: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
};

const formatStatus = (value: string) => value.replace(/_/g, ' ');

const Admin = () => {
  const navigate = useNavigate();
  const { currentUser, role, isAdmin, isModerator, isSuperAdmin } = useApp();
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [stats, setStats] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reportSearch, setReportSearch] = useState('');
  const [reportStatus, setReportStatus] = useState('all');
  const [reportSeverity, setReportSeverity] = useState('all');
  const [reportPage, setReportPage] = useState(1);
  const [userSearch, setUserSearch] = useState('');
  const [userRole, setUserRole] = useState('all');
  const [userStatus, setUserStatus] = useState('all');
  const [userPage, setUserPage] = useState(1);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [pendingRole, setPendingRole] = useState<{ user: ManagedUser; newRole: AppRole } | null>(null);
  const [roleReason, setRoleReason] = useState('');
  const [pendingAction, setPendingAction] = useState<{ report: AdminReport; action: string } | null>(null);
  const [actionReason, setActionReason] = useState('');
  const [restrictionUntil, setRestrictionUntil] = useState('');

  const loadDashboard = async () => {
    if (!currentUser || !isModerator) return;
    setLoading(true);
    setError(null);
    try {
      const reportRequest = supabase.rpc('admin_list_reports', {
        p_status: reportStatus === 'all' ? null : reportStatus,
        p_severity: reportSeverity === 'all' ? null : reportSeverity,
        p_search: reportSearch.trim() || null,
        p_page: reportPage,
        p_page_size: 25,
      });
      const statsRequest = supabase.rpc('admin_get_dashboard_stats');
      const userRequest = isAdmin
        ? supabase.rpc('admin_list_users', {
            p_search: userSearch.trim() || null,
            p_role: userRole === 'all' ? null : userRole,
            p_account_status: userStatus === 'all' ? null : userStatus,
            p_page: userPage,
            p_page_size: 25,
          })
        : Promise.resolve({ data: [], error: null });
      const auditRequest = isAdmin
        ? supabase.rpc('admin_list_audit_logs', { p_page: 1, p_page_size: 25 })
        : Promise.resolve({ data: [], error: null });

      const [reportResponse, statsResponse, userResponse, auditResponse] = await Promise.all([reportRequest, statsRequest, userRequest, auditRequest]);
      if (reportResponse.error) throw reportResponse.error;
      if (statsResponse.error) throw statsResponse.error;
      if (userResponse.error) throw userResponse.error;
      if (auditResponse.error) throw auditResponse.error;

      setReports((reportResponse.data || []) as AdminReport[]);
      setStats((statsResponse.data || {}) as Record<string, number>);
      setUsers((userResponse.data || []) as ManagedUser[]);
      setAuditLogs((auditResponse.data || []) as AuditLog[]);
    } catch (loadError: any) {
      setError(loadError.message || 'Unable to load the management workspace.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, [currentUser?.id, isAdmin, isModerator, reportSearch, reportStatus, reportSeverity, reportPage, userSearch, userRole, userStatus, userPage]);

  const roleCounts = useMemo(() => ({
    admins: users.filter((user) => user.role === 'admin' || user.role === 'super_admin').length,
    moderators: users.filter((user) => user.role === 'moderator').length,
  }), [users]);

  const openRoleConfirmation = (user: ManagedUser, newRole: AppRole) => {
    if (newRole === user.role) return;
    setPendingRole({ user, newRole });
    setRoleReason('');
  };

  const confirmRoleChange = async () => {
    if (!pendingRole || !roleReason.trim()) {
      toast.error('Add a reason for the role change.');
      return;
    }
    setUpdatingUserId(pendingRole.user.id);
    try {
      const { data, error: updateError } = await supabase.rpc('admin_update_user_role', {
        p_target_user_id: pendingRole.user.id,
        p_new_role: pendingRole.newRole,
        p_reason: roleReason.trim(),
      });
      if (updateError) throw updateError;
      const updated = data?.[0];
      setUsers((current) => current.map((user) => user.id === pendingRole.user.id ? { ...user, role: updated?.role || pendingRole.newRole } : user));
      toast.success(`Role updated to ${roleLabels[pendingRole.newRole]}.`);
      setPendingRole(null);
      await loadDashboard();
    } catch (updateError: any) {
      toast.error(updateError.message || 'Unable to update this role.');
    } finally {
      setUpdatingUserId(null);
    }
  };

  const openActionDialog = (report: AdminReport, action: string) => {
    setPendingAction({ report, action });
    setActionReason('');
    setRestrictionUntil('');
  };

  const confirmReportAction = async () => {
    if (!pendingAction || !actionReason.trim()) {
      toast.error('Add a reason for this moderation action.');
      return;
    }
    if (pendingAction.action === 'restrict' && !restrictionUntil) {
      toast.error('Choose when the restriction should expire.');
      return;
    }
    try {
      const { error: actionError } = await supabase.rpc('admin_take_report_action', {
        p_report_id: pendingAction.report.id,
        p_action: pendingAction.action,
        p_reason: actionReason.trim(),
        p_restriction_until: pendingAction.action === 'restrict' ? new Date(restrictionUntil).toISOString() : null,
      });
      if (actionError) throw actionError;
      toast.success(`Report ${formatStatus(pendingAction.action)} successfully.`);
      setPendingAction(null);
      await loadDashboard();
    } catch (actionError: any) {
      toast.error(actionError.message || 'Unable to apply this moderation action.');
    }
  };

  const assignToSelf = async (report: AdminReport) => {
    try {
      const { error: assignError } = await supabase.rpc('admin_assign_report', { p_report_id: report.id, p_assignee_id: currentUser?.id });
      if (assignError) throw assignError;
      toast.success('Report assigned to you.');
      await loadDashboard();
    } catch (assignError: any) {
      toast.error(assignError.message || 'Unable to assign this report.');
    }
  };

  const totalReports = reports[0]?.total_count || 0;
  const totalUsers = users[0]?.total_count || 0;
  const canGoBackReports = reportPage > 1;
  const canGoForwardReports = reportPage * 25 < totalReports;
  const canGoBackUsers = userPage > 1;
  const canGoForwardUsers = userPage * 25 < totalUsers;

  if (!currentUser || !isModerator) return <LoadingScreen />;

  return (
    <div className="min-h-screen bg-slate-50 p-4 text-slate-900 dark:bg-slate-950 dark:text-slate-100 sm:p-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="mb-2 text-xs font-black uppercase tracking-[0.2em] text-primary">DevSphere control center</p>
            <h1 className="text-3xl font-bold">{isAdmin ? 'Admin Dashboard' : 'Moderation Workspace'}</h1>
            <p className="mt-1 text-slate-500 dark:text-slate-400">Real-time platform operations, reports, and policy enforcement.</p>
          </div>
          <div className="flex items-center gap-3">
            <Badge className={`${roleStyles[role || 'member']} border-0 px-3 py-1.5`}>
              {isSuperAdmin && <Crown size={14} className="mr-1.5" />}
              {roleLabels[role || 'member']}
            </Badge>
            <Button variant="outline" onClick={() => navigate('/profile')} className="rounded-xl"><ChevronLeft size={16} className="mr-1" /> Profile</Button>
          </div>
        </header>

        {error && (
          <Card className="border-destructive/30 bg-destructive/5">
            <CardContent className="flex items-center justify-between gap-4 p-5 text-sm text-destructive">
              <span>{error}</span>
              <Button variant="outline" size="sm" onClick={loadDashboard} className="rounded-xl">Retry</Button>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[
            ['Total members', stats.total_members, Users],
            ['Active projects', stats.active_projects, ShieldCheck],
            ['Pending reports', stats.pending_reports, AlertCircle],
            ['Escalated cases', stats.escalated_reports, Gavel],
          ].map(([label, value, Icon]: any) => (
            <Card key={label} className="border-0 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md dark:bg-slate-900">
              <CardContent className="flex items-center gap-3 p-5">
                <div className="rounded-2xl bg-primary/10 p-3 text-primary"><Icon size={20} /></div>
                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold text-slate-500 dark:text-slate-400">{label}</p>
                  <p className="text-2xl font-black">{loading ? <span className="inline-block h-7 w-12 animate-pulse rounded bg-slate-200 dark:bg-slate-700" /> : value ?? 0}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="reports" className="space-y-6">
          <TabsList className="rounded-xl bg-white p-1 shadow-sm dark:bg-slate-900">
            <TabsTrigger value="reports" className="rounded-lg">Moderation queue</TabsTrigger>
            {isAdmin && <TabsTrigger value="users" className="rounded-lg">User management</TabsTrigger>}
            {isAdmin && <TabsTrigger value="audit" className="rounded-lg">Audit history</TabsTrigger>}
          </TabsList>

          <TabsContent value="reports" className="space-y-5">
            <Card className="border-0 shadow-sm dark:bg-slate-900">
              <CardHeader className="gap-4 border-b border-slate-100 dark:border-slate-800 sm:flex-row sm:items-end sm:justify-between">
                <div><CardTitle className="flex items-center gap-2"><Flag size={19} /> Moderation queue</CardTitle><p className="mt-1 text-sm text-slate-500">Review platform content, accounts, messages, and conversations reported by the community.</p></div>
                <div className="flex flex-wrap gap-2">
                  <div className="relative"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><Input value={reportSearch} onChange={(event) => { setReportPage(1); setReportSearch(event.target.value); }} placeholder="Search reports" className="w-48 rounded-xl pl-9" /></div>
                  <Select value={reportStatus} onValueChange={(value) => { setReportPage(1); setReportStatus(value); }}><SelectTrigger className="w-36 rounded-xl"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All statuses</SelectItem><SelectItem value="pending">Pending</SelectItem><SelectItem value="under_review">Under review</SelectItem><SelectItem value="escalated">Escalated</SelectItem><SelectItem value="resolved">Resolved</SelectItem><SelectItem value="dismissed">Dismissed</SelectItem></SelectContent></Select>
                  <Select value={reportSeverity} onValueChange={(value) => { setReportPage(1); setReportSeverity(value); }}><SelectTrigger className="w-32 rounded-xl"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All priority</SelectItem><SelectItem value="medium">Medium</SelectItem><SelectItem value="high">High</SelectItem><SelectItem value="critical">Critical</SelectItem></SelectContent></Select>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {loading ? <div className="space-y-3">{[1, 2, 3].map((item) => <div key={item} className="h-28 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800" />)}</div> : reports.length === 0 ? <div className="flex flex-col items-center gap-3 rounded-2xl bg-emerald-50 p-10 text-center text-emerald-700 dark:bg-emerald-950 dark:text-emerald-200"><CheckCircle2 size={28} /><p className="font-semibold">No reports match these filters.</p></div> : <div className="space-y-3">{reports.map((report) => (
                  <div key={report.id} className="rounded-2xl border border-slate-200 p-4 transition-colors hover:border-primary/40 dark:border-slate-800">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0 space-y-2">
                        <div className="flex flex-wrap items-center gap-2"><Badge className={`${statusStyles[report.status]} border-0 capitalize`}>{formatStatus(report.status)}</Badge><Badge variant="outline" className="capitalize">{report.severity}</Badge><span className="text-xs font-semibold uppercase tracking-wider text-slate-400">{report.content_type}</span></div>
                        <p className="font-bold">{report.reason}</p>
                        <p className="text-sm text-slate-500">Reported by {report.reporter_name || 'a developer'}{report.reported_user_name ? ` · About ${report.reported_user_name}` : ''}</p>
                        {report.reported_project_title && <a href={`/project/${report.reported_project_id}`} className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">{report.reported_project_title} <ExternalLink size={13} /></a>}
                        {report.reported_group_title && <a href={`/project/${report.reported_group_id}`} className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">Group: {report.reported_group_title} <ExternalLink size={13} /></a>}
                        {report.reported_comment_content && <p className="rounded-xl bg-slate-50 p-3 text-sm italic text-slate-600 dark:bg-slate-950 dark:text-slate-300">“{report.reported_comment_content}”</p>}
                        {report.reported_message_content && <p className="rounded-xl bg-slate-50 p-3 text-sm italic text-slate-600 dark:bg-slate-950 dark:text-slate-300">Message context: “{report.reported_message_content}”</p>}
                        {report.content_type === 'conversation' && <p className="rounded-xl bg-slate-50 p-3 text-sm text-slate-600 dark:bg-slate-950 dark:text-slate-300">Direct conversation report. Only the reported conversation target is available to authorized reviewers.</p>}
                        {report.details && <p className="text-sm text-slate-600 dark:text-slate-300">{report.details}</p>}
                        <p className="text-xs text-slate-400">{report.assigned_name ? `Assigned to ${report.assigned_name}` : 'Unassigned'} · {new Date(report.created_at).toLocaleString()}</p>
                      </div>
                      <div className="flex shrink-0 flex-wrap gap-2 lg:max-w-xs lg:justify-end">
                        {!report.assigned_to && report.status !== 'resolved' && report.status !== 'dismissed' && <Button size="sm" variant="outline" onClick={() => assignToSelf(report)} className="rounded-xl">Assign to me</Button>}
                        {report.status !== 'resolved' && report.status !== 'dismissed' && <>
                          {report.status === 'pending' && <Button size="sm" variant="outline" onClick={() => openActionDialog(report, 'under_review')} className="rounded-xl">Review</Button>}
                          <Button size="sm" variant="outline" onClick={() => openActionDialog(report, 'dismiss')} className="rounded-xl">Dismiss</Button>
                          {report.status !== 'escalated' && <Button size="sm" variant="outline" onClick={() => openActionDialog(report, 'escalate')} className="rounded-xl">Escalate</Button>}
                          {report.content_type !== 'conversation' && report.content_type !== 'user' && <Button size="sm" onClick={() => openActionDialog(report, 'remove_content')} className="rounded-xl">Remove content</Button>}
                          {isAdmin && <Button size="sm" variant="outline" onClick={() => openActionDialog(report, 'resolve')} className="rounded-xl">Resolve</Button>}
                          {isAdmin && report.reported_user_id && <Button size="sm" variant="outline" onClick={() => openActionDialog(report, 'warn')} className="rounded-xl">Warn user</Button>}
                          {isAdmin && report.reported_user_id && <Button size="sm" variant="outline" onClick={() => openActionDialog(report, 'restrict')} className="rounded-xl">Restrict account</Button>}
                        </>}
                        {isAdmin && report.action_taken === 'content_removed' && <Button size="sm" variant="outline" onClick={() => openActionDialog(report, 'restore_content')} className="rounded-xl">Restore content</Button>}
                      </div>
                    </div>
                  </div>
                ))}</div>}
                <div className="mt-5 flex items-center justify-between text-sm text-slate-500"><span>{totalReports} total reports</span><div className="flex gap-2"><Button variant="outline" size="sm" disabled={!canGoBackReports} onClick={() => setReportPage((page) => page - 1)} className="rounded-xl">Previous</Button><Button variant="outline" size="sm" disabled={!canGoForwardReports} onClick={() => setReportPage((page) => page + 1)} className="rounded-xl">Next</Button></div></div>
              </CardContent>
            </Card>
          </TabsContent>

          {isAdmin && <TabsContent value="users" className="space-y-5"><Card className="border-0 shadow-sm dark:bg-slate-900"><CardHeader className="gap-4 border-b border-slate-100 dark:border-slate-800 sm:flex-row sm:items-end sm:justify-between"><div><CardTitle className="flex items-center gap-2"><UserCog size={19} /> User management</CardTitle><p className="mt-1 text-sm text-slate-500">Role changes require Super Admin authorization and confirmation.</p></div><div className="flex flex-wrap gap-2"><div className="relative"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><Input value={userSearch} onChange={(event) => { setUserPage(1); setUserSearch(event.target.value); }} placeholder="Search users" className="w-48 rounded-xl pl-9" /></div><Select value={userRole} onValueChange={(value) => { setUserPage(1); setUserRole(value); }}><SelectTrigger className="w-32 rounded-xl"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All roles</SelectItem><SelectItem value="member">Member</SelectItem><SelectItem value="moderator">Moderator</SelectItem><SelectItem value="admin">Admin</SelectItem><SelectItem value="super_admin">Super Admin</SelectItem></SelectContent></Select><Select value={userStatus} onValueChange={(value) => { setUserPage(1); setUserStatus(value); }}><SelectTrigger className="w-36 rounded-xl"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All account states</SelectItem><SelectItem value="active">Active</SelectItem><SelectItem value="restricted">Restricted</SelectItem><SelectItem value="suspended">Suspended</SelectItem></SelectContent></Select></div></CardHeader><CardContent className="p-0"><div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500 dark:bg-slate-950"><tr><th className="px-6 py-4">User</th><th className="px-6 py-4">Role</th><th className="px-6 py-4">Account</th><th className="px-6 py-4">Subscription</th><th className="px-6 py-4 text-right">Access</th></tr></thead><tbody className="divide-y divide-slate-100 dark:divide-slate-800">{loading ? <tr><td colSpan={5} className="p-12 text-center"><Loader2 className="mx-auto animate-spin text-primary" /></td></tr> : users.map((user) => <tr key={user.id} className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-950"><td className="px-6 py-4"><p className="font-semibold">{user.name || 'Unnamed developer'}</p><p className="text-xs text-slate-500">{user.email}</p></td><td className="px-6 py-4"><Badge className={`${roleStyles[user.role] || roleStyles.member} border-0`}>{roleLabels[user.role] || 'Member'}</Badge></td><td className="px-6 py-4"><Badge variant="outline" className="capitalize">{user.account_status}</Badge>{user.restricted_until && <p className="mt-1 text-[10px] text-slate-400">until {new Date(user.restricted_until).toLocaleDateString()}</p>}</td><td className="px-6 py-4 text-slate-500">{user.is_premium_override ? 'Pro' : 'Free'}</td><td className="px-6 py-4 text-right">{isSuperAdmin && user.id !== currentUser.id ? <Select value={user.role} onValueChange={(value) => openRoleConfirmation(user, value as AppRole)} disabled={updatingUserId === user.id}><SelectTrigger className="ml-auto w-44 rounded-xl"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="member">Member</SelectItem><SelectItem value="moderator">Moderator</SelectItem><SelectItem value="admin">Admin</SelectItem><SelectItem value="super_admin">Super Admin</SelectItem></SelectContent></Select> : <span className="text-xs font-medium text-slate-400">{user.id === currentUser.id ? 'Your account' : 'Read only'}</span>}</td></tr>)}</tbody></table></div><div className="flex items-center justify-between p-5 text-sm text-slate-500"><span>{totalUsers} total users</span><div className="flex gap-2"><Button variant="outline" size="sm" disabled={!canGoBackUsers} onClick={() => setUserPage((page) => page - 1)} className="rounded-xl">Previous</Button><Button variant="outline" size="sm" disabled={!canGoForwardUsers} onClick={() => setUserPage((page) => page + 1)} className="rounded-xl">Next</Button></div></div></CardContent></Card></TabsContent>}

          {isAdmin && <TabsContent value="audit"><Card className="border-0 shadow-sm dark:bg-slate-900"><CardHeader><CardTitle className="flex items-center gap-2"><ShieldCheck size={19} /> Administrative audit history</CardTitle><p className="text-sm text-slate-500">Consequential moderation and role actions are recorded by trusted database functions.</p></CardHeader><CardContent className="space-y-3">{auditLogs.length === 0 ? <p className="rounded-2xl bg-slate-50 p-8 text-center text-sm text-slate-500 dark:bg-slate-950">No audit activity has been recorded yet.</p> : auditLogs.map((log) => <div key={log.id} className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800"><div className="flex flex-col justify-between gap-2 sm:flex-row"><div><p className="font-semibold">{formatStatus(log.action)}</p><p className="text-sm text-slate-500">{log.actor_name || 'Administrator'} · {log.entity_type}</p>{log.reason && <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{log.reason}</p>}</div><span className="text-xs text-slate-400">{new Date(log.created_at).toLocaleString()}</span></div></div>)}</CardContent></Card></TabsContent>}
        </Tabs>
      </div>

      <Dialog open={!!pendingRole} onOpenChange={(open) => !open && setPendingRole(null)}><DialogContent className="rounded-3xl sm:max-w-lg"><DialogHeader><DialogTitle>Confirm role change</DialogTitle><DialogDescription>Review this permission change before it is sent to Supabase.</DialogDescription></DialogHeader>{pendingRole && <div className="space-y-4"><div className="rounded-2xl bg-slate-50 p-4 text-sm dark:bg-slate-900"><p className="font-bold">{pendingRole.user.name || pendingRole.user.email}</p><p className="mt-1 text-slate-500">{roleLabels[pendingRole.user.role]} <span className="px-2">→</span> {roleLabels[pendingRole.newRole]}</p><p className="mt-3 text-slate-600 dark:text-slate-300">{pendingRole.newRole === 'super_admin' ? 'Super Admins can manage roles, moderation, and platform-wide administration.' : pendingRole.newRole === 'admin' ? 'Admins can manage users and resolve moderation cases but cannot assign roles.' : pendingRole.newRole === 'moderator' ? 'Moderators can review reports and apply permitted moderation actions.' : 'Members do not have administrative dashboard access.'}</p></div><div className="space-y-2"><Label htmlFor="role-reason">Reason</Label><Textarea id="role-reason" value={roleReason} onChange={(event) => setRoleReason(event.target.value)} placeholder="Why is this role change needed?" className="rounded-xl" /></div></div>}<DialogFooter><Button variant="outline" onClick={() => setPendingRole(null)} className="rounded-xl">Cancel</Button><Button onClick={confirmRoleChange} disabled={!!updatingUserId} className="rounded-xl">{updatingUserId ? <Loader2 size={16} className="mr-2 animate-spin" /> : null}Confirm change</Button></DialogFooter></DialogContent></Dialog>

      <Dialog open={!!pendingAction} onOpenChange={(open) => !open && setPendingAction(null)}><DialogContent className="rounded-3xl sm:max-w-lg"><DialogHeader><DialogTitle>{pendingAction ? `${formatStatus(pendingAction.action)} report` : 'Moderation action'}</DialogTitle><DialogDescription>This action is permission-checked and will be recorded in the audit log.</DialogDescription></DialogHeader>{pendingAction && <div className="space-y-4"><div className="rounded-2xl bg-slate-50 p-4 text-sm dark:bg-slate-900"><p className="font-bold">{pendingAction.report.reason}</p><p className="mt-1 text-slate-500">{pendingAction.report.reported_project_title || pendingAction.report.reported_comment_content || 'Reported content'}</p></div>{pendingAction.action === 'restrict' && <div className="space-y-2"><Label htmlFor="restriction-until">Restriction expires</Label><Input id="restriction-until" type="datetime-local" value={restrictionUntil} onChange={(event) => setRestrictionUntil(event.target.value)} className="rounded-xl" /></div>}<div className="space-y-2"><Label htmlFor="action-reason">Reason</Label><Textarea id="action-reason" value={actionReason} onChange={(event) => setActionReason(event.target.value)} placeholder="Document the decision and context." className="rounded-xl" /></div></div>}<DialogFooter><Button variant="outline" onClick={() => setPendingAction(null)} className="rounded-xl">Cancel</Button><Button onClick={confirmReportAction} className="rounded-xl">Confirm action</Button></DialogFooter></DialogContent></Dialog>
    </div>
  );
};

export default Admin;
