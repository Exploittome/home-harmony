import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTheme } from '@/hooks/useTheme';
import { Sun, Moon, LogOut, Search, MapPin, Home, Building2, Filter, Lock, MessageCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import { useToast } from '@/hooks/use-toast';

// Mock data for listings
const mockListings = [
  {
    id: 1,
    title: '2-кімнатна квартира в центрі',
    price: 15000,
    city: 'Київ',
    rooms: 2,
    type: 'apartment',
    image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&h=300&fit=crop',
    description: 'Світла квартира з сучасним ремонтом у центрі міста.',
  },
  {
    id: 2,
    title: 'Студія біля метро',
    price: 8000,
    city: 'Київ',
    rooms: 1,
    type: 'studio',
    image: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&h=300&fit=crop',
    description: 'Затишна студія в 5 хвилинах від метро Лук\'янівська.',
  },
  {
    id: 3,
    title: '3-кімнатна квартира',
    price: 22000,
    city: 'Львів',
    rooms: 3,
    type: 'apartment',
    image: 'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=400&h=300&fit=crop',
    description: 'Простора квартира з видом на парк.',
  },
  {
    id: 4,
    title: 'Будинок з садом',
    price: 35000,
    city: 'Одеса',
    rooms: 4,
    type: 'house',
    image: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400&h=300&fit=crop',
    description: 'Приватний будинок з великим садом біля моря.',
  },
  {
    id: 5,
    title: '1-кімнатна квартира',
    price: 10000,
    city: 'Харків',
    rooms: 1,
    type: 'apartment',
    image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400&h=300&fit=crop',
    description: 'Сучасна квартира в новобудові.',
  },
  {
    id: 6,
    title: 'Пентхаус з терасою',
    price: 45000,
    city: 'Київ',
    rooms: 3,
    type: 'apartment',
    image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400&h=300&fit=crop',
    description: 'Розкішний пентхаус з панорамним видом.',
  },
];

type SubscriptionPlan = 'basic' | 'plan_10_days' | 'plan_30_days';

export default function Main() {
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // User state
  const [user, setUser] = useState<User | null>(null);
  const [userPlan, setUserPlan] = useState<SubscriptionPlan>('basic');
  const [planLoading, setPlanLoading] = useState(true);
  
  // Filters
  const [city, setCity] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [rooms, setRooms] = useState('');
  const [propertyType, setPropertyType] = useState('');

  // Fetch user subscription
  const fetchSubscription = async (userId: string) => {
    const { data, error } = await supabase
      .from('user_subscriptions')
      .select('plan, expires_at')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.log('No subscription found, using basic plan');
      setUserPlan('basic');
    } else {
      // Check if subscription is expired
      if (data.expires_at && new Date(data.expires_at) < new Date()) {
        setUserPlan('basic');
      } else {
        setUserPlan(data.plan as SubscriptionPlan);
      }
    }
    setPlanLoading(false);
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (!session?.user) {
        navigate('/auth');
      } else {
        setTimeout(() => {
          fetchSubscription(session.user.id);
        }, 0);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (!session?.user) {
        navigate('/auth');
      } else {
        fetchSubscription(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const canUseFilters = userPlan === 'plan_10_days' || userPlan === 'plan_30_days';

  const handleFilterChange = (setter: (value: string) => void, value: string) => {
    if (!canUseFilters) {
      toast({
        title: "Підвищіть план підписки",
        description: "Для використання фільтрів потрібен план на 10 або 30 днів",
        variant: "destructive",
      });
      return;
    }
    setter(value);
  };

  const filteredListings = mockListings.filter((listing) => {
    if (!canUseFilters) return true; // Show all for basic plan (no filtering)
    if (city && listing.city !== city) return false;
    if (minPrice && listing.price < parseInt(minPrice)) return false;
    if (maxPrice && listing.price > parseInt(maxPrice)) return false;
    if (rooms && listing.rooms !== parseInt(rooms)) return false;
    if (propertyType && listing.type !== propertyType) return false;
    return true;
  });

  // Limit listings for basic plan
  const displayedListings = userPlan === 'basic' ? filteredListings.slice(0, 10) : filteredListings;

  const getPlanLabel = (plan: SubscriptionPlan) => {
    switch (plan) {
      case 'basic': return 'Базовий план';
      case 'plan_10_days': return 'План 10 днів';
      case 'plan_30_days': return 'План 30 днів';
    }
  };

  const openTelegramBot = () => {
    window.open('https://t.me/your_bot_name', '_blank');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <img src="/images/logo.png" alt="GOTOHOME" className="w-10 h-10 object-contain" />
            <span className="font-display text-xl font-semibold text-foreground">GOTOHOME</span>
          </Link>

          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={toggleTheme} className="rounded-full">
              {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
            <Button variant="ghost" size="icon" onClick={handleLogout} className="rounded-full">
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-[320px_1fr] gap-8">
          {/* Sidebar */}
          <aside className="lg:sticky lg:top-24 lg:h-fit">
            <div className="card-container p-6">
              {/* User Info */}
              <div className="mb-6 pb-6 border-b border-border">
                <p className="text-sm text-muted-foreground mb-1">Ви увійшли як</p>
                <p className="font-medium text-foreground truncate">{user?.email || 'Завантаження...'}</p>
                <div className="mt-3">
                  <span className="inline-flex items-center px-3 py-1 rounded-full bg-accent/10 text-accent text-sm font-medium">
                    {planLoading ? 'Завантаження...' : getPlanLabel(userPlan)}
                  </span>
                </div>
                {!planLoading && userPlan === 'plan_30_days' && (
                  <Button 
                    variant="outline" 
                    onClick={openTelegramBot}
                    className="w-full mt-4 rounded-xl border-[#0088cc] text-[#0088cc] hover:bg-[#0088cc]/10"
                  >
                    <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                    </svg>
                    Телеграм Бот
                  </Button>
                )}
              </div>

              {/* Filters */}
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-foreground font-semibold">
                    <Filter className="w-5 h-5" />
                    <span>Фільтри</span>
                  </div>
                  {!canUseFilters && (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Lock className="w-3 h-3" />
                      Преміум
                    </span>
                  )}
                </div>

                <div className={!canUseFilters ? 'opacity-60' : ''}>
                  <label className="block text-sm font-medium text-foreground mb-2">Місто</label>
                  <Select 
                    value={city} 
                    onValueChange={(value) => handleFilterChange(setCity, value)}
                    disabled={!canUseFilters}
                  >
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder="Оберіть місто" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Київ">Київ</SelectItem>
                      <SelectItem value="Львів">Львів</SelectItem>
                      <SelectItem value="Одеса">Одеса</SelectItem>
                      <SelectItem value="Харків">Харків</SelectItem>
                      <SelectItem value="Дніпро">Дніпро</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className={!canUseFilters ? 'opacity-60' : ''}>
                  <label className="block text-sm font-medium text-foreground mb-2">Ціна (грн)</label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder="Від"
                      value={minPrice}
                      onChange={(e) => handleFilterChange(setMinPrice, e.target.value)}
                      className="rounded-xl"
                      disabled={!canUseFilters}
                    />
                    <Input
                      type="number"
                      placeholder="До"
                      value={maxPrice}
                      onChange={(e) => handleFilterChange(setMaxPrice, e.target.value)}
                      className="rounded-xl"
                      disabled={!canUseFilters}
                    />
                  </div>
                </div>

                <div className={!canUseFilters ? 'opacity-60' : ''}>
                  <label className="block text-sm font-medium text-foreground mb-2">Кімнати</label>
                  <Select 
                    value={rooms} 
                    onValueChange={(value) => handleFilterChange(setRooms, value)}
                    disabled={!canUseFilters}
                  >
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder="Кількість кімнат" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 кімната</SelectItem>
                      <SelectItem value="2">2 кімнати</SelectItem>
                      <SelectItem value="3">3 кімнати</SelectItem>
                      <SelectItem value="4">4+ кімнати</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className={!canUseFilters ? 'opacity-60' : ''}>
                  <label className="block text-sm font-medium text-foreground mb-2">Тип нерухомості</label>
                  <Select 
                    value={propertyType} 
                    onValueChange={(value) => handleFilterChange(setPropertyType, value)}
                    disabled={!canUseFilters}
                  >
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder="Оберіть тип" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="apartment">Квартира</SelectItem>
                      <SelectItem value="house">Будинок</SelectItem>
                      <SelectItem value="studio">Студія</SelectItem>
                      <SelectItem value="room">Кімната</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  variant="hero"
                  className="w-full"
                  onClick={() => {
                    if (!canUseFilters) {
                      toast({
                        title: "Підвищіть план підписки",
                        description: "Для використання фільтрів потрібен план на 10 або 30 днів",
                        variant: "destructive",
                      });
                      return;
                    }
                    setCity('');
                    setMinPrice('');
                    setMaxPrice('');
                    setRooms('');
                    setPropertyType('');
                  }}
                >
                  <Search className="w-4 h-4 mr-2" />
                  Скинути фільтри
                </Button>

                {!canUseFilters && (
                  <Link to="/subscription" className="block">
                    <Button variant="outline" className="w-full rounded-xl">
                      Підвищити план
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main>
            <div className="flex items-center justify-between mb-6">
              <h1 className="font-display text-2xl md:text-3xl font-semibold text-foreground">
                Оголошення
              </h1>
              <p className="text-muted-foreground">
                Знайдено: {displayedListings.length} {userPlan === 'basic' && filteredListings.length > 10 && `з ${filteredListings.length}`}
              </p>
            </div>

            {userPlan === 'basic' && (
              <div className="card-container p-4 mb-6 bg-accent/5 border border-accent/20">
                <p className="text-sm text-foreground">
                  💡 У вас базовий план. Для використання фільтрів та перегляду всіх оголошень{' '}
                  <Link to="/subscription" className="text-accent font-medium hover:underline">
                    оберіть преміум план
                  </Link>
                </p>
              </div>
            )}

            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
              {displayedListings.map((listing) => (
                <div key={listing.id} className="card-container-hover overflow-hidden">
                  <div className="relative aspect-[4/3]">
                    <img
                      src={listing.image}
                      alt={listing.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-3 right-3 px-3 py-1 rounded-full bg-background/90 backdrop-blur-sm text-foreground font-semibold text-sm">
                      {listing.price.toLocaleString()} ₴/міс
                    </div>
                  </div>
                  <div className="p-5">
                    <h3 className="font-display text-lg font-semibold text-foreground mb-2">
                      {listing.title}
                    </h3>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {listing.city}
                      </span>
                      <span className="flex items-center gap-1">
                        <Home className="w-4 h-4" />
                        {listing.rooms} кім.
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {listing.description}
                    </p>
                    <Button variant="outline" size="sm" className="w-full rounded-xl">
                      Детальніше
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {displayedListings.length === 0 && (
              <div className="card-container p-12 text-center">
                <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-display text-xl font-semibold text-foreground mb-2">
                  Оголошень не знайдено
                </h3>
                <p className="text-muted-foreground">
                  Спробуйте змінити параметри фільтрів
                </p>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
