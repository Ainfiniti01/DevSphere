"use client";

import React, { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Rocket, AlertCircle, DollarSign, ShieldCheck } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { useApp } from '@/context/AppContext';
import { useNavigate } from 'react-router-dom';
import LoadingScreen from '@/components/LoadingScreen';

const MOCK_DATA = [
  { name: 'Mon', users: 400, projects: 240 },
  { name: 'Tue', users: 300, projects: 139 },
  { name: 'Wed', users: 200, projects: 980 },
  { name: 'Thu', users: 278, projects: 390 },
  { name: 'Fri', users: 189, projects: 480 },
  { name: 'Sat', users: 239, projects: 380 },
  { name: 'Sun', users: 349, projects: 430 },
];

const Admin = () => {
  const { currentUser } = useApp();
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect if not admin
    if (currentUser && !currentUser.is_admin) {
      navigate('/');
    }
  }, [currentUser, navigate]);

  if (!currentUser || !currentUser.is_admin) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Admin Dashboard</h1>
            <p className="text-slate-500">Platform overview and management</p>
          </div>
          <div className="flex gap-3">
            <button className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium shadow-sm">Export Data</button>
            <button className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium shadow-md">System Status</button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[
            { label: 'Total Users', value: '12,842', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'Live Projects', value: '1,420', icon: Rocket, color: 'text-indigo-600', bg: 'bg-indigo-50' },
            { label: 'Total Funding', value: '$2.4M', icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50' },
            { label: 'Reports', value: '14', icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50' },
          ].map((stat) => (
            <Card key={stat.label} className="border-none shadow-sm">
              <CardContent className="p-6 flex items-center gap-4">
                <div className={`p-3 rounded-2xl ${stat.bg} ${stat.color}`}>
                  <stat.icon size={24} />
                </div>
                <div>
                  <p className="text-sm text-slate-500 font-medium">{stat.label}</p>
                  <h3 className="text-2xl font-bold text-slate-900">{stat.value}</h3>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Growth Analytics</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={MOCK_DATA}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                  <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.05)'}} />
                  <Bar dataKey="users" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Project Submissions</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={MOCK_DATA}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                  <Tooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.05)'}} />
                  <Line type="monotone" dataKey="projects" stroke="#10b981" strokeWidth={3} dot={{r: 4, fill: '#10b981'}} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <Card className="border-none shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Recent Verifications</CardTitle>
            <button className="text-sm text-indigo-600 font-semibold">View All</button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-white rounded-full border border-slate-200"></div>
                    <div>
                      <h4 className="font-bold text-sm">User_{i}842</h4>
                      <p className="text-xs text-slate-500">Developer • Applied 2h ago</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"><AlertCircle size={18} /></button>
                    <button className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"><ShieldCheck size={18} /></button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Admin;