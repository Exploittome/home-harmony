import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import heroImage from '@/assets/hero-city.jpg';
export function Hero() {
  return <section id="hero" className="pt-32 pb-16 px-4 text-primary">
      <div className="max-w-7xl mx-auto">
        <div className="card-container p-4 md:p-8">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            {/* Image */}
            <div className="relative overflow-hidden rounded-2xl aspect-[4/3] md:aspect-square">
              <img src={heroImage} alt="Сучасне житло в Україні" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-background/30 to-transparent" />
            </div>

            {/* Content */}
            <div className="flex flex-col justify-center py-4 md:py-8 md:px-4">
              <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-semibold text-foreground leading-tight mb-6 animate-slide-up">
                Зручний пошук оренди житла
              </h1>
              <p className="text-lg text-muted-foreground mb-8 max-w-md animate-slide-up" style={{
              animationDelay: '0.1s'
            }}>
                Знайдіть ідеальне житло для оренди в Україні. Найкращі пропозиції від перевірених орендодавців у вашому місті.
              </p>
              <div className="flex flex-wrap items-center gap-4 animate-slide-up" style={{
              animationDelay: '0.2s'
            }}>
                <Button variant="hero" size="xl" asChild>
                  <Link to="/auth?mode=register">Почати пошук</Link>
                </Button>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground">1000+ активних оголошень</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>;
}