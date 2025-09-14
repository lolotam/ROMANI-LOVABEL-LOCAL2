import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { jsonDatabase } from '@/lib/jsonDatabase';
import { Layout } from '@/components/Layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DateInput } from '@/components/ui/date-input';
import {
  Users,
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  Calendar,
  Building2,
  UserCheck,
  FileText,
  ChevronUp,
  ChevronDown,
  Download,
  FileSpreadsheet,
  FileJson,
  User
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

type PositionType = 'مدير' | 'مندوب طبي' | 'مندوب شؤون' | 'سائق' | 'محاسب' | 'سكرتير';

interface Employee {
  id: string;
  name: string;
  email?: string;
  mobile_no?: string;
  position?: PositionType;
  hire_date?: string;
  birth_date?: string;
  civil_id_no?: string;
  residency_expiry_date?: string;
  residency_status?: 'expired' | 'less_than_week' | 'less_than_month' | 'valid';
  company_id: string;
  created_at: string;
  is_active?: boolean;
  companies?: {
    name: string;
    name_ar: string;
  };
}

interface Company {
  id: string;
  name: string;
  name_ar: string;
}

type SortField = 'name' | 'position' | 'hire_date' | 'birth_date' | 'civil_id_no' | 'mobile_no' | 'residency_expiry_date';
type SortDirection = 'asc' | 'desc';

export default function Employees() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCompany, setSelectedCompany] = useState<string>('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [viewEmployee, setViewEmployee] = useState<Employee | null>(null);
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const { toast } = useToast();
  const navigate = useNavigate();



  // Helper function to convert date from storage format (yyyy-mm-dd) to HTML5 date input format (yyyy-mm-dd)
  const formatDateForInput = (dateString: string): string => {
    if (!dateString) return '';
    // If date is already in yyyy-mm-dd format, return as is
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      return dateString;
    }
    // If date is in dd/mm/yyyy format, convert to yyyy-mm-dd
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateString)) {
      const parts = dateString.split('/');
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return dateString;
  };

  // Helper function to format date for display in dd-mm-yyyy format
  const formatDateForDisplay = (dateString: string): string => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      // Check if date is valid
      if (isNaN(date.getTime())) return '';

      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();

      return `${day}-${month}-${year}`;
    } catch (error) {
      return '';
    }
  };

  // Safeguard current sort state
  const currentSortField: SortField = sortField ?? 'name';
  const currentSortDirection: SortDirection = sortDirection ?? 'asc';

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobile_no: '',
    position: '' as PositionType | '',
    hire_date: '',
    birth_date: '',
    civil_id_no: '',
    residency_expiry_date: '',
    company_id: '',
    is_active: true
  });

  const positionOptions: PositionType[] = ['مدير', 'مندوب طبي', 'مندوب شؤون', 'سائق', 'محاسب', 'سكرتير'];

  useEffect(() => {
    fetchEmployees();
    fetchCompanies();
  }, []);

  const fetchEmployees = async () => {
    try {
      const { data, error } = await jsonDatabase
        .from('employees')
        .select(`
          *,
          companies (
            name,
            name_ar
          )
        `)
        .order('created_at', 'desc')
        .execute();

      if (error) throw error;
      setEmployees(data || []);
    } catch (error) {
      console.error('Error fetching employees:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في تحميل بيانات الموظفين',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCompanies = async () => {
    try {
      const { data, error } = await jsonDatabase
        .from('companies')
        .select('*')
        .order('name', 'asc')
        .execute();

      if (error) throw error;
      setCompanies(data || []);
    } catch (error) {
      console.error('Error fetching companies:', error);
    }
  };

  const filteredAndSortedEmployees = useMemo(() => {
    let filtered = employees.filter(employee => {
      const matchesSearch = employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           employee.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           employee.mobile_no?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           employee.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           employee.position?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCompany = selectedCompany === 'all' || employee.company_id === selectedCompany;

      return matchesSearch && matchesCompany;
    });

    filtered.sort((a, b) => {
      let aValue = a[currentSortField as keyof Employee] as any;
      let bValue = b[currentSortField as keyof Employee] as any;

      if (currentSortField === 'hire_date' || currentSortField === 'birth_date' || currentSortField === 'residency_expiry_date') {
        aValue = new Date(aValue || 0).getTime().toString();
        bValue = new Date(bValue || 0).getTime().toString();
      } else {
        aValue = (aValue || '').toString().toLowerCase();
        bValue = (bValue || '').toString().toLowerCase();
      }

      return currentSortDirection === 'asc' ? (aValue > bValue ? 1 : -1) : (aValue < bValue ? 1 : -1);
    });

    return filtered;
  }, [employees, searchTerm, selectedCompany, currentSortField, currentSortDirection]);

  const handleSort = (field: SortField) => {
    if (currentSortField === field) {
      setSortDirection(currentSortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      mobile_no: '',
      position: '' as PositionType | '',
      hire_date: '',
      birth_date: '',
      civil_id_no: '',
      residency_expiry_date: '',
      company_id: '',
      is_active: true
    });
  };

  const calculateResidencyStatus = (expiryDate: string | undefined): 'expired' | 'less_than_week' | 'less_than_month' | 'valid' | undefined => {
    if (!expiryDate) return undefined;

    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'expired';
    if (diffDays <= 7) return 'less_than_week';
    if (diffDays <= 30) return 'less_than_month';
    return 'valid';
  };

  const getResidencyStatusBadge = (status: string | undefined) => {
    switch(status) {
      case 'expired':
        return <Badge className="bg-red-500 text-white">منتهية</Badge>;
      case 'less_than_week':
        return <Badge className="bg-orange-500 text-white">أقل من أسبوع</Badge>;
      case 'less_than_month':
        return <Badge className="bg-yellow-500 text-white">أقل من شهر</Badge>;
      case 'valid':
        return <Badge className="bg-green-500 text-white">سارية</Badge>;
      default:
        return <Badge variant="outline">غير محدد</Badge>;
    }
  };

  const handleViewEmployee = (employee: Employee) => {
    setViewEmployee(employee);
    setIsViewDialogOpen(true);
  };

  const handleAddEmployee = async () => {
    if (!formData.name || !formData.company_id) {
      toast({
        title: 'خطأ',
        description: 'يرجى ملء جميع الحقول المطلوبة',
        variant: 'destructive'
      });
      return;
    }

    try {
      const insertData = {
        ...formData,
        position: formData.position as PositionType | undefined,
        birth_date: formData.birth_date,
        hire_date: formData.hire_date,
        residency_expiry_date: formData.residency_expiry_date
      };

      const { error } = await jsonDatabase.insert('employees', [insertData]);

      if (error) throw error;

      toast({
        title: 'تم بنجاح',
        description: 'تم إضافة الموظف بنجاح'
      });

      setIsAddDialogOpen(false);
      resetForm();
      fetchEmployees();
    } catch (error) {
      console.error('Error adding employee:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في إضافة الموظف',
        variant: 'destructive'
      });
    }
  };

  const handleEditEmployee = async () => {
    if (!selectedEmployee) return;

    try {
      const updateData = {
        ...formData,
        position: formData.position as PositionType | undefined,
        birth_date: formData.birth_date,
        hire_date: formData.hire_date,
        residency_expiry_date: formData.residency_expiry_date
      };

      const { error } = await jsonDatabase.update('employees', selectedEmployee.id, updateData);

      if (error) throw error;

      toast({
        title: 'تم بنجاح',
        description: 'تم تحديث بيانات الموظف بنجاح'
      });

      setIsEditDialogOpen(false);
      setSelectedEmployee(null);
      fetchEmployees();
    } catch (error) {
      console.error('Error updating employee:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في تحديث بيانات الموظف',
        variant: 'destructive'
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الموظف؟')) return;

    try {
      const { error } = await jsonDatabase.delete('employees', id);

      if (error) throw error;

      toast({
        title: 'تم بنجاح',
        description: 'تم حذف الموظف بنجاح'
      });

      fetchEmployees();
    } catch (error) {
      console.error('Error deleting employee:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في حذف الموظف',
        variant: 'destructive'
      });
    }
  };

  const openEditDialog = (employee: Employee) => {
    setSelectedEmployee(employee);
    setFormData({
      name: employee.name,
      email: employee.email || '',
      phone: employee.phone || '',
      mobile_no: employee.mobile_no || '',
      position: employee.position || '' as PositionType | '',
      hire_date: formatDateForInput(employee.hire_date || ''),
      birth_date: formatDateForInput(employee.birth_date || ''),
      civil_id_no: employee.civil_id_no || '',
      residency_expiry_date: formatDateForInput(employee.residency_expiry_date || ''),
      company_id: employee.company_id,
      is_active: employee.is_active !== undefined ? employee.is_active : true
    });
    setIsEditDialogOpen(true);
  };

  const handleViewDocuments = (employeeId: string) => {
    navigate(`/documents/employee/${employeeId}`);
  };

  const exportToCSV = () => {
    try {
      const headers = ['الاسم', 'البريد الإلكتروني', 'رقم الهاتف', 'رقم الجوال', 'المنصب', 'الشركة', 'الرقم المدني', 'تاريخ الميلاد', 'تاريخ التوظيف', 'تاريخ انتهاء الإقامة'];
      const data = filteredAndSortedEmployees.map(emp => [
        emp.name,
        emp.email || '',
        emp.phone || '',
        emp.mobile_no || '',
        emp.position || '',
        emp.companies?.name || '',
        emp.civil_id_no || '',
        emp.birth_date || '',
        emp.hire_date || '',
        emp.residency_expiry_date || ''
      ]);

      const csvContent = [
        headers.join(','),
        ...data.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');

      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `employees_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();

      toast({
        title: 'تم التصدير بنجاح',
        description: 'تم تصدير بيانات الموظفين إلى ملف CSV'
      });
    } catch (error) {
      console.error('Error exporting to CSV:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في تصدير البيانات',
        variant: 'destructive'
      });
    }
  };

  const exportToJSON = () => {
    try {
      const dataToExport = filteredAndSortedEmployees.map(emp => ({
        name: emp.name,
        email: emp.email,
        phone: emp.phone,
        mobile_no: emp.mobile_no,
        position: emp.position,
        company: emp.companies?.name,
        civil_id_no: emp.civil_id_no,
        birth_date: emp.birth_date,
        hire_date: emp.hire_date,
        residency_expiry_date: emp.residency_expiry_date
      }));

      const jsonContent = JSON.stringify(dataToExport, null, 2);
      const blob = new Blob([jsonContent], { type: 'application/json' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `employees_${new Date().toISOString().split('T')[0]}.json`;
      link.click();

      toast({
        title: 'تم التصدير بنجاح',
        description: 'تم تصدير بيانات الموظفين إلى ملف JSON'
      });
    } catch (error) {
      console.error('Error exporting to JSON:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في تصدير البيانات',
        variant: 'destructive'
      });
    }
  };

  const getSortIcon = (field: SortField) => {
    if (currentSortField !== field) {
      return <ChevronUp className="h-4 w-4 opacity-30" />;
    }
    return currentSortDirection === 'asc' ? 
      <ChevronUp className="h-4 w-4" /> : 
      <ChevronDown className="h-4 w-4" />;
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
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
        >
          <div>
            <h1 className="text-3xl font-bold text-gradient">إدارة الموظفين</h1>
            <p className="text-muted-foreground">
              إجمالي {employees.length} موظف مسجل
            </p>
          </div>
          <div className="flex gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="shadow-soft hover:shadow-elegant transition-all">
                  <Download className="h-4 w-4 ml-2" />
                  تصدير البيانات
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={exportToCSV}>
                  <FileSpreadsheet className="h-4 w-4 ml-2" />
                  تصدير كـ CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={exportToJSON}>
                  <FileJson className="h-4 w-4 ml-2" />
                  تصدير كـ JSON
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="shadow-elegant hover:shadow-glow transition-all">
                  <Plus className="h-4 w-4 ml-2" />
                  إضافة موظف جديد
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>إضافة موظف جديد</DialogTitle>
                  <DialogDescription>
                    أدخل بيانات الموظف الجديد
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">الاسم *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="company_id">الشركة *</Label>
                      <Select
                        value={formData.company_id}
                        onValueChange={(value) => setFormData({...formData, company_id: value})}
                        required
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="اختر الشركة" />
                        </SelectTrigger>
                        <SelectContent>
                          {companies.map((company) => (
                            <SelectItem key={company.id} value={company.id}>
                              {company.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="position">المنصب</Label>
                      <Select
                        value={formData.position}
                        onValueChange={(value) => setFormData({...formData, position: value as PositionType})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="اختر المنصب" />
                        </SelectTrigger>
                        <SelectContent>
                          {positionOptions.map((position) => (
                            <SelectItem key={position} value={position}>
                              {position}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="email">البريد الإلكتروني</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="mobile_no">رقم الجوال</Label>
                      <Input
                        id="mobile_no"
                        value={formData.mobile_no}
                        onChange={(e) => setFormData({...formData, mobile_no: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="birth_date">تاريخ الميلاد (dd/mm/yyyy)</Label>
                      <DateInput
                        value={formData.birth_date}
                        onChange={(value) => setFormData({...formData, birth_date: value})}
                        name="birth_date"
                      />
                    </div>
                    <div>
                      <Label htmlFor="civil_id_no">الرقم المدني</Label>
                      <Input
                        id="civil_id_no"
                        value={formData.civil_id_no}
                        onChange={(e) => setFormData({...formData, civil_id_no: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="residency_expiry_date">تاريخ انتهاء الإقامة (dd/mm/yyyy)</Label>
                      <DateInput
                        value={formData.residency_expiry_date}
                        onChange={(value) => setFormData({...formData, residency_expiry_date: value})}
                        name="residency_expiry_date"
                      />
                    </div>
                    <div>
                      <Label htmlFor="hire_date">تاريخ التوظيف (dd/mm/yyyy)</Label>
                      <DateInput
                        value={formData.hire_date}
                        onChange={(value) => setFormData({...formData, hire_date: value})}
                        name="hire_date"
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Label htmlFor="add-is_active">حالة الموظف</Label>
                      <Switch
                        id="add-is_active"
                        checked={formData.is_active}
                        onCheckedChange={(checked) => setFormData({...formData, is_active: checked})}
                      />
                      <span className="text-sm text-muted-foreground">
                        {formData.is_active ? "نشط" : "غير نشط"}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2 pt-4">
                    <Button onClick={handleAddEmployee} className="flex-1">
                      إضافة الموظف
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                      إلغاء
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </motion.div>

        {/* Filters and Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="shadow-soft">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <Label htmlFor="search">البحث</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="search"
                      placeholder="البحث بالاسم، البريد الإلكتروني، الجوال، أو المنصب..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="w-full sm:w-48">
                  <Label htmlFor="company-filter">تصفية بالشركة</Label>
                  <Select value={selectedCompany} onValueChange={setSelectedCompany}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">جميع الشركات</SelectItem>
                      {companies.map((company) => (
                        <SelectItem key={company.id} value={company.id}>
                          {company.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Employees Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="shadow-elegant">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border/50">
                      <TableHead className="w-[70px] text-right">الرقم</TableHead>
                      <TableHead
                        className="cursor-pointer hover:bg-accent/50 transition-colors"
                        onClick={() => handleSort('name')}
                      >
                        <div className="flex items-center space-x-2">
                          <span>الاسم</span>
                          {getSortIcon('name')}
                        </div>
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-accent/50 transition-colors"
                        onClick={() => handleSort('position')}
                      >
                        <div className="flex items-center space-x-2">
                          <span>المنصب</span>
                          {getSortIcon('position')}
                        </div>
                      </TableHead>
                      <TableHead>الشركة</TableHead>
                      <TableHead
                        className="cursor-pointer hover:bg-accent/50 transition-colors"
                        onClick={() => handleSort('mobile_no')}
                      >
                        <div className="flex items-center space-x-2">
                          <span>رقم الجوال</span>
                          {getSortIcon('mobile_no')}
                        </div>
                      </TableHead>
                      <TableHead
                        className="cursor-pointer hover:bg-accent/50 transition-colors"
                        onClick={() => handleSort('civil_id_no')}
                      >
                        <div className="flex items-center space-x-2">
                          <span>الرقم المدني</span>
                          {getSortIcon('civil_id_no')}
                        </div>
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-accent/50 transition-colors"
                        onClick={() => handleSort('birth_date')}
                      >
                        <div className="flex items-center space-x-2">
                          <span>تاريخ الميلاد</span>
                          {getSortIcon('birth_date')}
                        </div>
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-accent/50 transition-colors"
                        onClick={() => handleSort('hire_date')}
                      >
                        <div className="flex items-center space-x-2">
                          <span>تاريخ التوظيف</span>
                          {getSortIcon('hire_date')}
                        </div>
                      </TableHead>
                      <TableHead
                        className="cursor-pointer hover:bg-accent/50 transition-colors"
                        onClick={() => handleSort('residency_expiry_date')}
                      >
                        <div className="flex items-center space-x-2">
                          <span>تاريخ انتهاء الإقامة</span>
                          {getSortIcon('residency_expiry_date')}
                        </div>
                      </TableHead>
                      <TableHead>حالة الإقامة</TableHead>
                      <TableHead>حالة الموظف</TableHead>
                      <TableHead>الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAndSortedEmployees.map((employee, index) => (
                      <TableRow key={employee.id} className="hover:bg-accent/30 transition-colors">
                        <TableCell className="text-right font-medium">{index + 1}</TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-medium">{employee.name}</div>
                            <div className="text-sm text-muted-foreground">{employee.email}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {employee.position && (
                            <Badge variant="outline">{employee.position}</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                            <span>{employee.companies?.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {employee.mobile_no ? (
                            <div className="flex items-center space-x-2">
                              <span>{employee.mobile_no}</span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">غير محدد</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {employee.civil_id_no ? (
                            <div className="flex items-center space-x-2">
                              <UserCheck className="h-4 w-4 text-muted-foreground" />
                              <span>{employee.civil_id_no}</span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">غير محدد</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {employee.birth_date ? (
                            <div className="flex items-center space-x-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <span>{formatDateForDisplay(employee.birth_date)}</span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">غير محدد</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {employee.hire_date ? (
                            <div className="flex items-center space-x-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <span>{formatDateForDisplay(employee.hire_date)}</span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">غير محدد</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {employee.residency_expiry_date ? (
                            <div className="flex items-center space-x-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <span className={`${new Date(employee.residency_expiry_date) < new Date() ? 'text-red-500' : new Date(employee.residency_expiry_date) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) ? 'text-orange-500' : 'text-green-600'}`}>
                                {formatDateForDisplay(employee.residency_expiry_date)}
                              </span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">غير محدد</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {getResidencyStatusBadge(calculateResidencyStatus(employee.residency_expiry_date))}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={employee.is_active !== false ? "default" : "destructive"}
                            className={employee.is_active !== false ? "bg-blue-500 hover:bg-blue-600" : "bg-red-500 hover:bg-red-600"}
                          >
                            {employee.is_active !== false ? "نشط" : "غير نشط"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewEmployee(employee)}
                              title="عرض الملف الشخصي"
                              className="hover:bg-primary hover:text-primary-foreground"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewDocuments(employee.id)}
                              title="عرض الوثائق"
                              className="hover:bg-blue-600 hover:text-white"
                            >
                              <FileText className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditDialog(employee)}
                              title="تعديل"
                              className="hover:bg-accent"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(employee.id)}
                              className="hover:bg-destructive hover:text-destructive-foreground"
                              title="حذف"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>تعديل بيانات الموظف</DialogTitle>
              <DialogDescription>
                تعديل بيانات الموظف المحدد
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
              <div>
                <Label htmlFor="edit-name">الاسم *</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit-company_id">الشركة *</Label>
                <Select
                  value={formData.company_id}
                  onValueChange={(value) => setFormData({...formData, company_id: value})}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر الشركة" />
                  </SelectTrigger>
                  <SelectContent>
                    {companies.map((company) => (
                      <SelectItem key={company.id} value={company.id}>
                        {company.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-position">المنصب</Label>
                <Select
                  value={formData.position}
                  onValueChange={(value) => setFormData({...formData, position: value as PositionType})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر المنصب" />
                  </SelectTrigger>
                  <SelectContent>
                    {positionOptions.map((position) => (
                      <SelectItem key={position} value={position}>
                        {position}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-email">البريد الإلكتروني</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="edit-mobile_no">رقم الجوال</Label>
                <Input
                  id="edit-mobile_no"
                  value={formData.mobile_no}
                  onChange={(e) => setFormData({...formData, mobile_no: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="edit-birth_date">تاريخ الميلاد (dd/mm/yyyy)</Label>
                <DateInput
                  value={formData.birth_date}
                  onChange={(value) => setFormData({...formData, birth_date: value})}
                  name="edit-birth_date"
                />
              </div>
              <div>
                <Label htmlFor="edit-civil_id_no">الرقم المدني</Label>
                <Input
                  id="edit-civil_id_no"
                  value={formData.civil_id_no}
                  onChange={(e) => setFormData({...formData, civil_id_no: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="edit-residency_expiry_date">تاريخ انتهاء الإقامة (dd/mm/yyyy)</Label>
                <DateInput
                  value={formData.residency_expiry_date}
                  onChange={(value) => setFormData({...formData, residency_expiry_date: value})}
                  name="edit-residency_expiry_date"
                />
              </div>
              <div>
                <Label htmlFor="edit-hire_date">تاريخ التوظيف (dd/mm/yyyy)</Label>
                <DateInput
                  value={formData.hire_date}
                  onChange={(value) => setFormData({...formData, hire_date: value})}
                  name="edit-hire_date"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Label htmlFor="edit-is_active">حالة الموظف</Label>
                <Switch
                  id="edit-is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({...formData, is_active: checked})}
                />
                <span className="text-sm text-muted-foreground">
                  {formData.is_active ? "نشط" : "غير نشط"}
                </span>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                إلغاء
              </Button>
              <Button onClick={handleEditEmployee}>
                حفظ التغييرات
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* View Employee Dialog */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl">الملف الشخصي للموظف</DialogTitle>
              <DialogDescription>
                عرض تفاصيل الموظف
              </DialogDescription>
            </DialogHeader>
            {viewEmployee && (
              <div className="space-y-6">
                {/* Employee Header */}
                <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg">
                  <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center">
                    <User className="h-8 w-8 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold">{viewEmployee.name}</h3>
                    <p className="text-muted-foreground">
                      {viewEmployee.position} - {viewEmployee.companies?.name}
                    </p>
                  </div>
                </div>

                {/* Employee Information Tabs */}
                <Tabs defaultValue="personal" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="personal">المعلومات الشخصية</TabsTrigger>
                    <TabsTrigger value="work">معلومات العمل</TabsTrigger>
                    <TabsTrigger value="residency">معلومات الإقامة</TabsTrigger>
                  </TabsList>

                  <TabsContent value="personal" className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">البيانات الشخصية</CardTitle>
                      </CardHeader>
                      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-muted-foreground">الاسم الكامل</Label>
                          <p className="font-medium">{viewEmployee.name}</p>
                        </div>
                        {viewEmployee.email && (
                          <div className="space-y-2">
                            <Label className="text-muted-foreground">البريد الإلكتروني</Label>
                            <p className="font-medium">{viewEmployee.email}</p>
                          </div>
                        )}
                        {viewEmployee.mobile_no && (
                          <div className="space-y-2">
                            <Label className="text-muted-foreground">رقم الجوال</Label>
                            <p className="font-medium">{viewEmployee.mobile_no}</p>
                          </div>
                        )}
                        {viewEmployee.civil_id_no && (
                          <div className="space-y-2">
                            <Label className="text-muted-foreground">الرقم المدني</Label>
                            <p className="font-medium">{viewEmployee.civil_id_no}</p>
                          </div>
                        )}
                        {viewEmployee.birth_date && (
                          <div className="space-y-2">
                            <Label className="text-muted-foreground">تاريخ الميلاد</Label>
                            <p className="font-medium">
                              {formatDateForDisplay(viewEmployee.birth_date)}
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="work" className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">معلومات العمل</CardTitle>
                      </CardHeader>
                      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-muted-foreground">الشركة</Label>
                          <p className="font-medium">{viewEmployee.companies?.name}</p>
                        </div>
                        {viewEmployee.position && (
                          <div className="space-y-2">
                            <Label className="text-muted-foreground">المنصب</Label>
                            <Badge variant="outline" className="w-fit">{viewEmployee.position}</Badge>
                          </div>
                        )}
                        {viewEmployee.hire_date && (
                          <div className="space-y-2">
                            <Label className="text-muted-foreground">تاريخ التوظيف</Label>
                            <p className="font-medium">
                              {formatDateForDisplay(viewEmployee.hire_date)}
                            </p>
                          </div>
                        )}
                        <div className="space-y-2">
                          <Label className="text-muted-foreground">معرف الموظف</Label>
                          <p className="font-medium font-mono">
                            {String(employees.findIndex(e => e.id === viewEmployee.id) + 1).padStart(2, '0')}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="residency" className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">معلومات الإقامة</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {viewEmployee.residency_expiry_date && (
                          <>
                            <div className="space-y-2">
                              <Label className="text-muted-foreground">تاريخ انتهاء الإقامة</Label>
                              <p className="font-medium">
                                {formatDateForDisplay(viewEmployee.residency_expiry_date)}
                              </p>
                            </div>
                            <div className="space-y-2">
                              <Label className="text-muted-foreground">حالة الإقامة</Label>
                              <div className="flex items-center gap-2">
                                {getResidencyStatusBadge(calculateResidencyStatus(viewEmployee.residency_expiry_date))}
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Label className="text-muted-foreground">الأيام المتبقية</Label>
                              <p className="font-medium">
                                {(() => {
                                  const today = new Date();
                                  const expiry = new Date(viewEmployee.residency_expiry_date);
                                  const diffDays = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                                  if (diffDays < 0) return `منتهية منذ ${Math.abs(diffDays)} يوم`;
                                  if (diffDays === 0) return 'تنتهي اليوم';
                                  return `${diffDays} يوم`;
                                })()}
                              </p>
                            </div>
                          </>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>

                {/* Action Buttons */}
                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsViewDialogOpen(false);
                      handleViewDocuments(viewEmployee.id);
                    }}
                  >
                    <FileText className="h-4 w-4 ml-2" />
                    عرض الوثائق
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsViewDialogOpen(false);
                      openEditDialog(viewEmployee);
                    }}
                  >
                    <Edit className="h-4 w-4 ml-2" />
                    تعديل البيانات
                  </Button>
                  <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
                    إغلاق
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
