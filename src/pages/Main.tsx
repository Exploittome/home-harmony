import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTheme } from '@/hooks/useTheme';
import { Sun, Moon, LogOut, Search, MapPin, Home, Building2, Filter } from 'lucide-react';

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

export default function Main() {
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  
  // Filters
  const [city, setCity] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [rooms, setRooms] = useState('');
  const [propertyType, setPropertyType] = useState('');

  // Mock user data - will be replaced with Supabase
  const userEmail = 'user@example.com';
  const userPlan = 'basic'; // basic, 10days, 30days

  const handleLogout = () => {
    navigate('/');
  };

  const filteredListings = mockListings.filter((listing) => {
    if (city && listing.city !== city) return false;
    if (minPrice && listing.price < parseInt(minPrice)) return false;
    if (maxPrice && listing.price > parseInt(maxPrice)) return false;
    if (rooms && listing.rooms !== parseInt(rooms)) return false;
    if (propertyType && listing.type !== propertyType) return false;
    return true;
  });

  // Limit listings for basic plan
  const displayedListings = userPlan === 'basic' ? filteredListings.slice(0, 10) : filteredListings;

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
                <p className="font-medium text-foreground truncate">{userEmail}</p>
                <div className="mt-3">
                  <span className="inline-flex items-center px-3 py-1 rounded-full bg-accent/10 text-accent text-sm font-medium">
                    {userPlan === 'basic' ? 'Базовий план' : userPlan === '10days' ? '10 днів' : '30 днів'}
                  </span>
                </div>
              </div>

              {/* Filters */}
              <div className="space-y-5">
                <div className="flex items-center gap-2 text-foreground font-semibold">
                  <Filter className="w-5 h-5" />
                  <span>Фільтри</span>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Місто</label>
                  <Select value={city} onValueChange={setCity}>
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

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Ціна (грн)</label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder="Від"
                      value={minPrice}
                      onChange={(e) => setMinPrice(e.target.value)}
                      className="rounded-xl"
                    />
                    <Input
                      type="number"
                      placeholder="До"
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(e.target.value)}
                      className="rounded-xl"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Кімнати</label>
                  <Select value={rooms} onValueChange={setRooms}>
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

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Тип нерухомості</label>
                  <Select value={propertyType} onValueChange={setPropertyType}>
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
                  💡 У вас базовий план. Для перегляду всіх оголошень та контактних даних{' '}
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
