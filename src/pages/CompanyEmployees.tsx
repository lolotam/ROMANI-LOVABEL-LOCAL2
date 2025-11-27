import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Users, Building2, Phone, Mail, Calendar, User } from "lucide-react";
import { jsonDatabase, Employee, Company } from "@/lib/jsonDatabase";

export default function CompanyEmployees() {
  const { companyId } = useParams<{ companyId: string }>();
  const navigate = useNavigate();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!companyId) return;

      setLoading(true);
      try {
        // Fetch company info
        const { data: companyData } = await jsonDatabase
          .from<Company>('companies')
          .eq('id', companyId)
          .execute();

        if (companyData && companyData.length > 0) {
          setCompany(companyData[0]);
        }

        // Fetch employees for this company
        const { data: employeeData } = await jsonDatabase
          .from<Employee>('employees')
          .eq('company_id', companyId)
          .order('name', 'asc')
          .execute();

        setEmployees(employeeData || []);
      } catch (error) {
        console.error('Error fetching company employees:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [companyId]);

  const handleEmployeeClick = (employeeId: string) => {
    navigate(`/employees/${employeeId}`);
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">جارٍ التحميل...</div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center text-red-500">الشركة غير موجودة</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Company Header */}
      <div className="flex items-center space-x-4 rtl:space-x-reverse">
        <div className="p-3 bg-primary/10 rounded-lg">
          <Building2 className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">{company.name_ar}</h1>
          <p className="text-muted-foreground">{company.name}</p>
        </div>
      </div>

      {/* Employees Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            <Users className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold">موظفي الشركة</h2>
            <Badge variant="secondary">{employees.length}</Badge>
          </div>
        </div>

        {employees.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">لا توجد موظفين</h3>
              <p className="text-muted-foreground">لم يتم إضافة أي موظفين لهذه الشركة بعد</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {employees.map((employee) => (
              <Card
                key={employee.id}
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => handleEmployeeClick(employee.id)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center space-x-3 rtl:space-x-reverse">
                    <Avatar>
                      <AvatarFallback>
                        {employee.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <CardTitle className="text-lg">{employee.name}</CardTitle>
                      {employee.position && (
                        <Badge variant="outline" className="mt-1">
                          {employee.position}
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-2">
                  {employee.phone && (
                    <div className="flex items-center space-x-2 rtl:space-x-reverse text-sm text-muted-foreground">
                      <Phone className="h-4 w-4" />
                      <span>{employee.phone}</span>
                    </div>
                  )}

                  {employee.email && (
                    <div className="flex items-center space-x-2 rtl:space-x-reverse text-sm text-muted-foreground">
                      <Mail className="h-4 w-4" />
                      <span>{employee.email}</span>
                    </div>
                  )}

                  {employee.hire_date && (
                    <div className="flex items-center space-x-2 rtl:space-x-reverse text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>تاريخ التوظيف: {new Date(employee.hire_date).toLocaleDateString('ar-SA')}</span>
                    </div>
                  )}

                  <div className="pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEmployeeClick(employee.id);
                      }}
                    >
                      <User className="h-4 w-4 ml-2" />
                      عرض الملف الشخصي
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}