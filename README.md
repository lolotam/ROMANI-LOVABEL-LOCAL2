# ROMANI Employee and Document Management System

A comprehensive bilingual (Arabic/English) web application for managing employees and documents with advanced filtering, search, and administrative capabilities.

## 🌟 Features

### Employee Management
- **Employee Registration**: Add new employees with detailed information
- **Dynamic Table View**: Sortable and filterable employee list with numbering column
- **Search & Filter**: Advanced search by name, position, company, and status
- **Employee Profiles**: Complete employee information including contact details, hire date, civil ID, and residency expiry

### Document Management
- **Document Upload**: File upload with drag-and-drop support
- **Document Categorization**: Organize by document types and ministries
- **Expiry Tracking**: Automatic status calculation (Valid, Expiring Soon, Expired)
- **Document Search**: Filter by employee, company, document type, and ministry
- **Status Management**: Visual indicators for document validity

### Administrative Settings
- **Company Management**: Create and manage company profiles
- **Ministry Configuration**: Manage government ministries and departments
- **Document Types**: Define custom document categories
- **Position Management**: Configure employee positions and roles
- **Email Configuration**: Set up SMTP settings and email templates

### Email Notification System
- **Automated Notifications**: Send email alerts for document expiry and system events
- **Custom Templates**: HTML email templates for different notification types
- **Employee & Company Alerts**: Separate notification workflows
- **EmailJS Integration**: Client-side email sending with fallback SMTP support
- **Template Customization**: Editable HTML email templates with dynamic content

### Authentication & Security
- **Secure Login**: Admin authentication system
- **Session Management**: Persistent login sessions
- **Access Control**: Protected routes for authenticated users only

### Bilingual Support
- **Arabic Interface**: Full RTL (Right-to-Left) support
- **English Interface**: LTR (Left-to-Right) layout
- **Dynamic Switching**: Seamless language switching

## 🚀 Technology Stack

- **Frontend**: React 18 with TypeScript
- **Build Tool**: Vite
- **UI Framework**: shadcn/ui components
- **Styling**: Tailwind CSS
- **Forms**: React Hook Form with Zod validation
- **Routing**: React Router DOM
- **State Management**: React Query (TanStack Query)
- **Database**: Browser localStorage with JSON structure
- **Email Service**: EmailJS & Nodemailer for notifications
- **Icons**: Lucide React
- **Animations**: Framer Motion

## 📋 Prerequisites

- Node.js (v16 or higher)
- npm or yarn package manager
- Modern web browser with localStorage support

## 🔧 Installation

### Clone the Repository
```bash
git clone https://github.com/lolotam/ROMANI-LOVABEL-LOCAL2.git
cd ROMANI-LOVABEL-LOCAL2
```

### Install Dependencies
```bash
npm install
```

### Start Development Server
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## 🏗️ Build & Deployment

### Development Build
```bash
npm run build:dev
```

### Production Build
```bash
npm run build
```

### Preview Production Build
```bash
npm run preview
```

### Linting
```bash
npm run lint
```

## 🔐 Authentication

### Default Admin Credentials
- **Username**: `Admin`
- **Password**: `@Xx123456789xX@`

> **Note**: For production deployment, update authentication credentials in `src/hooks/useAuth.tsx`

## 🗂️ Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # shadcn/ui components
│   ├── DocumentForm.tsx # Document creation form
│   └── ...
├── pages/              # Main application pages
│   ├── Login.tsx       # Authentication page
│   ├── Dashboard.tsx   # Main dashboard
│   ├── Employees.tsx   # Employee management
│   ├── Documents.tsx   # Document management
│   └── Settings.tsx    # Administrative settings
├── hooks/              # Custom React hooks
│   └── useAuth.tsx     # Authentication logic
├── lib/                # Utility libraries
│   ├── jsonDatabase.ts # localStorage database implementation
│   └── emailService.ts # Email notification service
├── email-template-employee.html  # Employee notification template
├── email-template-company.html   # Company notification template
└── App.tsx             # Main application component
```

## 💾 Database Structure

The application uses a browser-based JSON database stored in localStorage with the following entities:

- **Companies**: Organization profiles
- **Ministries**: Government departments
- **Document Types**: Document categories
- **Positions**: Employee roles
- **Employees**: Staff information
- **Documents**: File records with metadata
- **Admin Users**: Authentication data

## 🌐 Deployment Options

### Option 1: Static Hosting (Recommended)
1. Build the project: `npm run build`
2. Deploy the `dist` folder to any static hosting service:
   - Vercel
   - Netlify
   - GitHub Pages
   - Firebase Hosting
   - AWS S3 + CloudFront

### Option 2: Docker Container
See the included `docker-compose.yml` file for containerized deployment.

### Option 3: Traditional Web Server
Deploy the built files to any web server (Apache, Nginx, IIS).

## 🔧 Configuration

### Environment Variables
Create a `.env` file for custom configuration:
```
VITE_APP_NAME=ROMANI Management System
VITE_DB_KEY=romani_json_database

# EmailJS Configuration (optional)
VITE_EMAILJS_SERVICE_ID=your_service_id
VITE_EMAILJS_TEMPLATE_ID=your_template_id
VITE_EMAILJS_PUBLIC_KEY=your_public_key

# SMTP Configuration (optional - for server-side email)
VITE_SMTP_HOST=smtp.gmail.com
VITE_SMTP_PORT=587
VITE_SMTP_USER=your_email@gmail.com
VITE_SMTP_PASS=your_app_password
```

### Database Initialization
The application automatically initializes with empty database structure. To populate with existing data:
1. Export data to `public/data/database.json`
2. The app will load this data on first run

## 📱 Browser Compatibility

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
- Mobile browsers with modern JavaScript support

## 🔒 Security Considerations

- **Client-Side Storage**: Data is stored in localStorage (not suitable for sensitive production data)
- **Authentication**: Currently uses hardcoded credentials (update for production)
- **File Upload**: Files are converted to base64 and stored locally
- **HTTPS Required**: Use HTTPS in production for security

## 🛠️ Development

### Adding New Features
1. Follow existing code structure and patterns
2. Use TypeScript for type safety
3. Follow shadcn/ui component guidelines
4. Update database schema in `jsonDatabase.ts` if needed

### Testing
- Use browser developer tools for debugging
- Test localStorage functionality
- Verify responsive design on different screen sizes

## 📄 API Reference

The application uses a localStorage-based database with the following main methods:

```typescript
// Query data
const result = await jsonDatabase.from('employees')
  .select('*')
  .eq('company_id', companyId)
  .execute();

// Insert data
const result = await jsonDatabase.insert('employees', employeeData);

// Update data
const result = await jsonDatabase.update('employees', id, updates);

// Delete data
const result = await jsonDatabase.delete('employees', id);
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Commit changes: `git commit -am 'Add new feature'`
4. Push to branch: `git push origin feature/new-feature`
5. Submit a pull request

## 📞 Support

For technical support or feature requests:
- Create an issue in the GitHub repository
- Contact the development team

## 📝 License

This project is proprietary software developed for ROMANI organization.

## 🔄 Version History

- **v1.1.0**: Email notification system
  - EmailJS integration for client-side emails
  - Custom HTML email templates
  - SMTP fallback configuration
  - Automated document expiry notifications

- **v1.0.0**: Initial release with core functionality
  - Employee and document management
  - Bilingual interface support
  - localStorage database implementation
  - Authentication system

## 📦 Dependencies

See [DEPENDENCIES.md](./DEPENDENCIES.md) for a complete list of all production and development dependencies, including version requirements and configuration details.

---

**Note**: This application is designed for internal use and requires proper security hardening before production deployment with sensitive data.# Webhook Test
Webhook test after firewall fix - Mon, Sep 15, 2025  1:32:20 AM
Testing async webhook - Mon, Sep 15, 2025  1:36:38 AM
