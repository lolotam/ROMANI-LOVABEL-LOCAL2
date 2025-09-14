import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { jsonDatabase, Employee, Document } from '@/lib/jsonDatabase';
import { Layout } from '@/components/Layout';
import {
  getExpiringEmployees,
  getExpiringDocuments,
  sendExpiryNotification,
  checkAndSendNotifications,
  EmailNotificationSettings,
  ExpiryData
} from '@/lib/emailService';
import { 
  Settings as SettingsIcon, 
  Mail, 
  Moon, 
  Sun, 
  Download,
  Edit,
  Pencil,
  Upload, 
  Database, 
  Clock,
  Building2,
  FileText,
  UserCog,
  Shield,
  Server,
  Archive,
  Trash2,
  RefreshCw
} from 'lucide-react';

interface EmailSettings {
  smtp_server: string;
  smtp_port: number;
  smtp_username: string;
  smtp_password: string;
  email_sender: string;
  email_receiver: string;
  enable_notifications: boolean;
  weekly_schedule: boolean;
  monthly_schedule: boolean;
}

interface Company {
  id: string;
  name: string;
  name_ar: string;
  description?: string;
}

interface DocumentType {
  id: string;
  name: string;
  name_ar: string;
}

interface Ministry {
  id: string;
  name: string;
  name_ar: string;
}

export default function Settings() {
  const [activeTab, setActiveTab] = useState('email');
  const [darkMode, setDarkMode] = useState(false);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([]);
  const [ministries, setMinistries] = useState<Ministry[]>([]);
  const [newCompany, setNewCompany] = useState({ name: '', name_ar: '', description: '' });
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [editingDocType, setEditingDocType] = useState<DocumentType | null>(null);
  const [editingMinistry, setEditingMinistry] = useState<Ministry | null>(null);
  const [newDocType, setNewDocType] = useState({ name: '', name_ar: '' });
  const [newMinistry, setNewMinistry] = useState({ name: '', name_ar: '' });
  const [isLoading, setIsLoading] = useState(true);
  const [emailSettings, setEmailSettings] = useState<EmailSettings>({
    smtp_server: import.meta.env.VITE_SMTP_SERVER || 'smtp.gmail.com',
    smtp_port: parseInt(import.meta.env.VITE_SMTP_PORT) || 587,
    smtp_username: import.meta.env.VITE_SMTP_USERNAME || 'dr.vet.waleedtam@gmail.com',
    smtp_password: import.meta.env.VITE_SMTP_PASSWORD || 'bfbc oqpk qbrb svhc',
    email_sender: import.meta.env.VITE_EMAIL_SENDER || 'dr.vet.waleedtam@gmail.com',
    email_receiver: import.meta.env.VITE_EMAIL_RECEIVER || 'lolotam@gmail.com',
    enable_notifications: true,
    weekly_schedule: true,
    monthly_schedule: true
  });

  // Enhanced email notification state
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [expiryData, setExpiryData] = useState<ExpiryData>({ employees: [], documents: [] });
  const [isCheckingExpiry, setIsCheckingExpiry] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [lastEmailSent, setLastEmailSent] = useState<string | null>(null);

  const { toast } = useToast();

  useEffect(() => {
    fetchData();
    // Check for dark mode preference
    const isDark = localStorage.getItem('darkMode') === 'true';
    setDarkMode(isDark);
    if (isDark) {
      document.documentElement.classList.add('dark');
    }
  }, []);

  const fetchData = async () => {
    try {
      const [companiesResult, docTypesResult, ministriesResult, employeesResult, documentsResult] = await Promise.all([
        jsonDatabase.from('companies').select('*').order('name', 'asc').execute(),
        jsonDatabase.from('document_types').select('*').order('name_ar', 'asc').execute(),
        jsonDatabase.from('ministries').select('*').order('name_ar', 'asc').execute(),
        jsonDatabase.from('employees').select('*').execute(),
        jsonDatabase.from('documents').select('*').execute()
      ]);

      setCompanies(companiesResult.data || []);
      setDocumentTypes(docTypesResult.data || []);
      setMinistries(ministriesResult.data || []);
      setEmployees(employeesResult.data || []);
      setDocuments(documentsResult.data || []);

      // Load last email sent timestamp
      const lastSent = localStorage.getItem('lastEmailSent');
      setLastEmailSent(lastSent);

      // Check for expiring items
      checkExpiringItems(employeesResult.data || [], documentsResult.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem('darkMode', newDarkMode.toString());
    
    if (newDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    toast({
      title: 'تم التغيير',
      description: `تم ${newDarkMode ? 'تفعيل' : 'إلغاء'} الوضع المظلم`
    });
  };

  const addCompany = async () => {
    if (!newCompany.name.trim() || !newCompany.name_ar.trim()) {
      toast({
        title: 'خطأ',
        description: 'يرجى إدخال جميع البيانات المطلوبة',
        variant: 'destructive'
      });
      return;
    }

    try {
      const { error } = await jsonDatabase.insert('companies', [{
        name: newCompany.name,
        name_ar: newCompany.name_ar,
        description: newCompany.description
      }]);

      if (error) throw error;

      toast({
        title: 'تم بنجاح',
        description: 'تم إضافة الشركة الجديدة'
      });

      setNewCompany({ name: '', name_ar: '', description: '' });
      fetchData();
    } catch (error) {
      console.error('Error adding company:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في إضافة الشركة',
        variant: 'destructive'
      });
    }
  };

  const updateCompany = async () => {
    if (!editingCompany || !editingCompany.name.trim() || !editingCompany.name_ar.trim()) {
      toast({
        title: 'خطأ',
        description: 'يرجى إدخال جميع البيانات المطلوبة',
        variant: 'destructive'
      });
      return;
    }

    try {
      const { error } = await jsonDatabase.update('companies', editingCompany.id, {
        name: editingCompany.name,
        name_ar: editingCompany.name_ar,
        description: editingCompany.description
      });

      if (error) throw error;

      toast({
        title: 'تم بنجاح',
        description: 'تم تحديث الشركة'
      });

      setEditingCompany(null);
      fetchData();
    } catch (error) {
      console.error('Error updating company:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في تحديث الشركة',
        variant: 'destructive'
      });
    }
  };

  const deleteCompany = async (company: Company) => {
    if (!confirm(`هل أنت متأكد من حذف شركة "${company.name_ar}"؟`)) return;

    try {
      const { error } = await jsonDatabase.delete('companies', company.id);

      if (error) throw error;

      toast({
        title: 'تم بنجاح',
        description: 'تم حذف الشركة'
      });

      fetchData();
    } catch (error) {
      console.error('Error deleting company:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في حذف الشركة',
        variant: 'destructive'
      });
    }
  };

  const addDocumentType = async () => {
    if (!newDocType.name.trim() || !newDocType.name_ar.trim()) {
      toast({
        title: 'خطأ',
        description: 'يرجى إدخال جميع البيانات المطلوبة',
        variant: 'destructive'
      });
      return;
    }

    try {
      const { error } = await jsonDatabase.insert('document_types', [newDocType]);

      if (error) throw error;

      toast({
        title: 'تم بنجاح',
        description: 'تم إضافة نوع الوثيقة الجديد'
      });

      setNewDocType({ name: '', name_ar: '' });
      fetchData();
    } catch (error) {
      console.error('Error adding document type:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في إضافة نوع الوثيقة',
        variant: 'destructive'
      });
    }
  };

  const addMinistry = async () => {
    if (!newMinistry.name.trim() || !newMinistry.name_ar.trim()) {
      toast({
        title: 'خطأ',
        description: 'يرجى إدخال جميع البيانات المطلوبة',
        variant: 'destructive'
      });
      return;
    }

    try {
      const { error } = await jsonDatabase.insert('ministries', [newMinistry]);

      if (error) throw error;

      toast({
        title: 'تم بنجاح',
        description: 'تم إضافة الوزارة الجديدة'
      });

      setNewMinistry({ name: '', name_ar: '' });
      fetchData();
    } catch (error) {
      console.error('Error adding ministry:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في إضافة الوزارة',
        variant: 'destructive'
      });
    }
  };

  const updateDocumentType = async () => {
    if (!editingDocType || !editingDocType.name.trim() || !editingDocType.name_ar.trim()) {
      toast({
        title: 'خطأ',
        description: 'يرجى إدخال جميع البيانات المطلوبة',
        variant: 'destructive'
      });
      return;
    }

    try {
      const { error } = await jsonDatabase.update('document_types', editingDocType.id, {
        name: editingDocType.name,
        name_ar: editingDocType.name_ar
      });

      if (error) throw error;

      toast({
        title: 'تم بنجاح',
        description: 'تم تحديث نوع الوثيقة'
      });

      setEditingDocType(null);
      fetchData();
    } catch (error) {
      console.error('Error updating document type:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في تحديث نوع الوثيقة',
        variant: 'destructive'
      });
    }
  };

  const deleteDocumentType = async (docType: DocumentType) => {
    if (!confirm(`هل أنت متأكد من حذف نوع الوثيقة "${docType.name_ar}"؟`)) return;

    try {
      const { error } = await jsonDatabase.delete('document_types', docType.id);

      if (error) throw error;

      toast({
        title: 'تم بنجاح',
        description: 'تم حذف نوع الوثيقة'
      });

      fetchData();
    } catch (error) {
      console.error('Error deleting document type:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في حذف نوع الوثيقة',
        variant: 'destructive'
      });
    }
  };

  const updateMinistry = async () => {
    if (!editingMinistry || !editingMinistry.name.trim() || !editingMinistry.name_ar.trim()) {
      toast({
        title: 'خطأ',
        description: 'يرجى إدخال جميع البيانات المطلوبة',
        variant: 'destructive'
      });
      return;
    }

    try {
      const { error } = await jsonDatabase.update('ministries', editingMinistry.id, {
        name: editingMinistry.name,
        name_ar: editingMinistry.name_ar
      });

      if (error) throw error;

      toast({
        title: 'تم بنجاح',
        description: 'تم تحديث الوزارة'
      });

      setEditingMinistry(null);
      fetchData();
    } catch (error) {
      console.error('Error updating ministry:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في تحديث الوزارة',
        variant: 'destructive'
      });
    }
  };

  const deleteMinistry = async (ministry: Ministry) => {
    if (!confirm(`هل أنت متأكد من حذف الوزارة "${ministry.name_ar}"؟`)) return;

    try {
      const { error } = await jsonDatabase.delete('ministries', ministry.id);

      if (error) throw error;

      toast({
        title: 'تم بنجاح',
        description: 'تم حذف الوزارة'
      });

      fetchData();
    } catch (error) {
      console.error('Error deleting ministry:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في حذف الوزارة',
        variant: 'destructive'
      });
    }
  };


  const exportBackup = async () => {
    try {
      const [documentsResult, employeesResult, companiesResult, docTypesResult, ministriesResult] = await Promise.all([
        jsonDatabase.from('documents').select('*').execute(),
        jsonDatabase.from('employees').select('*').execute(),
        jsonDatabase.from('companies').select('*').execute(),
        jsonDatabase.from('document_types').select('*').execute(),
        jsonDatabase.from('ministries').select('*').execute()
      ]);

      const backup = {
        timestamp: new Date().toISOString(),
        version: '1.0',
        data: {
          documents: documentsResult.data || [],
          employees: employeesResult.data || [],
          companies: companiesResult.data || [],
          document_types: docTypesResult.data || [],
          ministries: ministriesResult.data || []
        }
      };

      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `romani-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: 'تم التصدير',
        description: 'تم تصدير النسخة الاحتياطية بنجاح'
      });
    } catch (error) {
      console.error('Error exporting backup:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في تصدير النسخة الاحتياطية',
        variant: 'destructive'
      });
    }
  };

  const saveEmailSettings = () => {
    // Save email settings to localStorage (in production, save to database)
    localStorage.setItem('emailSettings', JSON.stringify(emailSettings));
    toast({
      title: 'تم الحفظ',
      description: 'تم حفظ إعدادات البريد الإلكتروني'
    });
  };

  // Check for expiring items
  const checkExpiringItems = (employeeData: Employee[], documentData: Document[]) => {
    const expiringEmployees = getExpiringEmployees(employeeData);
    const expiringDocuments = getExpiringDocuments(documentData, employeeData);

    setExpiryData({
      employees: expiringEmployees,
      documents: expiringDocuments
    });
  };

  // Manual expiry check
  const handleCheckExpiry = async () => {
    setIsCheckingExpiry(true);
    try {
      await fetchData(); // Refresh data and check expiry
      toast({
        title: 'تم الفحص',
        description: `تم العثور على ${expiryData.employees.length} إقامة و ${expiryData.documents.length} وثيقة تنتهي صلاحيتها قريباً`
      });
    } catch (error) {
      console.error('Error checking expiry:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في فحص انتهاء الصلاحية',
        variant: 'destructive'
      });
    } finally {
      setIsCheckingExpiry(false);
    }
  };

  // Send test email with current expiry data
  const handleSendTestEmail = async () => {
    setIsSendingEmail(true);
    try {
      const notificationSettings: EmailNotificationSettings = {
        enabled: emailSettings.enable_notifications,
        monthlyReminder: emailSettings.monthly_schedule,
        weeklyReminder: emailSettings.weekly_schedule,
        expiredNotification: true,
        emailRecipient: emailSettings.email_receiver
      };

      const result = await sendExpiryNotification(expiryData, notificationSettings);

      if (result.success) {
        const currentTime = new Date().toLocaleString('ar-EG');
        localStorage.setItem('lastEmailSent', currentTime);
        setLastEmailSent(currentTime);

        toast({
          title: 'تم الإرسال',
          description: result.message
        });
      } else {
        toast({
          title: 'فشل الإرسال',
          description: result.message,
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error sending test email:', error);
      toast({
        title: 'خطأ',
        description: `خطأ في إرسال الإيميل: ${error}`,
        variant: 'destructive'
      });
    } finally {
      setIsSendingEmail(false);
    }
  };

  // Test email functionality by sending a test notification
  const testEmail = async () => {
    await handleSendTestEmail();
  };

  // Automatic check and send notifications
  const handleAutoNotifications = async () => {
    const notificationSettings: EmailNotificationSettings = {
      enabled: emailSettings.enable_notifications,
      monthlyReminder: emailSettings.monthly_schedule,
      weeklyReminder: emailSettings.weekly_schedule,
      expiredNotification: true,
      emailRecipient: emailSettings.email_receiver
    };

    await checkAndSendNotifications(employees, documents, notificationSettings);
  };

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
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
        >
          <div>
            <h1 className="text-3xl font-bold text-gradient">الإعدادات</h1>
            <p className="text-muted-foreground">
              إدارة إعدادات النظام والتكوينات العامة
            </p>
          </div>
        </motion.div>

        {/* Settings Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 lg:grid-cols-6">
              <TabsTrigger value="email" className="flex items-center space-x-2">
                <Mail className="h-4 w-4" />
                <span>البريد</span>
              </TabsTrigger>
              <TabsTrigger value="appearance" className="flex items-center space-x-2">
                <Moon className="h-4 w-4" />
                <span>المظهر</span>
              </TabsTrigger>
              <TabsTrigger value="companies" className="flex items-center space-x-2">
                <Building2 className="h-4 w-4" />
                <span>الشركات</span>
              </TabsTrigger>
              <TabsTrigger value="documents" className="flex items-center space-x-2">
                <FileText className="h-4 w-4" />
                <span>أنواع الوثائق</span>
              </TabsTrigger>
              <TabsTrigger value="ministries" className="flex items-center space-x-2">
                <Shield className="h-4 w-4" />
                <span>الوزارات</span>
              </TabsTrigger>
              <TabsTrigger value="backup" className="flex items-center space-x-2">
                <Database className="h-4 w-4" />
                <span>النسخ الاحتياطي</span>
              </TabsTrigger>
            </TabsList>

            {/* Email Settings */}
            <TabsContent value="email" className="space-y-6">
              <Card className="shadow-elegant">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Mail className="h-5 w-5" />
                    <span>إعدادات البريد الإلكتروني</span>
                  </CardTitle>
                  <CardDescription>
                    تكوين خادم البريد الإلكتروني والإشعارات التلقائية
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="smtp_server">خادم SMTP</Label>
                      <Input
                        id="smtp_server"
                        value={emailSettings.smtp_server}
                        onChange={(e) => setEmailSettings({...emailSettings, smtp_server: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="smtp_port">منفذ SMTP</Label>
                      <Input
                        id="smtp_port"
                        type="number"
                        value={emailSettings.smtp_port}
                        onChange={(e) => setEmailSettings({...emailSettings, smtp_port: parseInt(e.target.value)})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="smtp_username">اسم المستخدم</Label>
                      <Input
                        id="smtp_username"
                        value={emailSettings.smtp_username}
                        onChange={(e) => setEmailSettings({...emailSettings, smtp_username: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="smtp_password">كلمة المرور</Label>
                      <Input
                        id="smtp_password"
                        type="password"
                        value={emailSettings.smtp_password}
                        onChange={(e) => setEmailSettings({...emailSettings, smtp_password: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="email_sender">المرسل</Label>
                      <Input
                        id="email_sender"
                        type="email"
                        value={emailSettings.email_sender}
                        onChange={(e) => setEmailSettings({...emailSettings, email_sender: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="email_receiver">المستقبل</Label>
                      <Input
                        id="email_receiver"
                        type="email"
                        value={emailSettings.email_receiver}
                        onChange={(e) => setEmailSettings({...emailSettings, email_receiver: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="space-y-4 pt-4 border-t">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="enable_notifications">تفعيل الإشعارات</Label>
                      <Switch
                        id="enable_notifications"
                        checked={emailSettings.enable_notifications}
                        onCheckedChange={(checked) => setEmailSettings({...emailSettings, enable_notifications: checked})}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="weekly_schedule">تذكير أسبوعي</Label>
                      <Switch
                        id="weekly_schedule"
                        checked={emailSettings.weekly_schedule}
                        onCheckedChange={(checked) => setEmailSettings({...emailSettings, weekly_schedule: checked})}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="monthly_schedule">تذكير شهري</Label>
                      <Switch
                        id="monthly_schedule"
                        checked={emailSettings.monthly_schedule}
                        onCheckedChange={(checked) => setEmailSettings({...emailSettings, monthly_schedule: checked})}
                      />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={saveEmailSettings} className="flex-1">
                      حفظ إعدادات البريد الإلكتروني
                    </Button>
                    <Button onClick={testEmail} variant="outline" className="flex-1">
                      اختبار الإيميل
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Expiry Monitoring & Email Scheduler */}
              <Card className="shadow-elegant">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Clock className="h-5 w-5" />
                    <span>مراقبة انتهاء الصلاحية والتنبيهات التلقائية</span>
                  </CardTitle>
                  <CardDescription>
                    مراقبة تلقائية لانتهاء صلاحية الإقامات والوثائق مع إرسال تنبيهات عبر البريد الإلكتروني
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Current Status */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        <span className="font-medium">إجمالي الموظفين</span>
                      </div>
                      <div className="mt-2">
                        <span className="text-2xl font-bold text-blue-600">{employees.length}</span>
                        <p className="text-sm text-muted-foreground">موظف مسجل</p>
                      </div>
                    </div>

                    <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                        <span className="font-medium">إقامات تنتهي قريباً</span>
                      </div>
                      <div className="mt-2">
                        <span className="text-2xl font-bold text-orange-600">{expiryData.employees.length}</span>
                        <p className="text-sm text-muted-foreground">خلال شهر</p>
                      </div>
                    </div>

                    <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                        <span className="font-medium">وثائق تنتهي قريباً</span>
                      </div>
                      <div className="mt-2">
                        <span className="text-2xl font-bold text-red-600">{expiryData.documents.length}</span>
                        <p className="text-sm text-muted-foreground">خلال شهر</p>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Button
                      onClick={handleCheckExpiry}
                      disabled={isCheckingExpiry}
                      variant="outline"
                      className="flex items-center space-x-2"
                    >
                      <RefreshCw className={`h-4 w-4 ${isCheckingExpiry ? 'animate-spin' : ''}`} />
                      <span>{isCheckingExpiry ? 'جاري الفحص...' : 'فحص انتهاء الصلاحية'}</span>
                    </Button>

                    <Button
                      onClick={handleSendTestEmail}
                      disabled={isSendingEmail || !emailSettings.enable_notifications}
                      variant="default"
                      className="flex items-center space-x-2"
                    >
                      <Mail className="h-4 w-4" />
                      <span>{isSendingEmail ? 'جاري الإرسال...' : 'إرسال تقرير فوري'}</span>
                    </Button>

                    <Button
                      onClick={handleAutoNotifications}
                      disabled={!emailSettings.enable_notifications}
                      variant="secondary"
                      className="flex items-center space-x-2"
                    >
                      <Clock className="h-4 w-4" />
                      <span>تشغيل التنبيهات التلقائية</span>
                    </Button>
                  </div>

                  {/* Last Email Sent */}
                  {lastEmailSent && (
                    <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span className="text-sm font-medium text-green-700 dark:text-green-400">
                          آخر إيميل تم إرساله: {lastEmailSent}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Expiry Details Tables */}
                  {(expiryData.employees.length > 0 || expiryData.documents.length > 0) && (
                    <div className="space-y-6 pt-4 border-t">
                      <h3 className="text-lg font-semibold">تفاصيل انتهاء الصلاحية</h3>

                      {/* Expiring Employees */}
                      {expiryData.employees.length > 0 && (
                        <div className="space-y-3">
                          <h4 className="font-medium text-orange-600">الإقامات التي تنتهي صلاحيتها ({expiryData.employees.length})</h4>
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead className="bg-muted/50">
                                <tr>
                                  <th className="text-right p-2 font-medium">اسم الموظف</th>
                                  <th className="text-right p-2 font-medium">تاريخ انتهاء الإقامة</th>
                                  <th className="text-right p-2 font-medium">المدة المتبقية</th>
                                  <th className="text-right p-2 font-medium">الحالة</th>
                                </tr>
                              </thead>
                              <tbody>
                                {expiryData.employees.slice(0, 5).map((emp, index) => (
                                  <tr key={emp.id} className={index % 2 === 0 ? 'bg-background' : 'bg-muted/25'}>
                                    <td className="p-2 font-medium">{emp.name}</td>
                                    <td className="p-2">
                                      {emp.residency_expiry_date ? new Date(emp.residency_expiry_date).toLocaleDateString('ar-EG') : '-'}
                                    </td>
                                    <td className="p-2">
                                      {Math.abs(emp.daysUntilExpiry)} {emp.daysUntilExpiry < 0 ? 'يوم (منتهية)' : 'يوم'}
                                    </td>
                                    <td className="p-2">
                                      <span className={`px-2 py-1 rounded-full text-xs ${
                                        emp.daysUntilExpiry < 0
                                          ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                                          : emp.daysUntilExpiry <= 7
                                          ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'
                                          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                                      }`}>
                                        {emp.daysUntilExpiry < 0 ? 'منتهية' : emp.daysUntilExpiry <= 7 ? 'خطر' : 'تحذير'}
                                      </span>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                            {expiryData.employees.length > 5 && (
                              <p className="text-xs text-muted-foreground mt-2">
                                وعرض {expiryData.employees.length - 5} إقامة أخرى في التقرير الكامل
                              </p>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Expiring Documents */}
                      {expiryData.documents.length > 0 && (
                        <div className="space-y-3">
                          <h4 className="font-medium text-red-600">الوثائق التي تنتهي صلاحيتها ({expiryData.documents.length})</h4>
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead className="bg-muted/50">
                                <tr>
                                  <th className="text-right p-2 font-medium">اسم الوثيقة</th>
                                  <th className="text-right p-2 font-medium">الموظف</th>
                                  <th className="text-right p-2 font-medium">تاريخ الانتهاء</th>
                                  <th className="text-right p-2 font-medium">المدة المتبقية</th>
                                  <th className="text-right p-2 font-medium">الحالة</th>
                                </tr>
                              </thead>
                              <tbody>
                                {expiryData.documents.slice(0, 5).map((doc, index) => (
                                  <tr key={doc.id} className={index % 2 === 0 ? 'bg-background' : 'bg-muted/25'}>
                                    <td className="p-2 font-medium">{doc.title}</td>
                                    <td className="p-2">{doc.employee?.name || '-'}</td>
                                    <td className="p-2">
                                      {doc.expiry_date ? new Date(doc.expiry_date).toLocaleDateString('ar-EG') : '-'}
                                    </td>
                                    <td className="p-2">
                                      {Math.abs(doc.daysUntilExpiry)} {doc.daysUntilExpiry < 0 ? 'يوم (منتهية)' : 'يوم'}
                                    </td>
                                    <td className="p-2">
                                      <span className={`px-2 py-1 rounded-full text-xs ${
                                        doc.daysUntilExpiry < 0
                                          ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                                          : doc.daysUntilExpiry <= 7
                                          ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'
                                          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                                      }`}>
                                        {doc.daysUntilExpiry < 0 ? 'منتهية' : doc.daysUntilExpiry <= 7 ? 'خطر' : 'تحذير'}
                                      </span>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                            {expiryData.documents.length > 5 && (
                              <p className="text-xs text-muted-foreground mt-2">
                                وعرض {expiryData.documents.length - 5} وثيقة أخرى في التقرير الكامل
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Email Configuration Note */}
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">ملاحظة مهمة حول إعدادات البريد الإلكتروني</h4>
                    <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                      <li>• تأكد من صحة إعدادات SMTP قبل تفعيل الإشعارات التلقائية</li>
                      <li>• يتم إرسال التنبيهات التلقائية عند:</li>
                      <li className="mr-4">- بقاء شهر على انتهاء الصلاحية</li>
                      <li className="mr-4">- بقاء أسبوع على انتهاء الصلاحية</li>
                      <li className="mr-4">- انتهاء الصلاحية فعلياً</li>
                      <li>• يمكن إرسال تقرير فوري في أي وقت باستخدام زر "إرسال تقرير فوري"</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Appearance Settings */}
            <TabsContent value="appearance" className="space-y-6">
              <Card className="shadow-elegant">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    {darkMode ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
                    <span>إعدادات المظهر</span>
                  </CardTitle>
                  <CardDescription>
                    تخصيص مظهر النظام والثيم المفضل
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="dark-mode">الوضع المظلم</Label>
                      <p className="text-sm text-muted-foreground">
                        تفعيل أو إلغاء تفعيل الوضع المظلم
                      </p>
                    </div>
                    <Switch
                      id="dark-mode"
                      checked={darkMode}
                      onCheckedChange={toggleDarkMode}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Companies Management */}
            <TabsContent value="companies" className="space-y-6">
              <Card className="shadow-elegant">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Building2 className="h-5 w-5" />
                    <span>إدارة الشركات</span>
                  </CardTitle>
                  <CardDescription>
                    إضافة وإدارة الشركات في النظام
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="company_name_ar">الاسم بالعربية</Label>
                      <Input
                        id="company_name_ar"
                        value={newCompany.name_ar}
                        onChange={(e) => setNewCompany({...newCompany, name_ar: e.target.value})}
                        placeholder="أدخل اسم الشركة بالعربية"
                      />
                    </div>
                    <div>
                      <Label htmlFor="company_name_en">الاسم بالإنجليزية</Label>
                      <Input
                        id="company_name_en"
                        value={newCompany.name}
                        onChange={(e) => setNewCompany({...newCompany, name: e.target.value})}
                        placeholder="Enter company name in English"
                      />
                    </div>
                    <div className="flex items-end">
                      <Button onClick={addCompany} className="w-full">
                        إضافة شركة
                      </Button>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="company_description">الوصف (اختياري)</Label>
                    <Textarea
                      id="company_description"
                      value={newCompany.description}
                      onChange={(e) => setNewCompany({...newCompany, description: e.target.value})}
                      placeholder="أدخل وصف الشركة"
                    />
                  </div>

                  <div className="pt-4 border-t">
                    <h3 className="font-semibold mb-3">الشركات الحالية ({companies.length})</h3>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {companies.map((company) => (
                        <div key={company.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                          <div className="flex-1">
                            <p className="font-medium">{company.name_ar}</p>
                            <p className="text-sm text-muted-foreground">{company.name}</p>
                          </div>
                          <div className="flex space-x-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => setEditingCompany(company)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => deleteCompany(company)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Document Types Management */}
            <TabsContent value="documents" className="space-y-6">
              <Card className="shadow-elegant">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <FileText className="h-5 w-5" />
                    <span>إدارة أنواع الوثائق</span>
                  </CardTitle>
                  <CardDescription>
                    إضافة وإدارة أنواع الوثائق المختلفة
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="doc_name_en">الاسم بالإنجليزية</Label>
                      <Input
                        id="doc_name_en"
                        value={newDocType.name}
                        onChange={(e) => setNewDocType({...newDocType, name: e.target.value})}
                        placeholder="Document Type"
                      />
                    </div>
                    <div>
                      <Label htmlFor="doc_name_ar">الاسم بالعربية</Label>
                      <Input
                        id="doc_name_ar"
                        value={newDocType.name_ar}
                        onChange={(e) => setNewDocType({...newDocType, name_ar: e.target.value})}
                        placeholder="نوع الوثيقة"
                      />
                    </div>
                    <div className="flex items-end">
                      <Button onClick={addDocumentType} className="w-full">
                        إضافة نوع وثيقة
                      </Button>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <h3 className="font-semibold mb-3">أنواع الوثائق الحالية ({documentTypes.length})</h3>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {documentTypes.map((docType) => (
                        <div key={docType.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                          <div className="flex-1">
                            <p className="font-medium">{docType.name_ar}</p>
                            <p className="text-sm text-muted-foreground">{docType.name}</p>
                          </div>
                          <div className="flex space-x-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => setEditingDocType(docType)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => deleteDocumentType(docType)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Ministries Management */}
            <TabsContent value="ministries" className="space-y-6">
              <Card className="shadow-elegant">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Shield className="h-5 w-5" />
                    <span>إدارة الوزارات</span>
                  </CardTitle>
                  <CardDescription>
                    إضافة وإدارة الوزارات والجهات الحكومية
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="ministry_name_en">الاسم بالإنجليزية</Label>
                      <Input
                        id="ministry_name_en"
                        value={newMinistry.name}
                        onChange={(e) => setNewMinistry({...newMinistry, name: e.target.value})}
                        placeholder="Ministry Name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="ministry_name_ar">الاسم بالعربية</Label>
                      <Input
                        id="ministry_name_ar"
                        value={newMinistry.name_ar}
                        onChange={(e) => setNewMinistry({...newMinistry, name_ar: e.target.value})}
                        placeholder="اسم الوزارة"
                      />
                    </div>
                    <div className="flex items-end">
                      <Button onClick={addMinistry} className="w-full">
                        إضافة وزارة
                      </Button>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <h3 className="font-semibold mb-3">الوزارات الحالية ({ministries.length})</h3>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {ministries.map((ministry) => (
                        <div key={ministry.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                          <div className="flex-1">
                            <p className="font-medium">{ministry.name_ar}</p>
                            <p className="text-sm text-muted-foreground">{ministry.name}</p>
                          </div>
                          <div className="flex space-x-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => setEditingMinistry(ministry)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => deleteMinistry(ministry)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Backup & Restore */}
            <TabsContent value="backup" className="space-y-6">
              <Card className="shadow-elegant">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Database className="h-5 w-5" />
                    <span>النسخ الاحتياطي واستعادة البيانات</span>
                  </CardTitle>
                  <CardDescription>
                    إنشاء نسخ احتياطية واستعادة البيانات
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">النسخ الاحتياطي</h3>
                      <p className="text-sm text-muted-foreground">
                        تصدير جميع بيانات النظام إلى ملف JSON
                      </p>
                      <Button onClick={exportBackup} className="w-full">
                        <Download className="h-4 w-4 ml-2" />
                        تصدير نسخة احتياطية
                      </Button>
                    </div>
                    
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">استعادة البيانات</h3>
                      <p className="text-sm text-muted-foreground">
                        استيراد البيانات من ملف نسخة احتياطية
                      </p>
                      <div className="space-y-2">
                        <Input type="file" accept=".json" />
                        <Button className="w-full" variant="outline">
                          <Upload className="h-4 w-4 ml-2" />
                          استيراد نسخة احتياطية
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <h3 className="text-lg font-semibold mb-3">النسخ التلقائية</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div>
                          <p className="font-medium">نسخ احتياطية يومية</p>
                          <p className="text-sm text-muted-foreground">الاحتفاظ بآخر نسختين فقط</p>
                        </div>
                        <Switch defaultChecked />
                      </div>
                      <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div>
                          <p className="font-medium">إشعارات النسخ الاحتياطي</p>
                          <p className="text-sm text-muted-foreground">إرسال تأكيد عبر البريد الإلكتروني</p>
                        </div>
                        <Switch defaultChecked />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>

        {/* Edit Company Dialog */}
        <Dialog open={!!editingCompany} onOpenChange={() => setEditingCompany(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>تعديل الشركة</DialogTitle>
              <DialogDescription>تحديث بيانات الشركة</DialogDescription>
            </DialogHeader>
            {editingCompany && (
              <div className="space-y-4">
                <div>
                  <Label>الاسم بالعربية</Label>
                  <Input
                    value={editingCompany.name_ar}
                    onChange={(e) => setEditingCompany({...editingCompany, name_ar: e.target.value})}
                  />
                </div>
                <div>
                  <Label>الاسم بالإنجليزية</Label>
                  <Input
                    value={editingCompany.name}
                    onChange={(e) => setEditingCompany({...editingCompany, name: e.target.value})}
                  />
                </div>
                <div>
                  <Label>الوصف</Label>
                  <Textarea
                    value={editingCompany.description || ''}
                    onChange={(e) => setEditingCompany({...editingCompany, description: e.target.value})}
                  />
                </div>
                <Button onClick={updateCompany} className="w-full">
                  حفظ التغييرات
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Edit Document Type Dialog */}
        <Dialog open={!!editingDocType} onOpenChange={() => setEditingDocType(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>تعديل نوع الوثيقة</DialogTitle>
              <DialogDescription>تحديث بيانات نوع الوثيقة</DialogDescription>
            </DialogHeader>
            {editingDocType && (
              <div className="space-y-4">
                <div>
                  <Label>الاسم بالعربية</Label>
                  <Input
                    value={editingDocType.name_ar}
                    onChange={(e) => setEditingDocType({...editingDocType, name_ar: e.target.value})}
                  />
                </div>
                <div>
                  <Label>الاسم بالإنجليزية</Label>
                  <Input
                    value={editingDocType.name}
                    onChange={(e) => setEditingDocType({...editingDocType, name: e.target.value})}
                  />
                </div>
                <Button onClick={updateDocumentType} className="w-full">
                  حفظ التغييرات
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Edit Ministry Dialog */}
        <Dialog open={!!editingMinistry} onOpenChange={() => setEditingMinistry(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>تعديل الوزارة</DialogTitle>
              <DialogDescription>تحديث بيانات الوزارة</DialogDescription>
            </DialogHeader>
            {editingMinistry && (
              <div className="space-y-4">
                <div>
                  <Label>الاسم بالعربية</Label>
                  <Input
                    value={editingMinistry.name_ar}
                    onChange={(e) => setEditingMinistry({...editingMinistry, name_ar: e.target.value})}
                  />
                </div>
                <div>
                  <Label>الاسم بالإنجليزية</Label>
                  <Input
                    value={editingMinistry.name}
                    onChange={(e) => setEditingMinistry({...editingMinistry, name: e.target.value})}
                  />
                </div>
                <Button onClick={updateMinistry} className="w-full">
                  حفظ التغييرات
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}