import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/hooks/useTheme';
import { useToast } from '@/hooks/use-toast';
import { Sun, Moon, ArrowLeft, Check, Star } from 'lucide-react';

const plans = [
  {
    id: 'basic',
    name: 'Базовий',
    price: 0,
    period: 'безкоштовно',
    features: [
      'Перегляд до 10 оголошень',
      'Базові фільтри',
      'Без контактних даних',
    ],
    limitations: [
      'Обмежена кількість оголошень',
      'Немає контактів орендодавців',
    ],
  },
  {
    id: '10days',
    name: '10 днів',
    price: 99,
    period: 'за 10 днів',
    popular: true,
    features: [
      'Необмежений перегляд оголошень',
      'Всі фільтри',
      'Контактні дані орендодавців',
      'Пріоритетна підтримка',
    ],
    limitations: [],
  },
  {
    id: '30days',
    name: '30 днів',
    price: 199,
    period: 'за 30 днів',
    features: [
      'Все з плану "10 днів"',
      'Сповіщення про нові оголошення',
      'Збереження обраних',
      'Найкраща ціна за день',
    ],
    limitations: [],
  },
];

export default function Subscription() {
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [selectedPlan, setSelectedPlan] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSelectPlan = async (planId: string) => {
    setSelectedPlan(planId);
    setLoading(true);

    // Simulate plan selection - will be replaced with Supabase + Stripe
    await new Promise((resolve) => setTimeout(resolve, 1500));

    toast({
      title: 'План обрано!',
      description: planId === 'basic' 
        ? 'Ви обрали базовий план.' 
        : 'Переходимо до оплати...',
    });

    setLoading(false);
    navigate('/main');
  };

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
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground smooth-transition mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          На головну
        </Link>

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
                <h3 className="font-display text-2xl font-semibold text-foreground mb-2">
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
                disabled={loading && selectedPlan === plan.id}
              >
                {loading && selectedPlan === plan.id
                  ? 'Обробка...'
                  : plan.price === 0
                  ? 'Почати безкоштовно'
                  : 'Обрати план'}
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
