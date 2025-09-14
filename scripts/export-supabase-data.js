import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const SUPABASE_URL = "https://xwgdkbulehhtrjjoglkb.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh3Z2RrYnVsZWhodHJqam9nbGtiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyNzc4MjQsImV4cCI6MjA3MTg1MzgyNH0.VdsvEqbWwOmkfRhau2u6S5wVwgK9V1dV1wVrl6s34wY";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function exportAllData() {
  try {
    console.log('🔄 Starting Supabase data export...');
    
    const exportData = {
      companies: [],
      ministries: [],
      document_types: [],
      positions: [], // Will be extracted from enum
      employees: [],
      documents: [],
      admin_users: [],
      metadata: {
        exportDate: new Date().toISOString(),
        version: '1.0.0',
        source: 'supabase-migration'
      }
    };

    // Export companies
    console.log('📊 Exporting companies...');
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select('*')
      .order('created_at');
    
    if (companiesError) throw companiesError;
    exportData.companies = companies || [];
    console.log(`✅ Exported ${exportData.companies.length} companies`);

    // Export ministries
    console.log('🏛️ Exporting ministries...');
    const { data: ministries, error: ministriesError } = await supabase
      .from('ministries')
      .select('*')
      .order('created_at');
    
    if (ministriesError) throw ministriesError;
    exportData.ministries = ministries || [];
    console.log(`✅ Exported ${exportData.ministries.length} ministries`);

    // Export document types
    console.log('📄 Exporting document types...');
    const { data: documentTypes, error: documentTypesError } = await supabase
      .from('document_types')
      .select('*')
      .order('created_at');
    
    if (documentTypesError) throw documentTypesError;
    exportData.document_types = documentTypes || [];
    console.log(`✅ Exported ${exportData.document_types.length} document types`);

    // Export employees with company relationships
    console.log('👥 Exporting employees...');
    const { data: employees, error: employeesError } = await supabase
      .from('employees')
      .select(`
        *,
        companies (
          id,
          name,
          name_ar,
          description
        )
      `)
      .order('created_at');
    
    if (employeesError) throw employeesError;
    exportData.employees = employees || [];
    console.log(`✅ Exported ${exportData.employees.length} employees`);

    // Export documents with all relationships
    console.log('📋 Exporting documents...');
    const { data: documents, error: documentsError } = await supabase
      .from('documents')
      .select(`
        *,
        companies (
          id,
          name,
          name_ar,
          description
        ),
        employees (
          id,
          name,
          email,
          companies (
            id,
            name,
            name_ar
          )
        ),
        document_types (
          id,
          name,
          name_ar
        ),
        ministries (
          id,
          name,
          name_ar
        )
      `)
      .order('created_at');
    
    if (documentsError) throw documentsError;
    exportData.documents = documents || [];
    console.log(`✅ Exported ${exportData.documents.length} documents`);

    // Export admin users (excluding sensitive data)
    console.log('🔐 Exporting admin users...');
    const { data: adminUsers, error: adminUsersError } = await supabase
      .from('admin_users')
      .select('id, username, created_at')
      .order('created_at');
    
    if (adminUsersError) throw adminUsersError;
    exportData.admin_users = adminUsers || [];
    console.log(`✅ Exported ${exportData.admin_users.length} admin users`);

    // Add position enum values
    exportData.positions = [
      { id: 'position_1', name: 'مدير', name_ar: 'مدير', value: 'مدير' },
      { id: 'position_2', name: 'مندوب طبي', name_ar: 'مندوب طبي', value: 'مندوب طبي' },
      { id: 'position_3', name: 'مندوب شؤون', name_ar: 'مندوب شؤون', value: 'مندوب شؤون' },
      { id: 'position_4', name: 'سائق', name_ar: 'سائق', value: 'سائق' },
      { id: 'position_5', name: 'محاسب', name_ar: 'محاسب', value: 'محاسب' },
      { id: 'position_6', name: 'سكرتير', name_ar: 'سكرتير', value: 'سكرتير' }
    ];

    // Ensure the data directory exists
    const dataDir = path.resolve(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    // Write the export data to JSON file
    const exportPath = path.join(dataDir, 'supabase-export.json');
    fs.writeFileSync(exportPath, JSON.stringify(exportData, null, 2));

    // Also create a backup with timestamp
    const backupPath = path.join(dataDir, `supabase-backup-${Date.now()}.json`);
    fs.writeFileSync(backupPath, JSON.stringify(exportData, null, 2));

    console.log('🎉 Data export completed successfully!');
    console.log(`📁 Main export file: ${exportPath}`);
    console.log(`💾 Backup file: ${backupPath}`);
    console.log('\n📊 Export Summary:');
    console.log(`- Companies: ${exportData.companies.length}`);
    console.log(`- Employees: ${exportData.employees.length}`);
    console.log(`- Documents: ${exportData.documents.length}`);
    console.log(`- Document Types: ${exportData.document_types.length}`);
    console.log(`- Ministries: ${exportData.ministries.length}`);
    console.log(`- Admin Users: ${exportData.admin_users.length}`);
    console.log(`- Positions: ${exportData.positions.length}`);

    return exportData;

  } catch (error) {
    console.error('❌ Error exporting data:', error);
    throw error;
  }
}

// Run the export
exportAllData().catch(console.error);