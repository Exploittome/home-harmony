import { Home, Shield, Clock, Search } from 'lucide-react';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';

const features = [
  {
    icon: Search,
    title: 'Розумний пошук',
    description: 'Знаходьте житло за вашими критеріями: місто, ціна, кількість кімнат та тип нерухомості.',
  },
  {
    icon: Shield,
    title: 'Перевірені оголошення',
    description: 'Всі оголошення проходять модерацію. Ми гарантуємо актуальність та достовірність інформації.',
  },
  {
    icon: Clock,
    title: 'Гнучкі підписки',
    description: 'Оберіть план, який підходить саме вам: базовий доступ або повний функціонал на 10 чи 30 днів.',
  },
  {
    icon: Home,
    title: 'Широкий вибір',
    description: 'Квартири, будинки, кімнати — тисячі варіантів у всіх містах України.',
  },
];

export function About() {
  const { ref, isVisible } = useScrollAnimation();

  return (
    <section id="about" className="py-24 px-4">
      <div className="max-w-7xl mx-auto">
        <div
          ref={ref}
          className={`transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
        >
          <div className="text-center mb-16">
            <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-semibold text-foreground mb-4">
              Про платформу
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              GOTOHOME — це сучасна платформа для пошуку орендного житла в Україні. 
              Ми об'єднуємо орендарів та орендодавців, роблячи процес пошуку простим і зручним.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className="card-container-hover p-8"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center mb-6">
                  <feature.icon className="w-7 h-7 text-accent" />
                </div>
                <h3 className="font-display text-xl font-semibold text-foreground mb-3">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-16 card-container p-8 md:p-12">
            <div className="grid md:grid-cols-3 gap-8 text-center">
              <div>
                <div className="font-display text-4xl md:text-5xl font-bold text-accent mb-2">5000+</div>
                <div className="text-muted-foreground">Активних оголошень</div>
              </div>
              <div>
                <div className="font-display text-4xl md:text-5xl font-bold text-accent mb-2">50+</div>
                <div className="text-muted-foreground">Міст України</div>
              </div>
              <div>
                <div className="font-display text-4xl md:text-5xl font-bold text-accent mb-2">10K+</div>
                <div className="text-muted-foreground">Задоволених клієнтів</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
