import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="py-12 px-4 border-t border-border">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <Link to="/" className="flex items-center gap-3 mb-4">
              <img src="/images/logo.png" alt="GOTOHOME" className="w-10 h-10 object-contain" />
              <span className="font-display text-xl font-semibold text-foreground">GOTOHOME</span>
            </Link>
            <p className="text-muted-foreground max-w-md">
              Сучасна платформа для пошуку орендного житла в Україні. 
              Знаходьте ідеальне житло швидко та зручно.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-foreground mb-4">Платформа</h4>
            <ul className="space-y-2 text-muted-foreground">
              <li><button onClick={() => document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' })} className="hover:text-foreground smooth-transition">Про нас</button></li>
              <li><button onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })} className="hover:text-foreground smooth-transition">Контакти</button></li>
              <li><Link to="/auth?mode=register" className="hover:text-foreground smooth-transition">Реєстрація</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-foreground mb-4">Підтримка</h4>
            <ul className="space-y-2 text-muted-foreground">
              <li><span>support@gotohome.com.ua</span></li>
              <li><span>📞 +380 (77) 777-77-77</span></li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            © 2024 GOTOHOME. Всі права захищено.
          </p>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <span className="hover:text-foreground cursor-pointer smooth-transition">Політика конфіденційності</span>
            <span className="hover:text-foreground cursor-pointer smooth-transition">Умови використання</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
