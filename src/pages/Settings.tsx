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
import { jsonDatabase } from '@/lib/jsonDatabase';
import { Layout } from '@/components/Layout';
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
    smtp_server: 'smtp.gmail.com',
    smtp_port: 587,
    smtp_username: 'Dr.vet.waleedtam@gmail.com',
    smtp_password: 'vsrf hfav glbr ggqh',
    email_sender: 'dr.vet.waleedtam@gmail.com',
    email_receiver: 'Dr.vet.waleedtam@gmail.com',
    enable_notifications: true,
    weekly_schedule: true,
    monthly_schedule: true
  });
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
      const [companiesResult, docTypesResult, ministriesResult] = await Promise.all([
        jsonDatabase.from('companies').select('*').order('name', 'asc').execute(),
        jsonDatabase.from('document_types').select('*').order('name_ar', 'asc').execute(),
        jsonDatabase.from('ministries').select('*').order('name_ar', 'asc').execute()
      ]);

      setCompanies(companiesResult.data || []);
      setDocumentTypes(docTypesResult.data || []);
      setMinistries(ministriesResult.data || []);
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

  const testEmail = async () => {
    try {
      const { error } = await supabase.functions.invoke('send-email-notification', {
        body: {
          type: 'test',
          emailSettings: emailSettings,
          testData: {
            documents: [
              {
                title: 'وثيقة اختبار',
                document_type: 'رخصة قيادة',
                expiry_date: '2025-02-15',
                days_remaining: 45
              }
            ]
          }
        }
      });

      if (error) throw error;

      toast({
        title: 'تم بنجاح',
        description: 'تم إرسال ايميل الاختبار'
      });
    } catch (error) {
      console.error('Error sending test email:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في إرسال ايميل الاختبار',
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