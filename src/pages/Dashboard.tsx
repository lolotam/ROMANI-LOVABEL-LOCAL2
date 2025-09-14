import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { jsonDatabase } from '@/lib/jsonDatabase';
import { 
  FileText, 
  Users, 
  Building2, 
  AlertTriangle, 
  TrendingUp, 
  Calendar,
  Plus,
  Download,
  Settings
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Layout } from '@/components/Layout';

interface DashboardStats {
  totalDocuments: number;
  totalEmployees: number;
  totalCompanies: number;
  expiringDocuments: number;
  expiredDocuments: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalDocuments: 0,
    totalEmployees: 0,
    totalCompanies: 0,
    expiringDocuments: 0,
    expiredDocuments: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const { logout } = useAuth();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch all documents to calculate stats
        const { data: documents } = await jsonDatabase
          .from('documents')
          .select('*')
          .execute();

        // Fetch total employees
        const { data: employees } = await jsonDatabase
          .from('employees')
          .select('*')
          .execute();

        // Fetch total companies
        const { data: companies } = await jsonDatabase
          .from('companies')
          .select('*')
          .execute();

        const documentsCount = documents?.length || 0;
        const employeesCount = employees?.length || 0;
        const companiesCount = companies?.length || 0;
        const expiringCount = documents?.filter(doc => doc.status === 'expiring_soon').length || 0;
        const expiredCount = documents?.filter(doc => doc.status === 'expired').length || 0;

        setStats({
          totalDocuments: documentsCount,
          totalEmployees: employeesCount,
          totalCompanies: companiesCount,
          expiringDocuments: expiringCount,
          expiredDocuments: expiredCount
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  const statCards = [
    {
      title: 'إجمالي الوثائق',
      value: stats.totalDocuments,
      icon: FileText,
      gradient: 'bg-gradient-primary',
      change: '+12%',
      changeType: 'positive' as const
    },
    {
      title: 'إجمالي الموظفين',
      value: stats.totalEmployees,
      icon: Users,
      gradient: 'bg-gradient-medical',
      change: '+5%',
      changeType: 'positive' as const
    },
    {
      title: 'الشركات',
      value: stats.totalCompanies,
      icon: Building2,
      gradient: 'bg-gradient-corporate',
      change: '0%',
      changeType: 'neutral' as const
    },
    {
      title: 'وثائق منتهية الصلاحية',
      value: stats.expiredDocuments,
      icon: AlertTriangle,
      gradient: 'bg-destructive',
      change: '-8%',
      changeType: 'negative' as const
    }
  ];

  const exportAllData = async () => {
    try {
      const [documentsResult, employeesResult, companiesResult] = await Promise.all([
        jsonDatabase.from('documents').select('*').execute(),
        jsonDatabase.from('employees').select('*').execute(),
        jsonDatabase.from('companies').select('*').execute()
      ]);

      const csvData = {
        documents: documentsResult.data || [],
        employees: employeesResult.data || [],
        companies: companiesResult.data || []
      };

      const blob = new Blob([JSON.stringify(csvData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `romani-data-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting data:', error);
    }
  };

  const quickActions = [
    { title: 'إضافة وثيقة جديدة', icon: Plus, href: '/documents', action: () => window.location.href = '/documents' },
    { title: 'إضافة موظف', icon: Users, href: '/employees', action: () => window.location.href = '/employees' },
    { title: 'تصدير البيانات', icon: Download, href: '#', action: exportAllData },
    { title: 'الإعدادات', icon: Settings, href: '/settings', action: () => window.location.href = '/settings' }
  ];

  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-2xl font-display font-bold text-foreground">
            Romani CureMed
          </h1>
          <p className="text-muted-foreground">
            لوحة التحكم الرئيسية
          </p>
          {/* CureMed Logo */}
          <div className="mt-4 mb-6">
            <img
              src="/curemed-logo.svg"
              alt="CureMed Logo"
              className="mx-auto h-10 w-auto opacity-80 hover:opacity-100 transition-opacity duration-300"
            />
          </div>
        </div>

        {/* Main Content */}
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h2 className="text-3xl font-bold text-foreground mb-2">
            مرحباً بك، المدير
          </h2>
          <p className="text-muted-foreground">
            إليك نظرة عامة على النظام اليوم، {new Date().toLocaleDateString('en-CA')}
          </p>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="relative overflow-hidden shadow-elegant hover:shadow-glow transition-all duration-300 transform hover:scale-105">
                <div className={`absolute top-0 right-0 w-32 h-32 ${stat.gradient} opacity-10 rounded-full -translate-y-16 translate-x-16`}></div>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </CardTitle>
                  <stat.icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">
                    {stat.value.toLocaleString('ar-SA')}
                  </div>
                  <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                    <Badge 
                      variant={stat.changeType === 'positive' ? 'default' : 
                               stat.changeType === 'negative' ? 'destructive' : 'secondary'}
                      className="text-xs"
                    >
                      {stat.change}
                    </Badge>
                    <span>من الشهر الماضي</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Alerts Section */}
        {(stats.expiringDocuments > 0 || stats.expiredDocuments > 0) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mb-8"
          >
            <Card className="border-warning bg-warning/5 shadow-elegant">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-warning">
                  <AlertTriangle className="h-5 w-5" />
                  <span>تنبيهات مهمة</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {stats.expiredDocuments > 0 && (
                    <p className="text-destructive">
                      • {stats.expiredDocuments} وثيقة منتهية الصلاحية تحتاج لتجديد فوري
                    </p>
                  )}
                  {stats.expiringDocuments > 0 && (
                    <p className="text-warning">
                      • {stats.expiringDocuments} وثيقة ستنتهي صلاحيتها خلال 30 يوماً
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mb-8"
        >
          <h3 className="text-xl font-semibold text-foreground mb-4">
            الإجراءات السريعة
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action, index) => (
              <Card 
                key={action.title}
                className="cursor-pointer shadow-soft hover:shadow-elegant transition-all duration-300 transform hover:scale-105 hover:bg-accent/50"
                onClick={action.action}
              >
                <CardContent className="flex items-center space-x-4 p-6">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <action.icon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{action.title}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.div>

        {/* Recent Activity placeholder */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card className="shadow-elegant">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="h-5 w-5" />
                <span>النشاطات الأخيرة</span>
              </CardTitle>
              <CardDescription>
                آخر العمليات المنجزة في النظام
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>لا توجد نشاطات حديثة</p>
                <p className="text-sm">سيتم عرض آخر النشاطات هنا عند توفرها</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </Layout>
  );
}