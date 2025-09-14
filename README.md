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
│   └── jsonDatabase.ts # localStorage database implementation
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

- **v1.0.0**: Initial release with core functionality
- Employee and document management
- Bilingual interface support
- localStorage database implementation
- Authentication system

---

**Note**: This application is designed for internal use and requires proper security hardening before production deployment with sensitive data.