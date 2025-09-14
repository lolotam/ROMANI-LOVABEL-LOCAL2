import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { CalendarIcon, FileText, Save, X, Building2, User, AlertCircle, Plus } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { jsonDatabase } from '@/lib/jsonDatabase';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

const documentSchema = z.object({
  title: z.string().min(3, 'عنوان الوثيقة يجب أن يكون 3 أحرف على الأقل').max(120, 'عنوان الوثيقة يجب ألا يزيد عن 120 حرف'),
  beneficiary_type: z.enum(['company', 'employee'], { required_error: 'نوع المستفيد مطلوب' }),
  company_id: z.string().optional(),
  employee_id: z.string().optional(),
  document_type_id: z.string().optional(),
  ministry_id: z.string().optional(),
  entity_name: z.string().optional(),
  issue_date: z.date().optional(),
  expiry_date: z.date({ required_error: 'تاريخ الانتهاء مطلوب' }),
  notes: z.string().optional(),
}).refine((data) => {
  // Company validation
  if (data.beneficiary_type === 'company') {
    return data.company_id && data.ministry_id && data.document_type_id;
  }
  // Employee validation  
  if (data.beneficiary_type === 'employee') {
    return data.employee_id && data.document_type_id;
  }
  return false;
}, {
  message: 'جميع الحقول المطلوبة يجب أن تكون مملوءة',
}).refine((data) => {
  // Date validation - expiry date should be >= issue date
  if (data.issue_date && data.expiry_date) {
    return data.expiry_date >= data.issue_date;
  }
  return true;
}, {
  message: 'تاريخ الانتهاء يجب أن يكون بعد أو مساوي لتاريخ الإصدار',
  path: ['expiry_date']
}).refine((data) => {
  // Entity name required when ministry is "أخرى"
  if (data.ministry_id && data.ministry_id === 'other') {
    return data.entity_name && data.entity_name.trim().length > 0;
  }
  return true;
}, {
  message: 'اسم الجهة مطلوب عند اختيار "أخرى"',
  path: ['entity_name']
});

type DocumentFormData = z.infer<typeof documentSchema>;

interface DocumentFormProps {
  uploadedFile: File | null;
  fileName: string;
  onClose: () => void;
  onSuccess: () => void;
  documentTypes: Array<{ id: string; name: string; name_ar: string }>;
  companies: Array<{ id: string; name: string; name_ar: string }>;
  employees: Array<{ id: string; name: string; company_id: string }>;
  ministries: Array<{ id: string; name: string; name_ar: string }>;
  preselectedCompanyId?: string;
  preselectedEmployeeId?: string;
  editingDocument?: {
    id: string;
    title: string;
    document_type_id: string;
    ministry_id?: string;
    employee_id?: string;
    company_id?: string;
    issue_date?: string;
    expiry_date: string;
    notes?: string;
    file_path?: string;
    file_name?: string;
  } | null;
}

export function DocumentForm({
  uploadedFile,
  fileName,
  onClose,
  onSuccess,
  documentTypes,
  companies,
  employees,
  ministries,
  preselectedCompanyId,
  preselectedEmployeeId,
  editingDocument,
}: DocumentFormProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [selectedCompany, setSelectedCompany] = React.useState<string>('');
  const [beneficiaryType, setBeneficiaryType] = React.useState<'company' | 'employee'>(
    editingDocument
      ? (editingDocument.employee_id ? 'employee' : 'company')
      : preselectedCompanyId
        ? 'company'
        : preselectedEmployeeId
          ? 'employee'
          : 'employee'
  );

  const form = useForm<DocumentFormData>({
    resolver: zodResolver(documentSchema),
    defaultValues: editingDocument ? {
      title: editingDocument.title,
      beneficiary_type: editingDocument.employee_id ? 'employee' : 'company',
      company_id: editingDocument.company_id || '',
      employee_id: editingDocument.employee_id || '',
      document_type_id: editingDocument.document_type_id || '',
      ministry_id: editingDocument.ministry_id || '',
      issue_date: editingDocument.issue_date ? new Date(editingDocument.issue_date) : undefined,
      expiry_date: new Date(editingDocument.expiry_date),
      notes: editingDocument.notes || '',
    } : {
      title: fileName ? fileName.replace(/\.[^/.]+$/, '') : '', // Remove file extension
      beneficiary_type: preselectedCompanyId ? 'company' : preselectedEmployeeId ? 'employee' : 'employee',
      company_id: preselectedCompanyId || '',
      employee_id: preselectedEmployeeId || (employees.length > 0 ? employees[0].id : ''),
      notes: '',
    },
  });

  const selectedCompanyEmployees = selectedCompany 
    ? employees.filter(emp => emp.company_id === selectedCompany)
    : employees;

  // Dynamic ministries from database with "Other" option
  const dynamicMinistries = [
    ...ministries,
    { id: 'other', name: 'أخرى', name_ar: 'أخرى' },
  ];

  // Calculate document status based on expiry date
  const calculateStatus = (expiryDate: Date | undefined) => {
    if (!expiryDate) return 'valid';
    const now = new Date();
    const daysDiff = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysDiff < 0) return 'expired';
    if (daysDiff <= 7) return 'expiring_soon';
    if (daysDiff <= 30) return 'expiring_soon';
    return 'valid';
  };

  const watchedExpiryDate = form.watch('expiry_date');
  const watchedMinistry = form.watch('ministry_id');

  const handleSubmit = async (data: DocumentFormData) => {
    setIsSubmitting(true);
    
    try {
      let fileBase64: string | undefined;
      let currentFileName: string;

      // Handle file validation and conversion for new uploads
      if (uploadedFile) {
        // Validate file
        const maxSize = 20 * 1024 * 1024; // 20MB
        const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];

        if (uploadedFile.size > maxSize) {
          throw new Error('حجم الملف يجب أن يكون أقل من 20 ميجابايت');
        }

        if (!allowedTypes.includes(uploadedFile.type)) {
          throw new Error('نوع الملف غير مدعوم. يُسمح فقط بملفات PDF و JPG و PNG');
        }
      }

      // Convert file to base64 for new uploads, use existing data for edits
      if (uploadedFile) {
        const convertFileToBase64 = (file: File): Promise<string> => {
          return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = error => reject(error);
          });
        };

        fileBase64 = await convertFileToBase64(uploadedFile);
        currentFileName = uploadedFile.name;
      } else if (editingDocument) {
        fileBase64 = editingDocument.file_path;
        currentFileName = editingDocument.file_name || 'document';
      } else {
        throw new Error('لا يوجد ملف للحفظ');
      }

      // Prepare data based on beneficiary type
      let documentData: any = {
        title: data.title,
        issue_date: data.issue_date?.toISOString().split('T')[0] || null,
        expiry_date: data.expiry_date.toISOString().split('T')[0],
        notes: data.notes || null,
        file_name: currentFileName,
        file_path: fileBase64,
        status: calculateStatus(data.expiry_date)
      };

      if (data.beneficiary_type === 'company') {
        // For company documents
        documentData.company_id = data.company_id;
        documentData.employee_id = null;
        
        // Handle ministry or create custom entity
        if (data.ministry_id === 'other' && data.entity_name) {
          // Create or find custom ministry for "Other"
          const { data: existingMinistries } = await jsonDatabase
            .from('ministries')
            .select('*')
            .eq('name_ar', data.entity_name)
            .execute();

          if (existingMinistries && existingMinistries.length > 0) {
            documentData.ministry_id = existingMinistries[0].id;
          } else {
            const newMinistryId = crypto.randomUUID();
            const { error: ministryError } = await jsonDatabase
              .insert('ministries', {
                id: newMinistryId,
                name: data.entity_name,
                name_ar: data.entity_name,
                created_at: new Date().toISOString()
              });

            if (ministryError) throw new Error('فشل في إنشاء الوزارة الجديدة');
            documentData.ministry_id = newMinistryId;
          }
        } else {
          // Use selected ministry ID directly
          documentData.ministry_id = data.ministry_id;
        }
        
        // Set document type for company documents
        documentData.document_type_id = data.document_type_id;
        
      } else {
        // For employee documents  
        documentData.employee_id = data.employee_id;
        documentData.company_id = null;
        documentData.document_type_id = data.document_type_id;
        documentData.ministry_id = null;
      }

      if (editingDocument) {
        // Update existing document
        const { error: dbError } = await jsonDatabase
          .update('documents', editingDocument.id, {
            ...documentData,
            updated_at: new Date().toISOString()
          });

        if (dbError) {
          throw new Error(`فشل في تحديث بيانات الوثيقة: ${dbError}`);
        }
      } else {
        // Create new document
        const documentId = crypto.randomUUID();
        const now = new Date().toISOString();

        const fullDocumentData = {
          id: documentId,
          ...documentData,
          created_at: now,
          updated_at: now
        };

        const { error: dbError } = await jsonDatabase
          .insert('documents', fullDocumentData);

        if (dbError) {
          throw new Error(`فشل في حفظ بيانات الوثيقة: ${dbError}`);
        }
      }

      toast.success(editingDocument ? 'تم تحديث الوثيقة بنجاح' : 'تم حفظ الوثيقة بنجاح');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('خطأ في حفظ الوثيقة:', error);
      toast.error(error instanceof Error ? error.message : 'حدث خطأ غير متوقع');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full">
      <CardContent className="p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* File Upload Info */}
            {(uploadedFile || editingDocument) && (
              <div className="p-4 bg-primary/5 rounded-lg border">
                <div className="flex items-center space-x-3">
                  <FileText className="h-8 w-8 text-primary ml-2" />
                  <div className="flex-1">
                    <h3 className="font-medium text-sm">
                      {editingDocument ? 'الملف الحالي' : 'الملف المرفق'}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {uploadedFile ? uploadedFile.name : editingDocument?.file_name}
                    </p>
                    {uploadedFile && (
                      <p className="text-xs text-muted-foreground">
                        {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    )}
                  </div>
                  {uploadedFile && uploadedFile.type.startsWith('image/') && (
                    <img
                      src={URL.createObjectURL(uploadedFile)}
                      alt="معاينة الملف"
                      className="h-12 w-12 object-cover rounded border"
                    />
                  )}
                  {!uploadedFile && editingDocument?.file_path && editingDocument.file_path.startsWith('data:image') && (
                    <img
                      src={editingDocument.file_path}
                      alt="معاينة الملف"
                      className="h-12 w-12 object-cover rounded border"
                    />
                  )}
                </div>
              </div>
            )}

            {/* Always Visible Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>عنوان الوثيقة *</FormLabel>
                    <FormControl>
                      <Input placeholder="أدخل عنوان الوثيقة (3-120 حرف)" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="beneficiary_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>نوع المستفيد *</FormLabel>
                    <Select 
                      onValueChange={(value: 'company' | 'employee') => {
                        field.onChange(value);
                        setBeneficiaryType(value);
                        // Reset dependent fields
                        form.setValue('company_id', '');
                        form.setValue('employee_id', '');
                        form.setValue('document_type_id', '');
                        form.setValue('ministry_id', '');
                        form.setValue('entity_name', '');
                        setSelectedCompany('');
                      }} 
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="اختر نوع المستفيد" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="company">
                          <div className="flex items-center space-x-2">
                            <Building2 className="h-4 w-4 ml-2" />
                            <span>شركة</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="employee">
                          <div className="flex items-center space-x-2">
                            <User className="h-4 w-4 ml-2" />
                            <span>موظف</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Conditional Fields - Company */}
            {beneficiaryType === 'company' && (
              <div className="space-y-4 p-4 border rounded-lg bg-blue-50/30">
                <h3 className="font-medium text-sm flex items-center space-x-2">
                  <Building2 className="h-4 w-4 ml-2" />
                  <span>بيانات الشركة</span>
                </h3>
                
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="company_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>اسم الشركة *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="اختر الشركة" />
                            </SelectTrigger>
                          </FormControl>
                           <SelectContent>
                            {companies.length > 0 ? companies.map((company) => (
                              <SelectItem key={company.id} value={company.id}>
                                {company.name}
                              </SelectItem>
                            )) : (
                              <SelectItem value="no_companies" disabled>
                                لا توجد شركات متاحة
                              </SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="document_type_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>نوع الوثيقة *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="اختر نوع الوثيقة" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {documentTypes.map((type) => (
                              <SelectItem key={type.id} value={type.id}>
                                {type.name_ar}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="ministry_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>الوزارة/الجهة *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="اختر الوزارة أو الجهة" />
                          </SelectTrigger>
                        </FormControl>
                         <SelectContent>
                           {dynamicMinistries.map((ministry) => (
                             <SelectItem key={ministry.id} value={ministry.id}>
                               {ministry.name_ar}
                             </SelectItem>
                           ))}
                         </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                 />

                {/* Entity Name Field - Shows when "Other" is selected */}
                {watchedMinistry === 'other' && (
                  <FormField
                    control={form.control}
                    name="entity_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>اسم الجهة *</FormLabel>
                        <FormControl>
                          <Input placeholder="أدخل اسم الجهة" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>
            )}

            {/* Conditional Fields - Employee */}
            {beneficiaryType === 'employee' && (
              <div className="space-y-4 p-4 border rounded-lg bg-green-50/30">
                <h3 className="font-medium text-sm flex items-center space-x-2">
                  <User className="h-4 w-4 ml-2" />
                  <span>بيانات الموظف</span>
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="company_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>تصفية حسب الشركة (اختياري)</FormLabel>
                        <Select 
                          onValueChange={(value) => {
                            setSelectedCompany(value);
                            form.setValue('employee_id', ''); // Reset employee when company filter changes
                          }} 
                          value={selectedCompany}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="جميع الشركات" />
                            </SelectTrigger>
                          </FormControl>
                           <SelectContent>
                            <SelectItem value="all_companies">جميع الشركات</SelectItem>
                            {companies.map((company) => (
                              <SelectItem key={company.id} value={company.id}>
                                {company.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="employee_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>الموظف *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="اختر الموظف" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {selectedCompanyEmployees.map((employee) => (
                              <SelectItem key={employee.id} value={employee.id}>
                                {employee.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="document_type_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>نوع الوثيقة *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="اختر نوع الوثيقة" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {documentTypes.map((type) => (
                            <SelectItem key={type.id} value={type.id}>
                              {type.name_ar}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* Date Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="issue_date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>تاريخ الإصدار</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>اختر التاريخ</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date > new Date() || date < new Date("1900-01-01")
                          }
                          initialFocus
                          className="pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="expiry_date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel className="flex items-center space-x-2">
                      <span>تاريخ الانتهاء *</span>
                      {watchedExpiryDate && (
                        <Badge 
                          variant={calculateStatus(watchedExpiryDate) === 'expired' ? 'destructive' : 
                                  calculateStatus(watchedExpiryDate) === 'expiring_soon' ? 'destructive' : 'default'}
                          className="text-xs"
                        >
                          {calculateStatus(watchedExpiryDate) === 'expired' ? 'منتهي الصلاحية' :
                           calculateStatus(watchedExpiryDate) === 'expiring_soon' ? 'ينتهي قريباً' : 'صالح'}
                        </Badge>
                      )}
                    </FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>اختر التاريخ</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date < new Date()}
                          initialFocus
                          className="pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ملاحظات</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="أدخل أي ملاحظات إضافية..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Actions */}
            <div className="flex justify-between pt-4 border-t">
              <Button type="button" variant="outline" onClick={onClose}>
                <X className="h-4 w-4 ml-2" />
                إلغاء
              </Button>
              
              <div className="flex space-x-2">
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="shadow-elegant hover:shadow-glow transition-all"
                >
                  <Save className="h-4 w-4 ml-2" />
                  {isSubmitting ?
                    (editingDocument ? 'جاري التحديث...' : 'جاري الحفظ...') :
                    (editingDocument ? 'تحديث' : 'حفظ')
                  }
                </Button>
                
                {!editingDocument && (
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={isSubmitting}
                    onClick={async () => {
                      await form.handleSubmit(handleSubmit)();
                      // Reset form for new document
                      form.reset({
                        title: '',
                        beneficiary_type: 'employee',
                        notes: '',
                      });
                      setBeneficiaryType('employee');
                      setSelectedCompany('');
                    }}
                  >
                    <Plus className="h-4 w-4 ml-2" />
                    حفظ وإضافة أخرى
                  </Button>
                )}
              </div>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}