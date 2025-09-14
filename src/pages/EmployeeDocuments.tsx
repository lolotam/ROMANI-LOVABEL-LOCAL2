import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { jsonDatabase } from '@/lib/jsonDatabase';
import { Layout } from '@/components/Layout';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { UploadDropzone } from '@/components/ui/UploadDropzone';
import { DocumentForm } from '@/components/DocumentForm';
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
  Calendar, 
  Building2, 
  User, 
  Grid, 
  List, 
  MoreVertical,
  ArrowLeft,
  UserCheck,
  Camera,
  ImagePlus,
  X
} from 'lucide-react';

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

interface Employee {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  position?: string;
  company_id: string;
  photo?: string;
  is_active?: boolean;
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

interface Company {
  id: string;
  name: string;
  name_ar: string;
}

export default function EmployeeDocuments() {
  const { employeeId } = useParams<{ employeeId: string }>();
  const navigate = useNavigate();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([]);
  const [ministries, setMinistries] = useState<Ministry[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [showDocumentForm, setShowDocumentForm] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string>('');
  const [editingDocument, setEditingDocument] = useState<Document | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [isPhotoUploadOpen, setIsPhotoUploadOpen] = useState(false);
  const [employeePhoto, setEmployeePhoto] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (employeeId) {
      fetchEmployee();
      fetchDocuments();
      fetchDocumentTypes();
      fetchMinistries();
      fetchCompanies();
    }
  }, [employeeId]);

  const fetchEmployee = async () => {
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
        const employee = data[0];

        // Check if employee is active
        if (employee.is_active === false) {
          toast({
            title: 'غير مصرح',
            description: 'هذا الموظف غير نشط ولا يمكن عرض وثائقه',
            variant: 'destructive'
          });
          navigate('/employees');
          return;
        }

        setEmployee(employee);
        setEmployeePhoto(employee.photo || null);
      }
    } catch (error) {
      console.error('Error fetching employee:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في تحميل بيانات الموظف',
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

  const filteredDocuments = useMemo(() => {
    let filtered = documents.filter(doc => {
      const matchesSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           doc.document_types?.name_ar.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = selectedStatus === 'all' || doc.status === selectedStatus;
      const matchesType = selectedType === 'all' || doc.document_type_id === selectedType;
      
      return matchesSearch && matchesStatus && matchesType;
    });
    
    return filtered;
  }, [documents, searchTerm, selectedStatus, selectedType]);

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
    handleDocumentFormClose();
  };

  const handleEditDocument = (doc: Document) => {
    setEditingDocument(doc);
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

  const handleViewDocument = (doc: Document) => {
    setSelectedDocument(doc);
    setIsViewDialogOpen(true);
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

      // Check if file_path is base64 data URL or regular file path
      if (doc.file_path.startsWith('data:')) {
        // Base64 data URL - use directly
        downloadUrl = doc.file_path;
      } else {
        // Legacy file path - convert to blob URL for compatibility
        try {
          const response = await fetch(doc.file_path);
          const blob = await response.blob();
          downloadUrl = URL.createObjectURL(blob);
        } catch {
          // If fetch fails, try using the path directly
          downloadUrl = doc.file_path;
        }
      }

      // Create download link
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = doc.file_name || 'document';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      // Clean up blob URL if created
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

  const handlePhotoUpload = async (files: File[]) => {
    if (files.length === 0) return;

    const file = files[0];

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'خطأ',
        description: 'يرجى اختيار صورة صالحة',
        variant: 'destructive'
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'خطأ',
        description: 'حجم الصورة يجب أن يكون أقل من 5 ميجابايت',
        variant: 'destructive'
      });
      return;
    }

    try {
      // Convert to base64
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64Data = e.target?.result as string;

        // Update employee photo in database
        const { error } = await jsonDatabase
          .update('employees', employeeId!, { photo: base64Data });

        if (error) throw error;

        setEmployeePhoto(base64Data);
        setIsPhotoUploadOpen(false);

        toast({
          title: 'تم بنجاح',
          description: 'تم رفع صورة الموظف بنجاح'
        });
      };

      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error uploading photo:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في رفع الصورة',
        variant: 'destructive'
      });
    }
  };

  const handleRemovePhoto = async () => {
    if (!confirm('هل أنت متأكد من حذف صورة الموظف؟')) return;

    try {
      const { error } = await jsonDatabase
        .update('employees', employeeId!, { photo: null });

      if (error) throw error;

      setEmployeePhoto(null);

      toast({
        title: 'تم بنجاح',
        description: 'تم حذف صورة الموظف بنجاح'
      });
    } catch (error) {
      console.error('Error removing photo:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في حذف الصورة',
        variant: 'destructive'
      });
    }
  };

  const DocumentCard = ({ doc }: { doc: Document }) => (
    <Card className="group hover:shadow-elegant transition-all duration-300 relative">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold line-clamp-2">
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
          <StatusBadge status={doc.status || 'valid'} />
          {doc.ministries && (
            <Badge variant="outline" className="text-xs">
              {doc.ministries.name_ar}
            </Badge>
          )}
        </div>
        
        {doc.expiry_date && (
          <div className="flex items-center text-sm text-muted-foreground">
            <Calendar className="h-4 w-4 ml-2" />
            <span>ينتهي: {new Date(doc.expiry_date).toLocaleDateString('en-GB').replace(/\//g, '-')} ميلادي</span>
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

  if (!employee) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-destructive">الموظف غير موجود</h1>
            <Button onClick={() => navigate('/employees')} className="mt-4">
              العودة إلى قائمة الموظفين
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
          className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6"
        >
          <div className="flex flex-col sm:flex-row items-start gap-6 flex-1">
            {/* Employee Photo Section */}
            <div className="flex-shrink-0">
              <div className="relative group">
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full border-4 border-primary/20 overflow-hidden bg-gray-50 shadow-elegant hover:shadow-glow transition-all duration-300">
                  {employeePhoto ? (
                    <img
                      src={employeePhoto}
                      alt={employee.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
                      <User className="h-10 w-10 text-primary/60" />
                    </div>
                  )}
                </div>
                <div className="absolute -bottom-1 -right-1">
                  <Button
                    size="sm"
                    className="h-8 w-8 rounded-full shadow-lg"
                    onClick={() => setIsPhotoUploadOpen(true)}
                  >
                    <Camera className="h-4 w-4" />
                  </Button>
                </div>
                {employeePhoto && (
                  <div className="absolute -top-1 -left-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      size="sm"
                      variant="destructive"
                      className="h-6 w-6 rounded-full"
                      onClick={handleRemovePhoto}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Employee Info Section */}
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/employees')}
                  className="hover:bg-accent"
                >
                  <ArrowLeft className="h-4 w-4 ml-1" />
                  العودة
                </Button>
              </div>
              <div className="relative inline-block">
                <h1 className="text-3xl font-bold text-gradient">وثائق {employee.name}</h1>
                <div className="absolute -top-2 -left-2 bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold shadow-lg">
                  {documents.length}
                </div>
              </div>
              <div className="flex items-center space-x-2 mt-2">
                <UserCheck className="h-5 w-5 text-primary" />
                <span className="text-muted-foreground">{employee.companies?.name}</span>
                {employee.position && (
                  <>
                    <span className="text-muted-foreground">•</span>
                    <Badge variant="outline">{employee.position}</Badge>
                  </>
                )}
              </div>
              <p className="text-muted-foreground mt-1">
                إجمالي {documents.length} وثيقة
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
                  <DialogTitle>رفع وثيقة جديدة لـ {employee.name}</DialogTitle>
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
                      onChange={(e) => setSearchTerm(e.target.value)}
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
                      {documentTypes.map((type) => (
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

        {/* Documents */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {filteredDocuments.length === 0 ? (
            <Card className="p-8 text-center">
              <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-medium text-muted-foreground mb-2">
                لا توجد وثائق
              </h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || selectedStatus !== 'all' || selectedType !== 'all' 
                  ? 'لا توجد وثائق تطابق معايير البحث' 
                  : 'لم يتم رفع أي وثائق لهذا الموظف بعد'
                }
              </p>
              <Button onClick={() => setIsUploadDialogOpen(true)}>
                <Upload className="h-4 w-4 ml-2" />
                رفع أول وثيقة
              </Button>
            </Card>
          ) : (
            <div className={viewMode === 'grid' ? 
              "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4" : 
              "space-y-2"
            }>
              {filteredDocuments.map((doc) => (
                <DocumentCard key={doc.id} doc={doc} />
              ))}
            </div>
          )}
        </motion.div>

        {/* Document Form Dialog */}
        <Dialog open={showDocumentForm} onOpenChange={(open) => !open && handleDocumentFormClose()}>
          <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingDocument ? 'تعديل الوثيقة' : 'إضافة وثيقة جديدة'}</DialogTitle>
              <DialogDescription>
                {editingDocument ? 'تعديل بيانات الوثيقة' : 'إضافة وثيقة جديدة للموظف'}
              </DialogDescription>
            </DialogHeader>
            {(uploadedFile || editingDocument) && (
              <DocumentForm
                uploadedFile={uploadedFile}
                fileName={uploadedFileName}
                onClose={handleDocumentFormClose}
                onSuccess={handleDocumentSaved}
                documentTypes={documentTypes}
                companies={companies}
                employees={employee ? [employee] : []}
                ministries={ministries}
                editingDocument={editingDocument}
                preselectedEmployeeId={employeeId}
              />
            )}
          </DialogContent>
        </Dialog>

        {/* View Document Dialog */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>تفاصيل الوثيقة</DialogTitle>
              <DialogDescription>
                عرض جميع بيانات الوثيقة
              </DialogDescription>
            </DialogHeader>
            {selectedDocument && (
              <div className="space-y-6">
                {/* File Preview Section */}
                {selectedDocument.file_path && (
                  <div className="border rounded-lg p-4 bg-gray-50">
                    <Label className="text-sm font-medium text-muted-foreground mb-2 block">معاينة الملف</Label>
                    {(() => {
                      const fileName = selectedDocument.file_name || '';
                      const isImage = /\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(fileName);
                      const isPdf = /\.pdf$/i.test(fileName);

                      if (isImage && selectedDocument.file_path) {
                        return (
                          <div className="flex justify-center">
                            <img
                              src={selectedDocument.file_path}
                              alt={selectedDocument.title}
                              className="max-w-full max-h-96 object-contain rounded border"
                              onError={(e) => {
                                e.currentTarget.src = '/placeholder-image.png';
                              }}
                            />
                          </div>
                        );
                      } else if (isPdf && selectedDocument.file_path) {
                        return (
                          <div className="text-center">
                            <iframe
                              src={selectedDocument.file_path}
                              className="w-full h-96 border rounded"
                              title={selectedDocument.title}
                            />
                            <p className="text-sm text-muted-foreground mt-2">
                              ملف PDF - اضغط على تحميل لعرضه بطريقة أفضل
                            </p>
                          </div>
                        );
                      } else {
                        return (
                          <div className="text-center py-8 text-muted-foreground">
                            <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                            <p>معاينة الملف غير متوفرة لهذا النوع</p>
                            <p className="text-xs">{fileName}</p>
                          </div>
                        );
                      }
                    })()}
                  </div>
                )}

                {/* Document Details */}
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
                    <StatusBadge status={selectedDocument.status || 'valid'} />
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">اسم الملف</Label>
                    <p className="text-sm">{selectedDocument.file_name || 'غير متوفر'}</p>
                  </div>
                  {selectedDocument.issue_date && (
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">تاريخ الإصدار</Label>
                      <p className="text-sm">{new Date(selectedDocument.issue_date).toLocaleDateString('en-GB').replace(/\//g, '-')}</p>
                    </div>
                  )}
                  {selectedDocument.expiry_date && (
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">تاريخ انتهاء الصلاحية</Label>
                      <p className="text-sm">{new Date(selectedDocument.expiry_date).toLocaleDateString('en-GB').replace(/\//g, '-')}</p>
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

        {/* Photo Upload Dialog */}
        <Dialog open={isPhotoUploadOpen} onOpenChange={setIsPhotoUploadOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>رفع صورة الموظف</DialogTitle>
              <DialogDescription>
                اختر صورة للموظف {employee.name}
              </DialogDescription>
            </DialogHeader>
            <UploadDropzone
              onFilesAccepted={handlePhotoUpload}
              maxFiles={1}
              maxFileSize={5 * 1024 * 1024} // 5MB
              acceptedFileTypes={['image/*']}
              className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center"
            />
            <div className="text-xs text-muted-foreground text-center">
              حجم الصورة الأقصى: 5 ميجابايت • الصيغ المدعومة: JPG, PNG, GIF
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}