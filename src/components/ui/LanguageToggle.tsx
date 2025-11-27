import React from 'react';
import { Button } from './button';
import { useLanguage } from '@/contexts/LanguageContext';
import { Globe } from 'lucide-react';

export const LanguageToggle: React.FC = () => {
  const { language, setLanguage } = useLanguage();

  const toggleLanguage = () => {
    setLanguage(language === 'ar' ? 'en' : 'ar');
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={toggleLanguage}
      className="flex items-center space-x-2 min-w-[80px]"
      title={language === 'ar' ? 'Switch to English' : 'التبديل إلى العربية'}
    >
      <Globe className="h-4 w-4" />
      <span className="font-semibold">
        {language === 'ar' ? 'EN' : 'عر'}
      </span>
    </Button>
  );
};