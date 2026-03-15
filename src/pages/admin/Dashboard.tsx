import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

const data = [
  { name: 'Mon', users: 4000, sessions: 2400 },
  { name: 'Tue', users: 3000, sessions: 1398 },
  { name: 'Wed', users: 2000, sessions: 9800 },
  { name: 'Thu', users: 2780, sessions: 3908 },
  { name: 'Fri', users: 1890, sessions: 4800 },
  { name: 'Sat', users: 2390, sessions: 3800 },
  { name: 'Sun', users: 3490, sessions: 4300 },
];

export default function AdminDashboard() {
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-display font-bold text-slate-900">Admin Overview</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-slate-500 font-medium">Total Users</p>
            <h3 className="text-3xl font-bold text-slate-900">24.5k</h3>
            <span className="text-xs text-emerald-600 font-bold">+12% from last month</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-slate-500 font-medium">Active Sessions</p>
            <h3 className="text-3xl font-bold text-slate-900">1,204</h3>
            <span className="text-xs text-emerald-600 font-bold">+5% right now</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-slate-500 font-medium">Avg. Duration</p>
            <h3 className="text-3xl font-bold text-slate-900">18m</h3>
            <span className="text-xs text-slate-400">Per session</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-slate-500 font-medium">Revenue</p>
            <h3 className="text-3xl font-bold text-slate-900">$45.2k</h3>
            <span className="text-xs text-emerald-600 font-bold">+8% this week</span>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>User Growth</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#4F46E5" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748B'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748B'}} />
                <Tooltip />
                <Area type="monotone" dataKey="users" stroke="#4F46E5" fillOpacity={1} fill="url(#colorUsers)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Session Activity</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748B'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748B'}} />
                <Tooltip cursor={{fill: '#F1F5F9'}} />
                <Bar dataKey="sessions" fill="#10B981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
