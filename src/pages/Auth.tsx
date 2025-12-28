import { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useTheme } from '@/hooks/useTheme';
import { Sun, Moon, ArrowLeft, Eye, EyeOff } from 'lucide-react';

export default function Auth() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const mode = searchParams.get('mode') || 'login';
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const isLogin = mode === 'login';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim() || !password.trim()) {
      toast({
        title: 'Помилка',
        description: 'Будь ласка, заповніть всі поля',
        variant: 'destructive',
      });
      return;
    }

    if (!isLogin && password !== confirmPassword) {
      toast({
        title: 'Помилка',
        description: 'Паролі не співпадають',
        variant: 'destructive',
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: 'Помилка',
        description: 'Пароль має містити мінімум 6 символів',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    // Simulate auth - will be replaced with Supabase
    await new Promise(resolve => setTimeout(resolve, 1500));

    toast({
      title: isLogin ? 'Успішний вхід!' : 'Реєстрація успішна!',
      description: isLogin ? 'Ласкаво просимо!' : 'Перевірте вашу пошту для підтвердження.',
    });

    setLoading(false);
    
    // Navigate to main after successful auth
    if (isLogin) {
      navigate('/main');
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      {/* Theme Toggle */}
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleTheme}
        className="fixed top-4 right-4 rounded-full"
      >
        {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
      </Button>

      <div className="w-full max-w-md">
        {/* Back Button */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground smooth-transition mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          На головну
        </Link>

        <div className="card-container p-8 md:p-10">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center">
              <span className="text-accent-foreground font-bold text-xl">Р</span>
            </div>
            <span className="font-display text-2xl font-semibold text-foreground">Рентал</span>
          </div>

          <h1 className="font-display text-3xl font-semibold text-foreground mb-2">
            {isLogin ? 'Вхід' : 'Реєстрація'}
          </h1>
          <p className="text-muted-foreground mb-8">
            {isLogin
              ? 'Увійдіть, щоб отримати доступ до оголошень'
              : 'Створіть акаунт, щоб почати пошук житла'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                Email
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="rounded-xl h-12"
                maxLength={255}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-foreground mb-2">
                Пароль
              </label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="rounded-xl h-12 pr-12"
                  maxLength={128}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {!isLogin && (
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-foreground mb-2">
                  Підтвердіть пароль
                </label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="rounded-xl h-12"
                  maxLength={128}
                />
              </div>
            )}

            <Button
              type="submit"
              variant="hero"
              size="lg"
              className="w-full mt-6"
              disabled={loading}
            >
              {loading
                ? 'Завантаження...'
                : isLogin
                ? 'Увійти'
                : 'Зареєструватися'}
            </Button>
          </form>

          <p className="text-center text-muted-foreground mt-6">
            {isLogin ? (
              <>
                Немає акаунту?{' '}
                <Link
                  to="/auth?mode=register"
                  className="text-accent hover:underline font-medium"
                >
                  Зареєструватися
                </Link>
              </>
            ) : (
              <>
                Вже маєте акаунт?{' '}
                <Link
                  to="/auth?mode=login"
                  className="text-accent hover:underline font-medium"
                >
                  Увійти
                </Link>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
