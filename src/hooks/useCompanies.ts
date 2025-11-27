import { useState, useEffect } from "react";
import { jsonDatabase, Company } from "@/lib/jsonDatabase";

export function useCompanies() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: queryError } = await jsonDatabase
        .from<Company>('companies')
        .order('name_ar', 'asc')
        .execute();

      if (queryError) {
        throw queryError;
      }

      setCompanies(data || []);
    } catch (err) {
      console.error('Error fetching companies:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  // Refresh companies (useful after adding new companies)
  const refetch = () => {
    fetchCompanies();
  };

  return {
    companies,
    loading,
    error,
    refetch
  };
}