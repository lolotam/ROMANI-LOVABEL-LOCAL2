import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { jsonDatabase } from '@/lib/jsonDatabase';
import { Layout } from '@/components/Layout';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { UploadDropzone } from '@/components/ui/UploadDropzone';
import { EmployeeDocumentForm } from '@/components/EmployeeDocumentForm';
import { 
  FileText, 
  Plus, 
  Search,
  Filter,
  Download,
  Trash2,
  Eye,
  Edit,
  Upload,
  ArrowRight,
  User,
  Building2,
  Calendar,
  Phone,
  Mail,
  CreditCard,
  UserCheck,
  DownloadCloud
} from 'lucide-react';

interface Employee {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  mobile_no?: string;
  position?: string;
  hire_date?: string;
  birth_date?: string;
  civil_id_no?: string;
  residency_expiry_date?: string;
  company_id: string;
  companies?: {
    name: string;
    name_ar: string;
    description?: string;
  };
}

interface Document {
  id: string;
  title: string;
  file_name?: string;
  file_path?: string;
  status?: 'valid' | 'expiring_soon' | 'expired';
  issue_date?: string;
  expiry_date?: string;
  notes?: string;
  employee_id?: string;
  company_id?: string;
  document_type_id: string;
  ministry_id?: string;
  created_at: string;
  updated_at: string;
  document_types?: {
    name: string;
    name_ar: string;
  };
  ministries?: {
    name: string;
    name_ar: string;
  };
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

export default function EmployeeProfile() {
  const { employeeId } = useParams<{ employeeId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [employee, setEmployee] = useState<Employee | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([]);
  const [ministries, setMinistries] = useState<Ministry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isDocumentFormOpen, setIsDocumentFormOpen] = useState(false);

  useEffect(() => {
    if (employeeId) {
      fetchEmployee();
      fetchDocuments();
      fetchDocumentTypes();
      fetchMinistries();
    }
  }, [employeeId]);

  const fetchEmployee = async () => {
    if (!employeeId) return;

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
        .eq('id', employeeId)
        .execute();

      if (error) throw error;
      if (data && data.length > 0) {
        setEmployee(data[0]);
      }
    } catch (error) {
      console.error('Error fetching employee:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في تحميل بيانات الموظف',
        variant: 'destructive'
      });
      navigate('/employees');
    }
  };

  const fetchDocuments = async () => {
    if (!employeeId) return;

    try {
      const { data, error } = await jsonDatabase
        .from('documents')
        .select(`
          *,
          document_types (
            name,
            name_ar
          ),
          ministries (
            name,
            name_ar
          )
        `)
        .eq('employee_id', employeeId)
        .order('created_at', 'desc')
        .execute();

      if (error) throw error;
      setDocuments(data || []);
    } catch (error) {
      console.error('Error fetching documents:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في تحميل الوثائق',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDocumentTypes = async () => {
    try {
      const { data, error } = await jsonDatabase
        .from('document_types')
        .select('*')
        .order('name_ar', 'asc')
        .execute();

      if (error) throw error;
      setDocumentTypes(data || []);
    } catch (error) {
      console.error('Error fetching document types:', error);
    }
  };

  const fetchMinistries = async () => {
    try {
      const { data, error } = await jsonDatabase
        .from('ministries')
        .select('*')
        .order('name_ar', 'asc')
        .execute();

      if (error) throw error;
      setMinistries(data || []);
    } catch (error) {
      console.error('Error fetching ministries:', error);
    }
  };

  const filteredDocuments = useMemo(() => {
    return documents.filter(document => {
      const matchesSearch = document.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           document.document_types?.name_ar.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           document.notes?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || document.status === statusFilter;
      const matchesType = typeFilter === 'all' || document.document_type_id === typeFilter;
      
      return matchesSearch && matchesStatus && matchesType;
    });
  }, [documents, searchTerm, statusFilter, typeFilter]);

  const handleDocumentSelect = (documentId: string) => {
    setSelectedDocuments(prev => 
      prev.includes(documentId) 
        ? prev.filter(id => id !== documentId)
        : [...prev, documentId]
    );
  };

  const handleSelectAll = () => {
    if (selectedDocuments.length === filteredDocuments.length) {
      setSelectedDocuments([]);
    } else {
      setSelectedDocuments(filteredDocuments.map(doc => doc.id));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedDocuments.length === 0) return;

    if (!confirm(`هل أنت متأكد من حذف ${selectedDocuments.length} وثيقة؟`)) return;

    try {
      // Delete each document individually
      for (const docId of selectedDocuments) {
        const { error } = await jsonDatabase.delete('documents', docId);
        if (error) throw error;
      }

      toast({
        title: 'تم بنجاح',
        description: `تم حذف ${selectedDocuments.length} وثيقة بنجاح`
      });

      setSelectedDocuments([]);
      fetchDocuments();
    } catch (error) {
      console.error('Error deleting documents:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في حذف الوثائق',
        variant: 'destructive'
      });
    }
  };

  const handleDocumentDelete = async (documentId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه الوثيقة؟')) return;

    try {
      const { error } = await jsonDatabase.delete('documents', documentId);

      if (error) throw error;

      toast({
        title: 'تم بنجاح',
        description: 'تم حذف الوثيقة بنجاح'
      });

      fetchDocuments();
    } catch (error) {
      console.error('Error deleting document:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في حذف الوثيقة',
        variant: 'destructive'
      });
    }
  };

  const handleDownloadDocument = async (document: Document) => {
    if (!document.file_path) {
      toast({
        title: 'خطأ',
        description: 'لا يوجد ملف مرفق بهذه الوثيقة',
        variant: 'destructive'
      });
      return;
    }

    try {
      // For local JSON database, documents are stored as base64 or file paths
      // Create a download link for the file
      const url = document.file_path || '';
      if (!url) throw new Error('No file path available');
      const link = window.document.createElement('a');
      link.href = url;
      link.download = document.file_name || document.title;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading document:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في تنزيل الوثيقة',
        variant: 'destructive'
      });
    }
  };

  const handleDownloadAll = async () => {
    const documentsToDownload = selectedDocuments.length > 0 
      ? documents.filter(doc => selectedDocuments.includes(doc.id))
      : filteredDocuments;

    if (documentsToDownload.length === 0) {
      toast({
        title: 'تحذير',
        description: 'لا توجد وثائق لتنزيلها',
        variant: 'destructive'
      });
      return;
    }

    toast({
      title: 'جاري التنزيل',
      description: `جاري تنزيل ${documentsToDownload.length} وثيقة...`
    });

    for (const document of documentsToDownload) {
      if (document.file_path) {
        try {
          await handleDownloadDocument(document);
          // Add small delay between downloads
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
          console.error(`Error downloading ${document.title}:`, error);
        }
      }
    }

    toast({
      title: 'تم بنجاح',
      description: 'تم تنزيل جميع الوثائق المتاحة'
    });
  };

  const handleFilesAccepted = (files: File[]) => {
    if (files.length > 0) {
      setUploadedFile(files[0]);
      setIsDocumentFormOpen(true);
    }
  };

  const handleDocumentFormClose = () => {
    setIsDocumentFormOpen(false);
    setUploadedFile(null);
  };

  const handleDocumentSaved = () => {
    fetchDocuments();
    handleDocumentFormClose();
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

  if (!employee) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-destructive">موظف غير موجود</h1>
            <Button onClick={() => navigate('/employees')} className="mt-4">
              العودة لقائمة الموظفين
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6 space-y-6">
        {/* Header with employee info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <Button variant="ghost" onClick={() => navigate('/employees')} className="mb-4">
            <ArrowRight className="h-4 w-4 ml-2" />
            العودة لقائمة الموظفين
          </Button>

          <Card className="bg-gradient-to-r from-primary/10 to-secondary/10">
            <CardHeader>
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center">
                  <User className="h-8 w-8 text-primary" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-2xl text-gradient">{employee.name}</CardTitle>
                  <CardDescription className="text-lg">
                    {employee.position} - {employee.companies?.name}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {employee.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{employee.email}</span>
                  </div>
                )}
                {employee.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{employee.phone}</span>
                  </div>
                )}
                {employee.civil_id_no && (
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{employee.civil_id_no}</span>
                  </div>
                )}
                {employee.hire_date && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">تاريخ التوظيف: {employee.hire_date}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Documents section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-4"
        >
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-2xl font-bold text-gradient">وثائق الموظف</h2>
              <p className="text-muted-foreground">
                إجمالي {documents.length} وثيقة
              </p>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleDownloadAll} variant="outline" size="sm">
                <DownloadCloud className="h-4 w-4 ml-2" />
                تنزيل {selectedDocuments.length > 0 ? 'المحددة' : 'الكل'}
              </Button>
              <Button onClick={() => setIsDocumentFormOpen(true)} className="shadow-elegant hover:shadow-glow transition-all">
                <Plus className="h-4 w-4 ml-2" />
                إضافة وثيقة
              </Button>
            </div>
          </div>

          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <Input
                    placeholder="البحث في الوثائق..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="حالة الوثيقة" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع الحالات</SelectItem>
                    <SelectItem value="valid">سارية</SelectItem>
                    <SelectItem value="expiring_soon">تنتهي قريباً</SelectItem>
                    <SelectItem value="expired">منتهية الصلاحية</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="نوع الوثيقة" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع الأنواع</SelectItem>
                    {documentTypes.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        {type.name_ar}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="select-all"
                    checked={selectedDocuments.length === filteredDocuments.length && filteredDocuments.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                  <label htmlFor="select-all" className="text-sm">
                    تحديد الكل ({selectedDocuments.length})
                  </label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bulk actions */}
          {selectedDocuments.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="flex items-center gap-2 p-4 bg-primary/10 rounded-lg"
            >
              <span className="text-sm font-medium">
                تم تحديد {selectedDocuments.length} وثيقة
              </span>
              <Button onClick={handleBulkDelete} variant="destructive" size="sm">
                <Trash2 className="h-4 w-4 ml-2" />
                حذف المحددة
              </Button>
              <Button onClick={() => setSelectedDocuments([])} variant="outline" size="sm">
                إلغاء التحديد
              </Button>
            </motion.div>
          )}

          {/* Documents grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDocuments.map((document, index) => (
              <motion.div
                key={document.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="hover:shadow-lg transition-all duration-300 group">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          checked={selectedDocuments.includes(document.id)}
                          onCheckedChange={() => handleDocumentSelect(document.id)}
                        />
                        <FileText className="h-5 w-5 text-primary" />
                      </div>
                      <StatusBadge status={document.status} />
                    </div>
                    <CardTitle className="text-lg line-clamp-2 group-hover:text-primary transition-colors">
                      {document.title}
                    </CardTitle>
                    <CardDescription>
                      {document.document_types?.name_ar}
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {document.issue_date && (
                        <div>
                          <span className="text-muted-foreground">تاريخ الإصدار:</span>
                          <div>{new Date(document.issue_date).toLocaleDateString('en-GB')}</div>
                        </div>
                      )}
                      {document.expiry_date && (
                        <div>
                          <span className="text-muted-foreground">تاريخ الانتهاء:</span>
                          <div>{new Date(document.expiry_date).toLocaleDateString('en-GB')}</div>
                        </div>
                      )}
                    </div>
                    
                    {document.ministries && (
                      <div className="text-sm">
                        <span className="text-muted-foreground">الوزارة:</span>
                        <Badge variant="outline" className="mr-2">
                          {document.ministries.name_ar}
                        </Badge>
                      </div>
                    )}
                    
                    {document.notes && (
                      <div className="text-sm">
                        <span className="text-muted-foreground">ملاحظات:</span>
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                          {document.notes}
                        </p>
                      </div>
                    )}
                    
                    <div className="flex gap-2 pt-2">
                      {document.file_path && (
                        <Button
                          onClick={() => handleDownloadDocument(document)}
                          variant="outline"
                          size="sm"
                          className="flex-1"
                        >
                          <Download className="h-4 w-4 ml-2" />
                          تنزيل
                        </Button>
                      )}
                      <Button
                        onClick={() => handleDocumentDelete(document.id)}
                        variant="destructive"
                        size="sm"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {filteredDocuments.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">لا توجد وثائق</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || statusFilter !== 'all' || typeFilter !== 'all'
                  ? 'لا توجد وثائق تطابق معايير البحث'
                  : 'لم يتم إضافة أي وثائق بعد'}
              </p>
              <Button onClick={() => setIsDocumentFormOpen(true)}>
                <Plus className="h-4 w-4 ml-2" />
                إضافة أول وثيقة
              </Button>
            </motion.div>
          )}
        </motion.div>

        {/* Upload Dropzone */}
        <UploadDropzone
          onFilesAccepted={handleFilesAccepted}
          acceptedFileTypes={[]}
          maxFiles={1}
          className="border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 transition-colors p-8 rounded-lg bg-muted/10"
        />

        {/* Document Form Dialog */}
        <EmployeeDocumentForm
          isOpen={isDocumentFormOpen}
          onClose={handleDocumentFormClose}
          onSave={handleDocumentSaved}
          employeeId={employeeId!}
          uploadedFile={uploadedFile}
        />
      </div>
    </Layout>
  );
}