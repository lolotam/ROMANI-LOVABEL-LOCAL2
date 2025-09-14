import emailjs from '@emailjs/browser';
import { Employee, Document } from './jsonDatabase';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

// Initialize EmailJS with your service ID, template ID, and public key
// NOTE: These need to be replaced with real EmailJS credentials from https://www.emailjs.com/
// For testing purposes, these are placeholder values that will cause 400 errors
const EMAILJS_SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID || 'service_smtp';
const EMAILJS_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID || 'template_expiry';
const EMAILJS_PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY || 'your_public_key';

// Initialize EmailJS - this will fail with placeholder credentials
try {
  emailjs.init(EMAILJS_PUBLIC_KEY);
} catch (error) {
  console.warn('EmailJS initialization failed - please configure real credentials in .env file');
}

export interface ExpiryData {
  employees: Array<Employee & { expiryType: 'residency'; daysUntilExpiry: number }>;
  documents: Array<Document & { employee?: Employee; expiryType: 'document'; daysUntilExpiry: number }>;
}

export interface EmailNotificationSettings {
  enabled: boolean;
  monthlyReminder: boolean;
  weeklyReminder: boolean;
  expiredNotification: boolean;
  emailRecipient: string;
}

// Template loading and processing functions
async function loadEmailTemplate(templateName: 'employee' | 'company'): Promise<string> {
  try {
    const response = await fetch(`/email-template-${templateName}.html`);
    if (!response.ok) {
      throw new Error(`Failed to load ${templateName} template: ${response.statusText}`);
    }
    return await response.text();
  } catch (error) {
    console.error('Template loading error:', error);
    // Fallback to inline generation
    return '';
  }
}

// Simple template variable substitution
function processTemplate(template: string, variables: Record<string, any>): string {
  let processed = template;

  // Handle simple variables {{variable}}
  processed = processed.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return variables[key] !== undefined ? String(variables[key]) : match;
  });

  // Handle conditional blocks {{#if variable}}...{{/if}}
  processed = processed.replace(/\{\{#if\s+(\w+)\}\}(.*?)\{\{\/if\}\}/gs, (match, key, content) => {
    return variables[key] ? content : '';
  });

  // Handle each loops {{#each array}}...{{/each}}
  processed = processed.replace(/\{\{#each\s+(\w+)\}\}(.*?)\{\{\/each\}\}/gs, (match, key, content) => {
    const array = variables[key];
    if (Array.isArray(array)) {
      return array.map(item => {
        let itemContent = content;
        Object.keys(item).forEach(itemKey => {
          itemContent = itemContent.replace(new RegExp(`\\{\\{${itemKey}\\}\\}`, 'g'), String(item[itemKey]));
        });
        return itemContent;
      }).join('');
    }
    return '';
  });

  // Handle else blocks {{else}}
  processed = processed.replace(/\{\{else\}\}(.*?)(?=\{\{\/if\}\})/gs, (match, content) => {
    return content;
  });

  return processed;
}

// Calculate days between dates
function calculateDaysUntilExpiry(expiryDate: string): number {
  const expiry = new Date(expiryDate);
  const now = new Date();
  const diffTime = expiry.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

// Get expiring employees (residency)
export function getExpiringEmployees(employees: Employee[]): Array<Employee & { expiryType: 'residency'; daysUntilExpiry: number }> {
  return employees
    .filter(emp => emp.residency_expiry_date)
    .map(emp => {
      const daysUntilExpiry = calculateDaysUntilExpiry(emp.residency_expiry_date!);
      return {
        ...emp,
        expiryType: 'residency' as const,
        daysUntilExpiry
      };
    })
    .filter(emp => emp.daysUntilExpiry <= 30); // Show items expiring within 30 days or already expired
}

// Get expiring documents
export function getExpiringDocuments(documents: Document[], employees: Employee[]): Array<Document & { employee?: Employee; expiryType: 'document'; daysUntilExpiry: number }> {
  const employeeMap = new Map(employees.map(emp => [emp.id, emp]));

  return documents
    .filter(doc => doc.expiry_date)
    .map(doc => {
      const daysUntilExpiry = calculateDaysUntilExpiry(doc.expiry_date!);
      return {
        ...doc,
        employee: doc.employee_id ? employeeMap.get(doc.employee_id) : undefined,
        expiryType: 'document' as const,
        daysUntilExpiry
      };
    })
    .filter(doc => doc.daysUntilExpiry <= 30); // Show items expiring within 30 days or already expired
}

// Generate individual employee email HTML content
export async function generateEmployeeEmailHTML(
  employee: Employee,
  expiringDocuments: Array<Document & { daysUntilExpiry: number; expiryType: 'document' }>
): Promise<string> {
  const template = await loadEmailTemplate('employee');
  if (!template) {
    // Fallback to simple text notification
    return `
      <div style="padding: 20px; font-family: Arial; direction: rtl;">
        <h2>مرحباً ${employee.name}!</h2>
        <p>لديك وثائق تحتاج إلى تجديد. يرجى مراجعة نظام ROMANI للتفاصيل.</p>
      </div>
    `;
  }

  const currentDate = format(new Date(), 'dd/MM/yyyy', { locale: ar });
  const hasResidencyExpiry = employee.residency_expiry_date && calculateDaysUntilExpiry(employee.residency_expiry_date) <= 30;

  let residencyData: any = null;
  if (hasResidencyExpiry) {
    const daysRemaining = calculateDaysUntilExpiry(employee.residency_expiry_date!);
    const statusClass = daysRemaining < 0 ? 'expired' : daysRemaining <= 7 ? 'critical' : 'warning';
    const statusText = daysRemaining < 0 ? 'منتهية الصلاحية' : daysRemaining <= 7 ? 'تنتهي خلال أسبوع' : 'تنتهي خلال شهر';

    residencyData = {
      residency_expiry_date: format(new Date(employee.residency_expiry_date!), 'dd/MM/yyyy'),
      residency_days_remaining: Math.abs(daysRemaining),
      residency_status_class: statusClass,
      residency_status_text: statusText
    };
  }

  const processedDocuments = expiringDocuments.map(doc => {
    const statusClass = doc.daysUntilExpiry < 0 ? 'expired' : doc.daysUntilExpiry <= 7 ? 'critical' : 'warning';
    const statusText = doc.daysUntilExpiry < 0 ? 'منتهية الصلاحية' : doc.daysUntilExpiry <= 7 ? 'تنتهي خلال أسبوع' : 'تنتهي خلال شهر';

    return {
      title: doc.title,
      expiry_date: doc.expiry_date ? format(new Date(doc.expiry_date), 'dd/MM/yyyy') : '-',
      days_remaining: Math.abs(doc.daysUntilExpiry),
      status_class: statusClass,
      status_text: statusText
    };
  });

  const variables = {
    current_date: currentDate,
    employee_name: employee.name,
    civil_id: employee.civil_id_no || '-',
    has_expired_items: [...expiringDocuments, ...(hasResidencyExpiry ? [{ daysUntilExpiry: calculateDaysUntilExpiry(employee.residency_expiry_date!) }] : [])].some(item => item.daysUntilExpiry < 0),
    residency_expiry: hasResidencyExpiry,
    expiring_documents: processedDocuments,
    contact_info: true,
    hr_email: 'hr@company.com',
    ...residencyData
  };

  return processTemplate(template, variables);
}

// Generate company-wide HTML email content using template
export async function generateCompanyEmailHTML(data: ExpiryData): Promise<string> {
  const template = await loadEmailTemplate('company');
  if (!template) {
    // Fallback to existing inline generation
    return generateEmailHTML(data);
  }

  const currentDate = format(new Date(), 'dd/MM/yyyy', { locale: ar });

  const generateEmployeeRows = (employees: ExpiryData['employees']) => {
    return employees.map(emp => {
      const statusClass = emp.daysUntilExpiry < 0 ? 'expired' : emp.daysUntilExpiry <= 7 ? 'critical' : 'warning';
      const statusText = emp.daysUntilExpiry < 0 ? 'منتهية الصلاحية' : emp.daysUntilExpiry <= 7 ? 'تنتهي خلال أسبوع' : 'تنتهي خلال شهر';

      return `
        <tr class="${statusClass}">
          <td>${emp.name}</td>
          <td>${emp.civil_id_no || '-'}</td>
          <td>${emp.residency_expiry_date ? format(new Date(emp.residency_expiry_date), 'dd/MM/yyyy') : '-'}</td>
          <td>${Math.abs(emp.daysUntilExpiry)} ${emp.daysUntilExpiry < 0 ? 'يوم (منتهية)' : 'يوم'}</td>
          <td><span class="status ${statusClass}">${statusText}</span></td>
        </tr>
      `;
    }).join('');
  };

  const generateDocumentRows = (documents: ExpiryData['documents']) => {
    return documents.map(doc => {
      const statusClass = doc.daysUntilExpiry < 0 ? 'expired' : doc.daysUntilExpiry <= 7 ? 'critical' : 'warning';
      const statusText = doc.daysUntilExpiry < 0 ? 'منتهية الصلاحية' : doc.daysUntilExpiry <= 7 ? 'تنتهي خلال أسبوع' : 'تنتهي خلال شهر';

      return `
        <tr class="${statusClass}">
          <td>${doc.title}</td>
          <td>${doc.employee?.name || '-'}</td>
          <td>${doc.expiry_date ? format(new Date(doc.expiry_date), 'dd/MM/yyyy') : '-'}</td>
          <td>${Math.abs(doc.daysUntilExpiry)} ${doc.daysUntilExpiry < 0 ? 'يوم (منتهية)' : 'يوم'}</td>
          <td><span class="status ${statusClass}">${statusText}</span></td>
        </tr>
      `;
    }).join('');
  };

  const variables = {
    current_date: currentDate,
    total_employees: data.employees.length,
    total_documents: data.documents.length,
    expired_count: [...data.employees, ...data.documents].filter(item => item.daysUntilExpiry < 0).length,
    critical_count: [...data.employees, ...data.documents].filter(item => item.daysUntilExpiry >= 0 && item.daysUntilExpiry <= 7).length,
    employee_rows: data.employees.length > 0 ? generateEmployeeRows(data.employees) : null,
    document_rows: data.documents.length > 0 ? generateDocumentRows(data.documents) : null
  };

  return processTemplate(template, variables);
}

// Generate HTML email content (legacy function for backward compatibility)
export function generateEmailHTML(data: ExpiryData): string {
  const currentDate = format(new Date(), 'dd/MM/yyyy', { locale: ar });

  const generateEmployeeRows = (employees: ExpiryData['employees']) => {
    return employees.map(emp => {
      const statusClass = emp.daysUntilExpiry < 0 ? 'expired' : emp.daysUntilExpiry <= 7 ? 'critical' : 'warning';
      const statusText = emp.daysUntilExpiry < 0 ? 'منتهية الصلاحية' : emp.daysUntilExpiry <= 7 ? 'تنتهي خلال أسبوع' : 'تنتهي خلال شهر';

      return `
        <tr class="${statusClass}">
          <td>${emp.name}</td>
          <td>${emp.civil_id_no || '-'}</td>
          <td>${emp.residency_expiry_date ? format(new Date(emp.residency_expiry_date), 'dd/MM/yyyy') : '-'}</td>
          <td>${Math.abs(emp.daysUntilExpiry)} ${emp.daysUntilExpiry < 0 ? 'يوم (منتهية)' : 'يوم'}</td>
          <td><span class="status ${statusClass}">${statusText}</span></td>
        </tr>
      `;
    }).join('');
  };

  const generateDocumentRows = (documents: ExpiryData['documents']) => {
    return documents.map(doc => {
      const statusClass = doc.daysUntilExpiry < 0 ? 'expired' : doc.daysUntilExpiry <= 7 ? 'critical' : 'warning';
      const statusText = doc.daysUntilExpiry < 0 ? 'منتهية الصلاحية' : doc.daysUntilExpiry <= 7 ? 'تنتهي خلال أسبوع' : 'تنتهي خلال شهر';

      return `
        <tr class="${statusClass}">
          <td>${doc.title}</td>
          <td>${doc.employee?.name || '-'}</td>
          <td>${doc.expiry_date ? format(new Date(doc.expiry_date), 'dd/MM/yyyy') : '-'}</td>
          <td>${Math.abs(doc.daysUntilExpiry)} ${doc.daysUntilExpiry < 0 ? 'يوم (منتهية)' : 'يوم'}</td>
          <td><span class="status ${statusClass}">${statusText}</span></td>
        </tr>
      `;
    }).join('');
  };

  return `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>تقرير انتهاء صلاحية الوثائق والإقامات - نظام ROMANI</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #f5f5f5;
            color: #333;
            line-height: 1.6;
            direction: rtl;
        }

        .email-container {
            max-width: 800px;
            margin: 20px auto;
            background: white;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }

        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }

        .header h1 {
            font-size: 28px;
            margin-bottom: 10px;
        }

        .header p {
            font-size: 16px;
            opacity: 0.9;
        }

        .content {
            padding: 30px;
        }

        .alert {
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            color: #856404;
            padding: 15px;
            border-radius: 6px;
            margin-bottom: 25px;
            text-align: center;
            font-weight: bold;
        }

        .section {
            margin-bottom: 35px;
        }

        .section-title {
            font-size: 22px;
            color: #2c3e50;
            margin-bottom: 15px;
            padding-bottom: 8px;
            border-bottom: 2px solid #3498db;
        }

        .table-container {
            overflow-x: auto;
            margin-bottom: 20px;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            background: white;
            border-radius: 6px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        th {
            background: #34495e;
            color: white;
            padding: 12px;
            text-align: right;
            font-weight: bold;
            font-size: 14px;
        }

        td {
            padding: 12px;
            border-bottom: 1px solid #ecf0f1;
            text-align: right;
        }

        tr:hover {
            background-color: #f8f9fa;
        }

        .expired {
            background-color: #ffebee !important;
        }

        .critical {
            background-color: #fff3e0 !important;
        }

        .warning {
            background-color: #f3e5f5 !important;
        }

        .status {
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: bold;
            text-align: center;
            display: inline-block;
            min-width: 80px;
        }

        .status.expired {
            background: #f44336;
            color: white;
        }

        .status.critical {
            background: #ff9800;
            color: white;
        }

        .status.warning {
            background: #9c27b0;
            color: white;
        }

        .summary {
            background: #e8f5e8;
            padding: 20px;
            border-radius: 6px;
            margin-bottom: 25px;
        }

        .summary-item {
            display: inline-block;
            margin: 5px 15px;
            padding: 8px 15px;
            background: white;
            border-radius: 20px;
            font-weight: bold;
        }

        .footer {
            background: #ecf0f1;
            padding: 20px;
            text-align: center;
            color: #7f8c8d;
            border-top: 1px solid #bdc3c7;
        }

        .no-data {
            text-align: center;
            padding: 40px;
            color: #27ae60;
            font-size: 18px;
            background: #d5f4e6;
            border-radius: 6px;
            margin: 20px 0;
        }

        @media (max-width: 600px) {
            .email-container {
                margin: 10px;
                border-radius: 0;
            }

            .header, .content {
                padding: 20px;
            }

            .header h1 {
                font-size: 24px;
            }

            table {
                font-size: 12px;
            }

            th, td {
                padding: 8px 4px;
            }

            .summary-item {
                display: block;
                margin: 5px 0;
            }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <h1>🔔 تقرير انتهاء صلاحية الوثائق والإقامات</h1>
            <p>نظام إدارة الموظفين والوثائق - ROMANI</p>
            <p>تاريخ التقرير: ${currentDate}</p>
        </div>

        <div class="content">
            <div class="alert">
                ⚠️ هذا تقرير تلقائي لتنبيهك بالوثائق والإقامات التي تنتهي صلاحيتها قريباً أو انتهت صلاحيتها بالفعل
            </div>

            <div class="summary">
                <div class="summary-item">📋 إجمالي الإقامات: ${data.employees.length}</div>
                <div class="summary-item">📄 إجمالي الوثائق: ${data.documents.length}</div>
                <div class="summary-item">🔴 منتهية الصلاحية: ${[...data.employees, ...data.documents].filter(item => item.daysUntilExpiry < 0).length}</div>
                <div class="summary-item">🟡 تنتهي خلال أسبوع: ${[...data.employees, ...data.documents].filter(item => item.daysUntilExpiry >= 0 && item.daysUntilExpiry <= 7).length}</div>
            </div>

            ${data.employees.length > 0 ? `
            <div class="section">
                <h2 class="section-title">📋 انتهاء صلاحية الإقامات</h2>
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>اسم الموظف</th>
                                <th>رقم الهوية المدنية</th>
                                <th>تاريخ انتهاء الإقامة</th>
                                <th>المدة المتبقية</th>
                                <th>الحالة</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${generateEmployeeRows(data.employees)}
                        </tbody>
                    </table>
                </div>
            </div>
            ` : '<div class="no-data">✅ لا توجد إقامات تنتهي صلاحيتها خلال الشهر القادم</div>'}

            ${data.documents.length > 0 ? `
            <div class="section">
                <h2 class="section-title">📄 انتهاء صلاحية الوثائق</h2>
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>اسم الوثيقة</th>
                                <th>الموظف</th>
                                <th>تاريخ انتهاء الصلاحية</th>
                                <th>المدة المتبقية</th>
                                <th>الحالة</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${generateDocumentRows(data.documents)}
                        </tbody>
                    </table>
                </div>
            </div>
            ` : '<div class="no-data">✅ لا توجد وثائق تنتهي صلاحيتها خلال الشهر القادم</div>'}
        </div>

        <div class="footer">
            <p>🤖 تم إنشاء هذا التقرير تلقائياً بواسطة نظام ROMANI لإدارة الموظفين والوثائق</p>
            <p>للاستفسارات والدعم الفني، يرجى التواصل مع قسم تقنية المعلومات</p>
        </div>
    </div>
</body>
</html>
  `;
}

// Send individual employee notification
export async function sendEmployeeExpiryNotification(
  employee: Employee,
  expiringDocuments: Array<Document & { daysUntilExpiry: number; expiryType: 'document' }>,
  settings: EmailNotificationSettings
): Promise<{ success: boolean; message: string }> {
  if (!settings.enabled) {
    return { success: false, message: 'Email notifications are disabled' };
  }

  try {
    const htmlContent = await generateEmployeeEmailHTML(employee, expiringDocuments);
    const totalItems = expiringDocuments.length + (employee.residency_expiry_date && calculateDaysUntilExpiry(employee.residency_expiry_date) <= 30 ? 1 : 0);

    const templateParams = {
      to_email: employee.email || settings.emailRecipient,
      from_name: 'نظام ROMANI',
      subject: `🔔 تنبيه شخصي - انتهاء صلاحية الوثائق - ${employee.name}`,
      html_content: htmlContent,
      summary: `تنبيه شخصي للموظف ${employee.name} - ${totalItems} عنصر يحتاج تجديد`,
      recipient_email: employee.email || settings.emailRecipient
    };

    const response = await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_ID,
      templateParams
    );

    if (response.status === 200) {
      return { success: true, message: `تم إرسال التنبيه الشخصي للموظف ${employee.name} بنجاح` };
    } else {
      return { success: false, message: 'فشل في إرسال التنبيه الشخصي' };
    }
  } catch (error) {
    console.error('Employee email sending error:', error);

    if (error instanceof Error && error.message.includes('400')) {
      return {
        success: false,
        message: 'خطأ في إعدادات EmailJS - يرجى التحقق من صحة بيانات الاعتماد في ملف .env'
      };
    }

    return { success: false, message: `خطأ في الإرسال: ${error instanceof Error ? error.message : 'خطأ غير معروف'}` };
  }
}

// Send company-wide email notification using template
export async function sendCompanyExpiryNotification(
  data: ExpiryData,
  settings: EmailNotificationSettings
): Promise<{ success: boolean; message: string }> {
  if (!settings.enabled) {
    return { success: false, message: 'Email notifications are disabled' };
  }

  try {
    const htmlContent = await generateCompanyEmailHTML(data);
    const totalItems = data.employees.length + data.documents.length;
    const expiredItems = [...data.employees, ...data.documents].filter(item => item.daysUntilExpiry < 0).length;
    const criticalItems = [...data.employees, ...data.documents].filter(item => item.daysUntilExpiry >= 0 && item.daysUntilExpiry <= 7).length;

    const templateParams = {
      to_email: settings.emailRecipient,
      from_name: 'نظام ROMANI',
      subject: `🔔 تقرير الشركة - انتهاء صلاحية الوثائق والإقامات - ${format(new Date(), 'dd/MM/yyyy')}`,
      html_content: htmlContent,
      summary: `إجمالي العناصر: ${totalItems} | منتهية الصلاحية: ${expiredItems} | حرجة: ${criticalItems}`,
      recipient_email: settings.emailRecipient
    };

    const response = await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_ID,
      templateParams
    );

    if (response.status === 200) {
      return { success: true, message: 'تم إرسال التقرير الشامل بنجاح' };
    } else {
      return { success: false, message: 'فشل في إرسال التقرير الشامل' };
    }
  } catch (error) {
    console.error('Company email sending error:', error);

    if (error instanceof Error && error.message.includes('400')) {
      return {
        success: false,
        message: 'خطأ في إعدادات EmailJS - يرجى التحقق من صحة بيانات الاعتماد في ملف .env'
      };
    }

    return { success: false, message: `خطأ في الإرسال: ${error instanceof Error ? error.message : 'خطأ غير معروف'}` };
  }
}

// Send email notification (legacy function for backward compatibility)
export async function sendExpiryNotification(
  data: ExpiryData,
  settings: EmailNotificationSettings
): Promise<{ success: boolean; message: string }> {
  if (!settings.enabled) {
    return { success: false, message: 'Email notifications are disabled' };
  }

  try {
    const htmlContent = generateEmailHTML(data);
    const totalItems = data.employees.length + data.documents.length;
    const expiredItems = [...data.employees, ...data.documents].filter(item => item.daysUntilExpiry < 0).length;
    const criticalItems = [...data.employees, ...data.documents].filter(item => item.daysUntilExpiry >= 0 && item.daysUntilExpiry <= 7).length;

    const templateParams = {
      to_email: settings.emailRecipient,
      from_name: 'نظام ROMANI',
      subject: `🔔 تنبيه: انتهاء صلاحية الوثائق والإقامات - ${format(new Date(), 'dd/MM/yyyy')}`,
      html_content: htmlContent,
      summary: `إجمالي العناصر: ${totalItems} | منتهية الصلاحية: ${expiredItems} | حرجة: ${criticalItems}`,
      recipient_email: settings.emailRecipient
    };

    const response = await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_ID,
      templateParams
    );

    if (response.status === 200) {
      return { success: true, message: 'تم إرسال التقرير بنجاح' };
    } else {
      return { success: false, message: 'فشل في إرسال التقرير' };
    }
  } catch (error) {
    console.error('Email sending error:', error);

    // Check if the error is due to invalid EmailJS credentials
    if (error instanceof Error && error.message.includes('400')) {
      return {
        success: false,
        message: 'خطأ في إعدادات EmailJS - يرجى التحقق من صحة بيانات الاعتماد في ملف .env (Service ID, Template ID, Public Key)'
      };
    }

    return { success: false, message: `خطأ في الإرسال: ${error instanceof Error ? error.message : 'خطأ غير معروف'}` };
  }
}

// Send individual notifications to employees with expiring items
export async function sendIndividualEmployeeNotifications(
  employees: Employee[],
  documents: Document[],
  settings: EmailNotificationSettings
): Promise<{ success: boolean; results: Array<{ employee: string; success: boolean; message: string }> }> {
  if (!settings.enabled) {
    return { success: false, results: [] };
  }

  const results: Array<{ employee: string; success: boolean; message: string }> = [];
  const employeeMap = new Map(employees.map(emp => [emp.id, emp]));

  // Group documents by employee
  const documentsByEmployee = new Map<string, Array<Document & { daysUntilExpiry: number; expiryType: 'document' }>>();

  const expiringDocuments = getExpiringDocuments(documents, employees);
  expiringDocuments.forEach(doc => {
    if (doc.employee_id) {
      if (!documentsByEmployee.has(doc.employee_id)) {
        documentsByEmployee.set(doc.employee_id, []);
      }
      documentsByEmployee.get(doc.employee_id)!.push(doc);
    }
  });

  // Check each employee for expiring items
  for (const employee of employees) {
    const hasExpiringResidency = employee.residency_expiry_date &&
      calculateDaysUntilExpiry(employee.residency_expiry_date) <= 30;

    const employeeExpiringDocs = documentsByEmployee.get(employee.id) || [];

    if (hasExpiringResidency || employeeExpiringDocs.length > 0) {
      try {
        const result = await sendEmployeeExpiryNotification(employee, employeeExpiringDocs, settings);
        results.push({
          employee: employee.name,
          success: result.success,
          message: result.message
        });
      } catch (error) {
        results.push({
          employee: employee.name,
          success: false,
          message: `خطأ في الإرسال: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`
        });
      }
    }
  }

  const successCount = results.filter(r => r.success).length;
  return {
    success: results.length > 0 && successCount > 0,
    results
  };
}

// Enhanced notification checking with both individual and company-wide options
export async function checkAndSendNotifications(
  employees: Employee[],
  documents: Document[],
  settings: EmailNotificationSettings,
  options: {
    sendIndividual?: boolean;
    sendCompanyReport?: boolean;
  } = { sendIndividual: false, sendCompanyReport: true }
): Promise<void> {
  if (!settings.enabled) return;

  const expiringEmployees = getExpiringEmployees(employees);
  const expiringDocuments = getExpiringDocuments(documents, employees);

  const shouldSendMonthly = settings.monthlyReminder && [...expiringEmployees, ...expiringDocuments].some(item => item.daysUntilExpiry <= 30 && item.daysUntilExpiry > 7);
  const shouldSendWeekly = settings.weeklyReminder && [...expiringEmployees, ...expiringDocuments].some(item => item.daysUntilExpiry <= 7 && item.daysUntilExpiry >= 0);
  const shouldSendExpired = settings.expiredNotification && [...expiringEmployees, ...expiringDocuments].some(item => item.daysUntilExpiry < 0);

  if (shouldSendMonthly || shouldSendWeekly || shouldSendExpired) {

    // Send individual notifications if requested
    if (options.sendIndividual) {
      const individualResults = await sendIndividualEmployeeNotifications(employees, documents, settings);
      console.log('Individual notification results:', individualResults);
    }

    // Send company-wide report if requested
    if (options.sendCompanyReport) {
      const data: ExpiryData = {
        employees: expiringEmployees,
        documents: expiringDocuments
      };

      await sendCompanyExpiryNotification(data, settings);
    }
  }
}

// Legacy function for backward compatibility
export async function checkAndSendNotificationsLegacy(
  employees: Employee[],
  documents: Document[],
  settings: EmailNotificationSettings
): Promise<void> {
  if (!settings.enabled) return;

  const expiringEmployees = getExpiringEmployees(employees);
  const expiringDocuments = getExpiringDocuments(documents, employees);

  const shouldSendMonthly = settings.monthlyReminder && [...expiringEmployees, ...expiringDocuments].some(item => item.daysUntilExpiry <= 30 && item.daysUntilExpiry > 7);
  const shouldSendWeekly = settings.weeklyReminder && [...expiringEmployees, ...expiringDocuments].some(item => item.daysUntilExpiry <= 7 && item.daysUntilExpiry >= 0);
  const shouldSendExpired = settings.expiredNotification && [...expiringEmployees, ...expiringDocuments].some(item => item.daysUntilExpiry < 0);

  if (shouldSendMonthly || shouldSendWeekly || shouldSendExpired) {
    const data: ExpiryData = {
      employees: expiringEmployees,
      documents: expiringDocuments
    };

    await sendExpiryNotification(data, settings);
  }
}