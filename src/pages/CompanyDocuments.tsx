import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { jsonDatabase } from '@/lib/jsonDatabase';
import { Layout } from '@/components/Layout';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { calculateDocumentStatus } from '@/lib/statusUtils';
import { UploadDropzone } from '@/components/ui/UploadDropzone';
import { DocumentForm } from '@/components/DocumentForm';
import { FileText, Plus, Search, Download, Trash2, Eye, Edit, Upload, Calendar, Building2, ArrowLeft, Grid, List } from 'lucide-react';

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
  employees?: {
    name: string;
    companies?: {
      name: string;
      name_ar: string;
    };
  };
  companies?: {
    name: string;
    name_ar: string;
  };
  document_types?: {
    name: string;
    name_ar: string;
  };
  ministries?: {
    name: string;
    name_ar: string;
  };
}

interface Company {
  id: string;
  name: string;
  name_ar: string;
  description?: string;
}

interface Employee {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  position?: string;
  hire_date?: string;
  company_id: string;
  companies?: {
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

export default function CompanyDocuments() {
  const { companyId } = useParams<{ companyId: string }>();
  const navigate = useNavigate();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [company, setCompany] = useState<Company | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([]);
  const [ministries, setMinistries] = useState<Ministry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [showDocumentForm, setShowDocumentForm] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string>('');
  const [editingDocument, setEditingDocument] = useState<Document | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);

  const { toast } = useToast();

  useEffect(() => {
    if (companyId) {
      fetchCompany();
      fetchDocuments();
      fetchCompanies();
      fetchEmployees();
      fetchDocumentTypes();
      fetchMinistries();
    }
  }, [companyId]);

  const fetchCompany = async () => {
    try {
      const { data, error } = await jsonDatabase
        .from('companies')
        .select('*')
        .eq('id', companyId)
        .execute();

      if (error) throw error;
      if (data && data.length > 0) {
        setCompany(data[0]);
      } else {
        toast({
          title: 'خطأ',
          description: 'الشركة غير موجودة',
          variant: 'destructive'
        });
        navigate('/documents');
      }
    } catch (error) {
      console.error('Error fetching company:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في تحميل بيانات الشركة',
        variant: 'destructive'
      });
    }
  };

  const fetchDocuments = async () => {
    try {
      const { data, error } = await jsonDatabase
        .from('documents')
        .select(`
          *,
          employees (
            name,
            companies (
              name,
              name_ar
            )
          ),
          companies (
            name,
            name_ar
          ),
          document_types (
            name,
            name_ar
          ),
          ministries (
            name,
            name_ar
          )
        `)
        .eq('company_id', companyId)
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
        .order('name', 'asc')
        .execute();

      if (error) throw error;
      setEmployees(data || []);
    } catch (error) {
      console.error('Error fetching employees:', error);
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
    return documents.filter(doc => {
      const matchesSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.document_types?.name_ar.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = selectedStatus === 'all' || doc.status === selectedStatus;
      const matchesType = selectedType === 'all' || doc.document_type_id === selectedType;

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [documents, searchTerm, selectedStatus, selectedType]);

  const toggleDocumentSelection = (docId: string) => {
    setSelectedDocuments(prev =>
      prev.includes(docId)
        ? prev.filter(id => id !== docId)
        : [...prev, docId]
    );
  };

  const selectAllDocuments = () => {
    setSelectedDocuments(filteredDocuments.map(doc => doc.id));
  };

  const clearSelection = () => {
    setSelectedDocuments([]);
  };

  const bulkDelete = async () => {
    if (!confirm(`هل أنت متأكد من حذف ${selectedDocuments.length} وثيقة؟`)) return;

    try {
      const errors = [];
      for (const docId of selectedDocuments) {
        const { error } = await jsonDatabase.delete('documents', docId);
        if (error) errors.push(error);
      }

      if (errors.length > 0) throw errors[0];

      toast({
        title: 'تم بنجاح',
        description: `تم حذف ${selectedDocuments.length} وثيقة`
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

  const handleFilesAccepted = (files: File[]) => {
    if (files.length > 0) {
      const file = files[0];
      setUploadedFile(file);
      setUploadedFileName(file.name);
      setIsUploadDialogOpen(false);
      setShowDocumentForm(true);
    }
  };

  const handleDocumentFormClose = () => {
    setShowDocumentForm(false);
    setUploadedFile(null);
    setUploadedFileName('');
    setEditingDocument(null);
  };

  const handleDocumentSaved = async () => {
    await fetchDocuments();
  };

  const handleViewDocument = (doc: Document) => {
    setSelectedDocument(doc);
    setIsViewDialogOpen(true);
  };

  const handleEditDocument = (doc: Document) => {
    setEditingDocument(doc);
    setUploadedFile(null);
    setUploadedFileName(doc.file_name || '');
    setShowDocumentForm(true);
  };

  const handleDeleteDocument = async (docId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه الوثيقة؟')) return;

    try {
      const { error } = await jsonDatabase.delete('documents', docId);
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

  const handleDownloadDocument = async (doc: Document) => {
    if (!doc.file_path) {
      toast({
        title: 'خطأ',
        description: 'لا يوجد ملف للتحميل',
        variant: 'destructive'
      });
      return;
    }

    try {
      let downloadUrl: string;

      if (doc.file_path.startsWith('data:')) {
        downloadUrl = doc.file_path;
      } else {
        try {
          const response = await fetch(doc.file_path);
          const blob = await response.blob();
          downloadUrl = URL.createObjectURL(blob);
        } catch {
          downloadUrl = doc.file_path;
        }
      }

      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = doc.file_name || 'document';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      if (!doc.file_path.startsWith('data:') && downloadUrl !== doc.file_path) {
        URL.revokeObjectURL(downloadUrl);
      }

      toast({
        title: 'تم بنجاح',
        description: 'تم تحميل الوثيقة بنجاح'
      });
    } catch (error) {
      console.error('Error downloading document:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في تحميل الوثيقة',
        variant: 'destructive'
      });
    }
  };

  const DocumentCard = ({ doc }: { doc: Document }) => (
    <Card className="group hover:shadow-elegant transition-all duration-300 relative">
      <div className="absolute top-3 left-3 z-10">
        <Checkbox
          checked={selectedDocuments.includes(doc.id)}
          onCheckedChange={() => toggleDocumentSelection(doc.id)}
          className="bg-background border-2"
        />
      </div>

      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold line-clamp-2 pr-8">
              {doc.title}
            </CardTitle>
            <CardDescription className="mt-1">
              {doc.document_types?.name_ar}
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <StatusBadge status={calculateDocumentStatus(doc.expiry_date)} />
          {doc.ministries && (
            <Badge variant="outline" className="text-xs">
              {doc.ministries.name_ar}
            </Badge>
          )}
        </div>

        {doc.expiry_date && (
          <div className="flex items-center text-sm text-muted-foreground">
            <Calendar className="h-4 w-4 ml-2" />
            <span>ينتهي: {new Date(doc.expiry_date).toLocaleDateString('en-GB')}</span>
          </div>
        )}

        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex space-x-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => handleViewDocument(doc)}
              title="عرض الوثيقة"
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => handleEditDocument(doc)}
              title="تعديل الوثيقة"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => handleDownloadDocument(doc)}
              title="تحميل الوثيقة"
            >
              <Download className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 hover:bg-destructive hover:text-destructive-foreground"
              onClick={() => handleDeleteDocument(doc.id)}
              title="حذف الوثيقة"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  if (!company) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">الشركة غير موجودة</h2>
            <Button onClick={() => navigate('/documents')}>
              العودة إلى الوثائق
            </Button>
          </div>
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
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              onClick={() => navigate('/documents')}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>العودة</span>
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gradient text-slate-950 flex items-center space-x-2">
                <Building2 className="h-8 w-8 ml-2" />
                <span>وثائق {company.name}</span>
              </h1>
              <p className="text-muted-foreground">
                عرض وإدارة جميع وثائق الشركة ({documents.length} وثيقة)
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
              <DialogTrigger asChild>
                <Button className="shadow-elegant hover:shadow-glow transition-all">
                  <Upload className="h-4 w-4 ml-2" />
                  رفع وثيقة جديدة
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                  <DialogTitle>رفع وثيقة جديدة لشركة {company.name}</DialogTitle>
                  <DialogDescription>
                    اختر الملف الذي تريد رفعه
                  </DialogDescription>
                </DialogHeader>
                <UploadDropzone
                  onFilesAccepted={handleFilesAccepted}
                  maxFiles={1}
                  maxFileSize={50 * 1024 * 1024} // 50MB
                />
              </DialogContent>
            </Dialog>
          </div>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="shadow-soft">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1">
                  <Label htmlFor="search">البحث</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="search"
                      placeholder="البحث في الوثائق..."
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="w-full lg:w-48">
                  <Label>الحالة</Label>
                  <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">جميع الحالات</SelectItem>
                      <SelectItem value="valid">صالح</SelectItem>
                      <SelectItem value="expiring_soon">ينتهي قريباً</SelectItem>
                      <SelectItem value="expired">منتهي الصلاحية</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="w-full lg:w-48">
                  <Label>نوع الوثيقة</Label>
                  <Select value={selectedType} onValueChange={setSelectedType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">جميع الأنواع</SelectItem>
                      {documentTypes.map(type => (
                        <SelectItem key={type.id} value={type.id}>
                          {type.name_ar}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-end space-x-2">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                  >
                    <Grid className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Bulk Actions */}
        {selectedDocuments.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <span className="text-sm font-medium">
                      تم تحديد {selectedDocuments.length} وثيقة
                    </span>
                    <Button variant="ghost" size="sm" onClick={clearSelection}>
                      إلغاء التحديد
                    </Button>
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 ml-1" />
                      تحميل
                    </Button>
                    <Button variant="destructive" size="sm" onClick={bulkDelete}>
                      <Trash2 className="h-4 w-4 ml-1" />
                      حذف
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Documents */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">الوثائق</h2>
            <Button variant="outline" size="sm" onClick={selectAllDocuments}>
              تحديد الكل ({filteredDocuments.length})
            </Button>
          </div>

          {filteredDocuments.length === 0 ? (
            <Card className="p-8 text-center">
              <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">لا توجد وثائق لهذه الشركة</p>
            </Card>
          ) : (
            <div className={
              viewMode === 'grid'
                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
                : "space-y-2"
            }>
              {filteredDocuments.map(doc => (
                <DocumentCard key={doc.id} doc={doc} />
              ))}
            </div>
          )}
        </motion.div>

        {/* Document Form Dialog */}
        {showDocumentForm && (uploadedFile || editingDocument) && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <DocumentForm
                uploadedFile={uploadedFile}
                fileName={uploadedFileName}
                onClose={handleDocumentFormClose}
                onSuccess={handleDocumentSaved}
                documentTypes={documentTypes}
                companies={companies}
                employees={employees}
                ministries={ministries}
                editingDocument={editingDocument}
                preselectedCompanyId={companyId}
              />
            </div>
          </div>
        )}

        {/* View Document Dialog */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>تفاصيل الوثيقة</DialogTitle>
              <DialogDescription>
                عرض جميع بيانات الوثيقة
              </DialogDescription>
            </DialogHeader>
            {selectedDocument && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">العنوان</Label>
                    <p className="text-sm font-medium">{selectedDocument.title}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">نوع الوثيقة</Label>
                    <p className="text-sm">{selectedDocument.document_types?.name_ar}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">الحالة</Label>
                    <StatusBadge status={calculateDocumentStatus(selectedDocument.expiry_date)} />
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">اسم الملف</Label>
                    <p className="text-sm">{selectedDocument.file_name || 'غير متوفر'}</p>
                  </div>
                  {selectedDocument.issue_date && (
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">تاريخ الإصدار</Label>
                      <p className="text-sm">{new Date(selectedDocument.issue_date).toLocaleDateString('en-GB')}</p>
                    </div>
                  )}
                  {selectedDocument.expiry_date && (
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">تاريخ انتهاء الصلاحية</Label>
                      <p className="text-sm">{new Date(selectedDocument.expiry_date).toLocaleDateString('en-GB')}</p>
                    </div>
                  )}
                  {selectedDocument.ministries && (
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">الوزارة</Label>
                      <p className="text-sm">{selectedDocument.ministries.name_ar}</p>
                    </div>
                  )}
                  {selectedDocument.notes && (
                    <div className="md:col-span-2">
                      <Label className="text-sm font-medium text-muted-foreground">ملاحظات</Label>
                      <p className="text-sm">{selectedDocument.notes}</p>
                    </div>
                  )}
                </div>
                <div className="flex gap-2 pt-4">
                  <Button
                    onClick={() => handleDownloadDocument(selectedDocument)}
                    className="flex-1"
                  >
                    <Download className="h-4 w-4 ml-2" />
                    تحميل الوثيقة
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setIsViewDialogOpen(false)}
                  >
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