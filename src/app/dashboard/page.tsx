'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface DashboardStats {
  totalAccounts: number;
  totalContacts: number;
  totalLeads: number;
  totalOpportunities: number;
  pipelineValue: number;
  monthlyRevenue: number;
  conversionRate: number;
  activeTasks: number;
}

interface RecentActivity {
  id: string;
  type: string;
  subject: string;
  user: string;
  timestamp: string;
  parentType?: string;
  parentName?: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState<DashboardStats>({
    totalAccounts: 0,
    totalContacts: 0,
    totalLeads: 0,
    totalOpportunities: 0,
    pipelineValue: 0,
    monthlyRevenue: 0,
    conversionRate: 0,
    activeTasks: 0,
  });
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem('auth_token');
    const userData = localStorage.getItem('user');
    
    if (!token || !userData) {
      router.push('/auth/login');
      return;
    }

    setUser(JSON.parse(userData));
    loadDashboardData();
  }, [router]);

  const loadDashboardData = async () => {
    try {
      // Mock data for demonstration
      // In production, these would be API calls
      setTimeout(() => {
        setStats({
          totalAccounts: 125,
          totalContacts: 384,
          totalLeads: 57,
          totalOpportunities: 89,
          pipelineValue: 2450000,
          monthlyRevenue: 485000,
          conversionRate: 23.5,
          activeTasks: 34,
        });

        setRecentActivities([
          {
            id: '1',
            type: 'call',
            subject: 'Discovery Call with TechCorp',
            user: 'Michael Chen',
            timestamp: '2 hours ago',
            parentType: 'opportunity',
            parentName: 'TechCorp Platform Upgrade',
          },
          {
            id: '2',
            type: 'email',
            subject: 'Follow-up on ERP Demo',
            user: 'Emily Rodriguez',
            timestamp: '4 hours ago',
            parentType: 'opportunity',
            parentName: 'Manufacturing ERP Implementation',
          },
          {
            id: '3',
            type: 'meeting',
            subject: 'HealthTech Stakeholder Meeting',
            user: 'Michael Chen',
            timestamp: '1 day ago',
            parentType: 'opportunity',
            parentName: 'HealthTech Digital Transformation',
          },
          {
            id: '4',
            type: 'task',
            subject: 'Prepare TechCorp proposal',
            user: 'David Kim',
            timestamp: '2 days ago',
            parentType: 'opportunity',
            parentName: 'TechCorp Platform Upgrade',
          },
        ]);

        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    router.push('/auth/login');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'call': return '📞';
      case 'email': return '📧';
      case 'meeting': return '🤝';
      case 'task': return '✅';
      default: return '📄';
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'call': return 'bg-green-100 text-green-800';
      case 'email': return 'bg-blue-100 text-blue-800';
      case 'meeting': return 'bg-purple-100 text-purple-800';
      case 'task': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm">CRM</span>
                </div>
                <h1 className="text-xl font-semibold text-gray-900">Enterprise Sales CRM</h1>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="text-sm font-medium text-gray-900">
                  {user?.firstName} {user?.lastName}
                </div>
                <div className="text-xs text-gray-500">{user?.role}</div>
              </div>
              <Button 
                variant="outline" 
                onClick={handleLogout}
                className="text-gray-700 border-gray-300 hover:bg-gray-50"
              >
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6">
        <div className="max-w-7xl mx-auto">
          {/* Welcome Section */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Welcome back, {user?.firstName}!
            </h2>
            <p className="text-gray-600">
              Here's what's happening with your sales pipeline today.
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-500">Total Accounts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">{stats.totalAccounts}</div>
                <p className="text-xs text-green-600 mt-1">+12% from last month</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-500">Active Leads</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">{stats.totalLeads}</div>
                <p className="text-xs text-green-600 mt-1">+8% from last month</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-500">Pipeline Value</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">{formatCurrency(stats.pipelineValue)}</div>
                <p className="text-xs text-green-600 mt-1">+15% from last month</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-500">Conversion Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">{stats.conversionRate}%</div>
                <p className="text-xs text-green-600 mt-1">+2.3% from last month</p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activities */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Recent Activities</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {recentActivities.map((activity, index) => (
                  <div key={activity.id}>
                    <div className="flex items-start space-x-3">
                      <div className="text-lg">{getActivityIcon(activity.type)}</div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-medium text-gray-900">
                            {activity.subject}
                          </h4>
                          <Badge variant="secondary" className={`text-xs ${getActivityColor(activity.type)}`}>
                            {activity.type}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          by {activity.user} • {activity.timestamp}
                        </p>
                        {activity.parentName && (
                          <p className="text-xs text-gray-600 mt-1">
                            Related to: {activity.parentName}
                          </p>
                        )}
                      </div>
                    </div>
                    {index < recentActivities.length - 1 && <Separator className="mt-4" />}
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full justify-start h-12" variant="outline">
                  <span className="mr-3">👤</span>
                  Add New Contact
                </Button>
                <Button className="w-full justify-start h-12" variant="outline">
                  <span className="mr-3">🏢</span>
                  Create Account
                </Button>
                <Button className="w-full justify-start h-12" variant="outline">
                  <span className="mr-3">💼</span>
                  New Opportunity
                </Button>
                <Button className="w-full justify-start h-12" variant="outline">
                  <span className="mr-3">📋</span>
                  Create Task
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Navigation Info */}
          <Card className="mt-8">
            <CardContent className="p-6">
              <div className="text-center text-gray-600">
                <h3 className="text-lg font-semibold mb-2">Enterprise CRM Dashboard</h3>
                <p className="mb-4">
                  This is a demonstration of the Enterprise Sales CRM platform. 
                  The system includes comprehensive account management, lead tracking, 
                  opportunity pipeline, and sales analytics.
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="font-semibold">Multi-tenant</div>
                    <div className="text-xs text-gray-500">Secure isolation</div>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="font-semibold">Role-based Access</div>
                    <div className="text-xs text-gray-500">RBAC security</div>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="font-semibold">Audit Logging</div>
                    <div className="text-xs text-gray-500">Complete tracking</div>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="font-semibold">Scalable APIs</div>
                    <div className="text-xs text-gray-500">Production ready</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}