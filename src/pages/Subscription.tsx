import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/hooks/useTheme';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Sun, Moon, ArrowLeft, Check, Star } from 'lucide-react';

const plans = [
  {
    id: 'basic',
    name: 'Standart',
    nameColor: 'text-green-600 dark:text-green-400',
    price: 0,
    period: 'Безкоштовно',
    features: [
      'Перегляд до 10 оголошень',
    ],
    limitations: [
      'Базові фільтри не працюють',
    ],
  },
  {
    id: '10days',
    name: 'Smart',
    nameColor: 'text-red-600 dark:text-red-400',
    price: 199,
    period: 'за 10 днів',
    popular: true,
    features: [
      'Необмежений перегляд оголошень',
      'Всі фільтри',
      'Пріоритетна підтримка',
    ],
    limitations: [],
  },
  {
    id: '30days',
    name: 'Pro',
    nameColor: 'text-yellow-600 dark:text-yellow-400',
    price: 299,
    period: 'за 30 днів',
    isRecurring: true,
    features: [
      'Повний доступ до сайту',
      'Сповіщення на телеграм про нові оголошення',
      'Збереження обраних',
      'Найкраща ціна за день',
      'Автоматичне поновлення щомісяця',
    ],
    limitations: [],
  },
];

export default function Subscription() {
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Check for payment status from URL
  useEffect(() => {
    const status = searchParams.get('status');
    if (status === 'success') {
      toast({
        title: 'Оплата успішна!',
        description: 'Ваш план активовано. Дякуємо за покупку!',
      });
      navigate('/main', { replace: true });
    } else if (status === 'error') {
      toast({
        title: 'Помилка оплати',
        description: 'Не вдалося обробити оплату. Спробуйте ще раз.',
        variant: 'destructive',
      });
    }
  }, [searchParams, toast, navigate]);

  const handleSelectPlan = (planId: string) => {
    if (planId === 'basic') {
      navigate('/main');
      return;
    }
    setSelectedPlan(planId);
  };

  const handleProceedToPayment = async () => {
    setLoading(true);

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: 'Помилка',
          description: 'Будь ласка, увійдіть в систему для оплати.',
          variant: 'destructive',
        });
        navigate('/auth');
        return;
      }

      // Call edge function to get payment data
      const { data, error } = await supabase.functions.invoke('wayforpay-payment', {
        body: {
          planId: selectedPlan,
          userEmail: user.email,
          userId: user.id,
        },
      });

      if (error) {
        throw error;
      }

      // Send Telegram notification for PRO subscriptions
      if (selectedPlanData) {
        try {
          await supabase.functions.invoke('send-telegram-pro', {
            body: {
              email: user.email,
              planName: selectedPlanData.name,
              price: selectedPlanData.price,
              period: selectedPlanData.period,
            },
          });
        } catch (telegramError) {
          console.error('Failed to send Telegram notification:', telegramError);
        }
      }

      // Create and submit WayForPay form
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = 'https://secure.wayforpay.com/pay';
      form.acceptCharset = 'UTF-8';

      const paymentData = data.paymentData;
      
      // Add form fields
      Object.entries(paymentData).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          value.forEach((item, index) => {
            const input = document.createElement('input');
            input.type = 'hidden';
            input.name = `${key}[]`;
            input.value = String(item);
            form.appendChild(input);
          });
        } else {
          const input = document.createElement('input');
          input.type = 'hidden';
          input.name = key;
          input.value = String(value);
          form.appendChild(input);
        }
      });

      document.body.appendChild(form);
      form.submit();
    } catch (error) {
      console.error('Payment error:', error);
      toast({
        title: 'Помилка',
        description: 'Не вдалося ініціювати оплату. Спробуйте ще раз.',
        variant: 'destructive',
      });
      setLoading(false);
    }
  };

  const selectedPlanData = plans.find(p => p.id === selectedPlan);

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      {/* Theme Toggle */}
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleTheme}
        className="fixed top-4 right-4 rounded-full"
      >
        {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
      </Button>

      <div className="max-w-5xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => selectedPlan ? setSelectedPlan(null) : navigate('/')}
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground smooth-transition mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          {selectedPlan ? 'Назад до планів' : 'На головну'}
        </button>

        {!selectedPlan ? (
          <>
            <div className="text-center mb-12">
              <h1 className="font-display text-3xl md:text-4xl lg:text-5xl font-semibold text-foreground mb-4">
                Оберіть план
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Виберіть план, який найкраще відповідає вашим потребам у пошуку житла
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {plans.map((plan) => (
                <div
                  key={plan.id}
                  className={`card-container-hover p-6 md:p-8 relative ${
                    plan.popular ? 'ring-2 ring-accent' : ''
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-accent text-accent-foreground text-sm font-medium rounded-full flex items-center gap-1">
                      <Star className="w-4 h-4" />
                      Популярний
                    </div>
                  )}

                  <div className="text-center mb-6">
                    <h3 className={`font-display text-2xl font-semibold mb-2 ${plan.nameColor}`}>
                      {plan.name}
                    </h3>
                    <div className="flex items-baseline justify-center gap-1">
                      <span className="font-display text-4xl font-bold text-foreground">
                        {plan.price === 0 ? 'Безкоштовно' : `${plan.price} ₴`}
                      </span>
                      {plan.price > 0 && (
                        <span className="text-muted-foreground">{plan.period}</span>
                      )}
                    </div>
                  </div>

                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                        <span className="text-foreground">{feature}</span>
                      </li>
                    ))}
                    {plan.limitations.map((limitation) => (
                      <li key={limitation} className="flex items-start gap-3 opacity-50">
                        <span className="w-5 h-5 shrink-0 mt-0.5 text-center">✕</span>
                        <span className="text-muted-foreground">{limitation}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    variant={plan.popular ? 'hero' : 'outline'}
                    size="lg"
                    className="w-full"
                    onClick={() => handleSelectPlan(plan.id)}
                  >
                    {plan.price === 0 ? 'Почати безкоштовно' : 'Обрати план'}
                  </Button>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="max-w-lg mx-auto">
            <div className="text-center mb-8">
              <h1 className="font-display text-3xl md:text-4xl font-semibold text-foreground mb-4">
                Підтвердження підписки
              </h1>
              <p className="text-lg text-muted-foreground">
                Ви обрали план "{selectedPlanData?.name}"
              </p>
            </div>

            <div className="card-container p-6 md:p-8 mb-6">
              <div className="text-center mb-6">
                <h3 className={`font-display text-2xl font-semibold mb-2 ${selectedPlanData?.nameColor}`}>
                  {selectedPlanData?.name}
                </h3>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="font-display text-4xl font-bold text-foreground">
                    {selectedPlanData?.price} ₴
                  </span>
                  <span className="text-muted-foreground">{selectedPlanData?.period}</span>
                </div>
              </div>

              <ul className="space-y-3 mb-8">
                {selectedPlanData?.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                    <span className="text-foreground">{feature}</span>
                  </li>
                ))}
              </ul>

              <div className="border-t border-border pt-6">
                <div className="flex justify-between items-center mb-6">
                  <span className="text-lg text-foreground">До сплати:</span>
                  <span className="font-display text-2xl font-bold text-foreground">
                    {selectedPlanData?.price} ₴
                  </span>
                </div>

                <Button
                  variant="hero"
                  size="lg"
                  className="w-full"
                  onClick={handleProceedToPayment}
                  disabled={loading}
                >
                  {loading ? 'Переходимо до оплати...' : 'Оплатити через WayForPay'}
                </Button>
              </div>
            </div>

            {(selectedPlanData as typeof plans[0] & { isRecurring?: boolean })?.isRecurring && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-4">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  <strong>Автоматичне поновлення:</strong> Підписка автоматично поновлюється щомісяця. 
                  Ви можете скасувати автоматичне списання в будь-який момент через ваш банк або WayForPay.
                </p>
              </div>
            )}

            <p className="text-center text-sm text-muted-foreground">
              Натискаючи "Оплатити", ви погоджуєтесь з{' '}
              <Link to="/terms" className="text-accent hover:underline">
                Умовами використання
              </Link>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
