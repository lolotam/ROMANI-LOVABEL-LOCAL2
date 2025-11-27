import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/contexts/ThemeProvider';
import { useLanguage } from '@/contexts/LanguageContext';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';

interface ThemeToggleProps {
    collapsed?: boolean;
}

export function ThemeToggle({ collapsed = false }: ThemeToggleProps) {
    const { theme, toggleTheme } = useTheme();
    const { t } = useLanguage();

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        variant="ghost"
                        size={collapsed ? 'icon' : 'default'}
                        onClick={toggleTheme}
                        className={`${collapsed ? 'w-10 h-10' : 'w-full'
                            } transition-all duration-200 hover:bg-accent/50`}
                    >
                        {theme === 'dark' ? (
                            <Sun className={`h-5 w-5 ${collapsed ? '' : 'ml-2'} transition-transform duration-300 rotate-0 hover:rotate-180`} />
                        ) : (
                            <Moon className={`h-5 w-5 ${collapsed ? '' : 'ml-2'} transition-transform duration-300 rotate-0 hover:-rotate-12`} />
                        )}
                        {!collapsed && (
                            <span className="font-medium">
                                {theme === 'dark' ? t('theme.light') : t('theme.dark')}
                            </span>
                        )}
                    </Button>
                </TooltipTrigger>
                <TooltipContent side="left">
                    <p>{theme === 'dark' ? t('theme.light') : t('theme.dark')}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}
