import { Link } from 'react-router-dom';
import { Sun, Moon, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/hooks/useTheme';

export function Header() {
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setMobileMenuOpen(false);
  };

  return (
    <header className="fixed top-4 left-4 right-4 z-50">
      <div className="max-w-7xl mx-auto">
        <div className="card-container glass-effect px-6 py-4">
          <nav className="flex items-center justify-between">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3">
              <img src="/images/logo.png" alt="GOTOHOME" className="w-10 h-10 object-contain" />
              <span className="font-display text-xl font-semibold text-foreground">GOTOHOME</span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
              <button
                onClick={() => scrollToSection('hero')}
                className="text-muted-foreground hover:text-foreground smooth-transition"
              >
                Головна
              </button>
              <button
                onClick={() => scrollToSection('about')}
                className="text-muted-foreground hover:text-foreground smooth-transition"
              >
                Про нас
              </button>
              <button
                onClick={() => scrollToSection('contact')}
                className="text-muted-foreground hover:text-foreground smooth-transition"
              >
                Зв'язок
              </button>
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                className="rounded-full"
              >
                {theme === 'dark' ? (
                  <Sun className="h-5 w-5" />
                ) : (
                  <Moon className="h-5 w-5" />
                )}
              </Button>

              <div className="hidden md:flex items-center gap-2">
                <Button variant="ghost" asChild>
                  <Link to="/auth?mode=login">Вхід</Link>
                </Button>
                <Button variant="nav" asChild>
                  <Link to="/auth?mode=register">Реєстрація</Link>
                </Button>
              </div>

              {/* Mobile Menu Button */}
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden rounded-full"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </nav>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden mt-4 pt-4 border-t border-border">
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => scrollToSection('hero')}
                  className="text-left text-muted-foreground hover:text-foreground py-2"
                >
                  Головна
                </button>
                <button
                  onClick={() => scrollToSection('about')}
                  className="text-left text-muted-foreground hover:text-foreground py-2"
                >
                  Про нас
                </button>
                <button
                  onClick={() => scrollToSection('contact')}
                  className="text-left text-muted-foreground hover:text-foreground py-2"
                >
                  Зв'язок
                </button>
                <div className="flex gap-2 pt-2">
                  <Button variant="ghost" className="flex-1" asChild>
                    <Link to="/auth?mode=login">Вхід</Link>
                  </Button>
                  <Button variant="nav" className="flex-1" asChild>
                    <Link to="/auth?mode=register">Реєстрація</Link>
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
