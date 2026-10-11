"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, CheckCircle2, Crown, Loader2, ShieldCheck, UserCog, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
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
  created_at: string | null;
};

type AdminReport = {
  id: string;
  reason: string;
  created_at: string;
  reporter_name: string | null;
  reported_user_name: string | null;
  reported_group_title: string | null;
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

const Admin = () => {
  const navigate = useNavigate();
  const { currentUser, isAdmin, isModerator, isSuperAdmin } = useApp();
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

  useEffect(() => {
    if (!currentUser || !isModerator) {
      navigate('/', { replace: true });
      return;
    }

    let mounted = true;
    const loadDashboard = async () => {
      setLoading(true);
      try {
        const reportsRequest = supabase.rpc('admin_list_reports');
        const usersRequest = isAdmin
          ? supabase.rpc('admin_list_users')
          : Promise.resolve({ data: [], error: null });
        const [reportsResponse, usersResponse] = await Promise.all([reportsRequest, usersRequest]);

        if (reportsResponse.error) throw reportsResponse.error;
        if (usersResponse.error) throw usersResponse.error;

        if (mounted) {
          setReports((reportsResponse.data || []) as AdminReport[]);
          setUsers((usersResponse.data || []) as ManagedUser[]);
        }
      } catch (error: any) {
        if (mounted) toast.error(error.message || 'Unable to load the admin dashboard.');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadDashboard();
    return () => {
      mounted = false;
    };
  }, [currentUser, isAdmin, isModerator, navigate]);

  const handleRoleChange = async (userId: string, newRole: AppRole) => {
    if (!isSuperAdmin || userId === currentUser?.id) return;

    setUpdatingUserId(userId);
    try {
      const { data, error } = await supabase.rpc('admin_update_user_role', {
        p_target_user_id: userId,
        p_new_role: newRole,
      });
      if (error) throw error;

      const updated = data?.[0];
      setUsers((current) =>
        current.map((user) =>
          user.id === userId
            ? { ...user, role: updated?.role || newRole, is_admin: updated?.is_admin ?? newRole === 'admin' || newRole === 'super_admin' }
            : user,
        ),
      );
      toast.success(`Role updated to ${roleLabels[newRole]}.`);
    } catch (error: any) {
      toast.error(error.message || 'Unable to update this user role.');
    } finally {
      setUpdatingUserId(null);
    }
  };

  const roleCounts = useMemo(() => ({
    admins: users.filter((user) => user.role === 'admin' || user.role === 'super_admin').length,
    moderators: users.filter((user) => user.role === 'moderator').length,
    proUsers: users.filter((user) => user.is_premium_override).length,
  }), [users]);

  if (!currentUser || !isModerator) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 text-slate-900 dark:bg-slate-950 dark:text-slate-100 sm:p-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="mb-2 text-xs font-black uppercase tracking-[0.2em] text-primary">DevSphere control center</p>
            <h1 className="text-3xl font-bold">{isModerator && !isAdmin ? 'Moderation Center' : 'Admin Dashboard'}</h1>
            <p className="mt-1 text-slate-500 dark:text-slate-400">
              {isSuperAdmin
                ? 'Manage administrative access and keep the community healthy.'
                : isAdmin
                  ? 'Review platform activity and monitor the community.'
                  : 'Review reports and help keep DevSphere safe.'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge className={`${roleStyles[currentUser.role as AppRole] || roleStyles.member} border-0 px-3 py-1.5`}>
              {isSuperAdmin && <Crown size={14} className="mr-1.5" />}
              {roleLabels[currentUser.role as AppRole] || 'Member'}
            </Badge>
            <button onClick={() => navigate('/profile')} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold shadow-sm transition hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800">
              Back to profile
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Card className="border-0 shadow-sm dark:bg-slate-900">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="rounded-2xl bg-blue-100 p-3 text-blue-600 dark:bg-blue-950 dark:text-blue-300"><Users size={22} /></div>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Managed users</p>
                <p className="text-2xl font-bold">{isAdmin ? users.length : '—'}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm dark:bg-slate-900">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="rounded-2xl bg-violet-100 p-3 text-violet-600 dark:bg-violet-950 dark:text-violet-300"><ShieldCheck size={22} /></div>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Admin access</p>
                <p className="text-2xl font-bold">{isAdmin ? roleCounts.admins : roleCounts.moderators}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm dark:bg-slate-900">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="rounded-2xl bg-amber-100 p-3 text-amber-600 dark:bg-amber-950 dark:text-amber-300"><AlertCircle size={22} /></div>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Open reports</p>
                <p className="text-2xl font-bold">{reports.length}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {isAdmin && (
          <Card className="border-0 shadow-sm dark:bg-slate-900">
            <CardHeader className="flex flex-col gap-2 border-b border-slate-100 px-6 py-5 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="flex items-center gap-2"><UserCog size={20} /> User access</CardTitle>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  {isSuperAdmin ? 'Only you can grant or revoke administrative roles.' : 'Role management is restricted to the Super Admin.'}
                </p>
              </div>
              {isAdmin && <span className="text-xs font-semibold text-slate-500">{roleCounts.proUsers} Pro accounts remain separate</span>}
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex items-center justify-center p-12"><Loader2 className="animate-spin text-primary" /></div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[720px] text-left text-sm">
                    <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500 dark:bg-slate-950 dark:text-slate-400">
                      <tr>
                        <th className="px-6 py-4 font-semibold">User</th>
                        <th className="px-6 py-4 font-semibold">Current role</th>
                        <th className="px-6 py-4 font-semibold">Subscription</th>
                        <th className="px-6 py-4 text-right font-semibold">Access control</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {users.map((user) => (
                        <tr key={user.id}>
                          <td className="px-6 py-4">
                            <p className="font-semibold">{user.name || 'Unnamed developer'}</p>
                            <p className="text-xs text-slate-500">{user.email}</p>
                          </td>
                          <td className="px-6 py-4">
                            <Badge className={`${roleStyles[user.role] || roleStyles.member} border-0`}>{roleLabels[user.role] || 'Member'}</Badge>
                          </td>
                          <td className="px-6 py-4 text-slate-500">{user.is_premium_override ? 'Pro' : 'Free'}</td>
                          <td className="px-6 py-4 text-right">
                            {isSuperAdmin && user.id !== currentUser.id ? (
                              <Select value={user.role} onValueChange={(value) => handleRoleChange(user.id, value as AppRole)} disabled={updatingUserId === user.id}>
                                <SelectTrigger className="ml-auto w-44 rounded-xl"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="member">Member</SelectItem>
                                  <SelectItem value="moderator">Moderator</SelectItem>
                                  <SelectItem value="admin">Admin</SelectItem>
                                  <SelectItem value="super_admin">Super Admin</SelectItem>
                                </SelectContent>
                              </Select>
                            ) : (
                              <span className="text-xs font-medium text-slate-400">{user.id === currentUser.id ? 'Your account' : 'Read only'}</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <Card className="border-0 shadow-sm dark:bg-slate-900">
          <CardHeader className="border-b border-slate-100 px-6 py-5 dark:border-slate-800">
            <CardTitle className="flex items-center gap-2"><AlertCircle size={20} /> Moderation queue</CardTitle>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Reports are visible to Moderators, Admins, and the Super Admin.</p>
          </CardHeader>
          <CardContent className="p-6">
            {loading ? (
              <div className="flex items-center justify-center p-8"><Loader2 className="animate-spin text-primary" /></div>
            ) : reports.length === 0 ? (
              <div className="flex items-center gap-3 rounded-2xl bg-emerald-50 p-5 text-sm font-medium text-emerald-700 dark:bg-emerald-950 dark:text-emerald-200">
                <CheckCircle2 size={20} /> No reports need attention right now.
              </div>
            ) : (
              <div className="space-y-3">
                {reports.map((report) => (
                  <div key={report.id} className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
                    <div className="flex flex-col justify-between gap-2 sm:flex-row">
                      <div>
                        <p className="font-semibold">{report.reason}</p>
                        <p className="mt-1 text-sm text-slate-500">
                          Reported by {report.reporter_name || 'a developer'}
                          {report.reported_user_name ? ` · About ${report.reported_user_name}` : ''}
                          {report.reported_group_title ? ` · Project ${report.reported_group_title}` : ''}
                        </p>
                      </div>
                      <span className="text-xs text-slate-400">{new Date(report.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Admin;
