import { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useTheme } from '@/hooks/useTheme';
import { Sun, Moon, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

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
  const [resetLoading, setResetLoading] = useState(false);
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);

  const isLogin = mode === 'login';
  const isForgotPassword = mode === 'forgot-password';
  const isResetPassword = mode === 'reset-password' || isRecoveryMode;

  // Check for password recovery event
  useEffect(() => {
    const hasRecoveryHash = () => {
      const hashParams = new URLSearchParams(window.location.hash.slice(1));
      return hashParams.get('type') === 'recovery';
    };

    // If user landed with a recovery hash (even on /auth without mode), force reset mode
    if (hasRecoveryHash()) {
      setIsRecoveryMode(true);
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      const recovery = hasRecoveryHash() || mode === 'reset-password';

      if (event === 'PASSWORD_RECOVERY' || recovery) {
        setIsRecoveryMode(true);
        return;
      }

      if (session?.user) {
        navigate('/main');
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      const recovery = hasRecoveryHash() || mode === 'reset-password';

      if (session?.user && recovery) {
        setIsRecoveryMode(true);
        return;
      }

      if (session?.user && !recovery) {
        navigate('/main');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, mode]);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!password.trim()) {
      toast({
        title: 'Помилка',
        description: 'Будь ласка, введіть новий пароль',
        variant: 'destructive',
      });
      return;
    }

    if (password !== confirmPassword) {
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

    try {
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        throw error;
      }

      toast({
        title: 'Пароль змінено!',
        description: 'Тепер ви можете увійти з новим паролем.',
      });

      setIsRecoveryMode(false);
      await supabase.auth.signOut();
      navigate('/auth?mode=login');
    } catch (error: any) {
      toast({
        title: 'Помилка',
        description: error.message || 'Не вдалося змінити пароль',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      toast({
        title: 'Помилка',
        description: 'Будь ласка, введіть email',
        variant: 'destructive',
      });
      return;
    }

    setResetLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/auth`,
      });

      if (error) {
        throw error;
      }

      toast({
        title: 'Лист надіслано!',
        description: 'Перевірте вашу пошту для відновлення пароля.',
      });
      
      navigate('/auth?mode=login');
    } catch (error: any) {
      toast({
        title: 'Помилка',
        description: error.message || 'Не вдалося надіслати лист',
        variant: 'destructive',
      });
    } finally {
      setResetLoading(false);
    }
  };

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

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (error) {
          if (error.message === 'Invalid login credentials') {
            throw new Error('Невірний email або пароль');
          }
          throw error;
        }

        toast({
          title: 'Успішний вхід!',
          description: 'Ласкаво просимо!',
        });
        navigate('/main');
      } else {
        const redirectUrl = `${window.location.origin}/`;
        
        const { error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: redirectUrl,
          },
        });

        if (error) {
          if (error.message.includes('already registered')) {
            throw new Error('Користувач з таким email вже зареєстрований');
          }
          throw error;
        }

        toast({
          title: 'Реєстрація успішна!',
          description: 'Перевірте вашу пошту для підтвердження.',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Помилка',
        description: error.message || 'Щось пішло не так',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getTitle = () => {
    if (isResetPassword) return 'Новий пароль';
    if (isForgotPassword) return 'Відновлення пароля';
    if (isLogin) return 'Вхід';
    return 'Реєстрація';
  };

  const getDescription = () => {
    if (isResetPassword) return 'Введіть ваш новий пароль';
    if (isForgotPassword) return 'Введіть ваш email для відновлення пароля';
    if (isLogin) return 'Увійдіть, щоб отримати доступ до оголошень';
    return 'Створіть акаунт, щоб почати пошук житла';
  };

  const getFormHandler = () => {
    if (isResetPassword) return handleResetPassword;
    if (isForgotPassword) return handleForgotPassword;
    return handleSubmit;
  };

  const getButtonText = () => {
    if (loading || resetLoading) return 'Завантаження...';
    if (isResetPassword) return 'Змінити пароль';
    if (isForgotPassword) return 'Надіслати лист';
    if (isLogin) return 'Увійти';
    return 'Зареєструватися';
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
            <img src="/images/logo.png" alt="GOTOHOME" className="w-12 h-12 object-contain" />
            <span className="font-display text-2xl font-semibold text-foreground">GOTOHOME</span>
          </div>

          <h1 className="font-display text-3xl font-semibold text-foreground mb-2">
            {getTitle()}
          </h1>
          <p className="text-muted-foreground mb-8">
            {getDescription()}
          </p>

          <form onSubmit={getFormHandler()} className="space-y-5">
            {/* Email field - only for login, register, forgot-password */}
            {!isResetPassword && (
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
            )}

            {/* Password field - for login, register, reset-password */}
            {!isForgotPassword && (
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-foreground mb-2">
                  {isResetPassword ? 'Новий пароль' : 'Пароль'}
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
            )}

            {/* Forgot password link - only for login */}
            {isLogin && (
              <div className="text-right">
                <Link
                  to="/auth?mode=forgot-password"
                  className="text-sm text-accent hover:underline"
                >
                  Забули пароль?
                </Link>
              </div>
            )}

            {/* Confirm password field - for register and reset-password */}
            {(!isLogin && !isForgotPassword) || isResetPassword ? (
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
            ) : null}

            <Button
              type="submit"
              variant="hero"
              size="lg"
              className="w-full mt-6"
              disabled={loading || resetLoading}
            >
              {getButtonText()}
            </Button>
          </form>

          <p className="text-center text-muted-foreground mt-6">
            {isResetPassword ? (
              <>
                Згадали старий пароль?{' '}
                <Link
                  to="/auth?mode=login"
                  className="text-accent hover:underline font-medium"
                  onClick={() => setIsRecoveryMode(false)}
                >
                  Увійти
                </Link>
              </>
            ) : isForgotPassword ? (
              <>
                Згадали пароль?{' '}
                <Link
                  to="/auth?mode=login"
                  className="text-accent hover:underline font-medium"
                >
                  Увійти
                </Link>
              </>
            ) : isLogin ? (
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
