import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { CalendarIcon, FileText, Save, X } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { jsonDatabase } from '@/lib/jsonDatabase';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';

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

interface EmployeeDocumentFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  employeeId: string;
  uploadedFile?: File | null;
}

export function EmployeeDocumentForm({
  isOpen,
  onClose,
  onSave,
  employeeId,
  uploadedFile
}: EmployeeDocumentFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([]);
  const [ministries, setMinistries] = useState<Ministry[]>([]);
  const { t } = useLanguage();
  
  const [formData, setFormData] = useState({
    title: '',
    document_type_id: '',
    ministry_id: '',
    issue_date: null as Date | null,
    expiry_date: null as Date | null,
    notes: ''
  });

  useEffect(() => {
    if (isOpen) {
      fetchDocumentTypes();
      fetchMinistries();
      resetForm();
    }
  }, [isOpen]);

  useEffect(() => {
    if (uploadedFile) {
      setFormData(prev => ({
        ...prev,
        title: uploadedFile.name.replace(/\.[^/.]+$/, '') // Remove file extension
      }));
    }
  }, [uploadedFile]);

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

  const resetForm = () => {
    setFormData({
      title: uploadedFile?.name?.replace(/\.[^/.]+$/, '') || '',
      document_type_id: '',
      ministry_id: '',
      issue_date: null,
      expiry_date: null,
      notes: ''
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.document_type_id) {
      toast.error(t('documents.employeeDocumentForm.requiredFieldsError'));
      return;
    }

    setIsSubmitting(true);
    
    try {
      let filePath = null;

      // Handle file path for local storage (simplified - no actual file upload)
      if (uploadedFile) {
        const fileExt = uploadedFile.name.split('.').pop();
        const fileName = `${crypto.randomUUID()}.${fileExt}`;
        filePath = `documents/${fileName}`;
        // Note: In a real local implementation, you would save the file to local storage here
      }

      // Save document data to JSON database
      const { error: dbError } = await jsonDatabase.insert('documents', [{
        title: formData.title,
        document_type_id: formData.document_type_id,
        employee_id: employeeId,
        company_id: null, // Employee document, not company
        ministry_id: formData.ministry_id || null,
        issue_date: formData.issue_date?.toISOString().split('T')[0] || null,
        expiry_date: formData.expiry_date?.toISOString().split('T')[0] || null,
        notes: formData.notes || null,
        file_name: uploadedFile?.name || null,
        file_path: filePath
      }]);

      if (dbError) {
        throw new Error(`${t('documents.employeeDocumentForm.saveError')}: ${dbError.message}`);
      }

      toast.success(t('documents.employeeDocumentForm.saveSuccess'));
      onSave();
      onClose();
    } catch (error: any) {
      console.error('Error saving document:', error);
      toast.error(error.message || t('documents.employeeDocumentForm.saveError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {t('documents.employeeDocumentForm.title')}
          </DialogTitle>
          <DialogDescription>
            {t('documents.employeeDocumentForm.description')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label htmlFor="title">{t('documents.form.title')} *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder={t('documents.form.titlePlaceholder')}
                required
              />
            </div>

            <div>
              <Label htmlFor="document_type_id">{t('documents.form.documentType')} *</Label>
              <Select
                value={formData.document_type_id}
                onValueChange={(value) => setFormData(prev => ({ ...prev, document_type_id: value }))}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('documents.form.selectDocumentType')} />
                </SelectTrigger>
                <SelectContent>
                  {documentTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.name_ar}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="ministry_id">{t('documents.form.ministry')}</Label>
              <Select
                value={formData.ministry_id}
                onValueChange={(value) => setFormData(prev => ({ ...prev, ministry_id: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('documents.form.selectMinistry')} />
                </SelectTrigger>
                <SelectContent>
                  {ministries.map((ministry) => (
                    <SelectItem key={ministry.id} value={ministry.id}>
                      {ministry.name_ar}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>{t('documents.form.issueDate')}</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.issue_date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="ml-2 h-4 w-4" />
                    {formData.issue_date ? format(formData.issue_date, "PPP") : t('documents.form.selectDate')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.issue_date || undefined}
                    onSelect={(date) => setFormData(prev => ({ ...prev, issue_date: date || null }))}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label>{t('documents.form.expiryDate')}</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.expiry_date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="ml-2 h-4 w-4" />
                    {formData.expiry_date ? format(formData.expiry_date, "PPP") : t('documents.form.selectDate')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.expiry_date || undefined}
                    onSelect={(date) => setFormData(prev => ({ ...prev, expiry_date: date || null }))}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="notes">{t('documents.form.notes')}</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder={t('documents.form.notesPlaceholder')}
                rows={3}
              />
            </div>

            {uploadedFile && (
              <div className="md:col-span-2 p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">{t('documents.employeeDocumentForm.attachedFile')}</span>
                  <span className="text-sm text-muted-foreground">{uploadedFile.name}</span>
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={isSubmitting} className="flex-1">
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  {t('documents.employeeDocumentForm.saving')}
                </div>
              ) : (
                <>
                  <Save className="h-4 w-4 ml-2" />
                  {t('documents.employeeDocumentForm.save')}
                </>
              )}
            </Button>
            <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
              <X className="h-4 w-4 ml-2" />
              {t('documents.employeeDocumentForm.cancel')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}