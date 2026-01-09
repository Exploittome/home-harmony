import { useState, useEffect, useRef, TouchEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useTheme } from '@/hooks/useTheme';
import { Sun, Moon, LogOut, Search, MapPin, Home, Building2, Filter, Lock, Bookmark, BookmarkCheck, X, Maximize2, Car, Phone, Calendar, CheckCircle, XCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import { useToast } from '@/hooks/use-toast';

interface Listing {
  id: string;
  title: string;
  price: number;
  city: string;
  rooms: number | null;
  area: number | null;
  has_parking: boolean | null;
  phone: string | null;
  image_url: string | null;
  images: string[] | null;
  description: string | null;
  created_at: string;
}

type SubscriptionPlan = 'basic' | 'plan_10_days' | 'plan_30_days';

export default function Main() {
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // User state
  const [user, setUser] = useState<User | null>(null);
  const [userPlan, setUserPlan] = useState<SubscriptionPlan>('basic');
  const [planLoading, setPlanLoading] = useState(true);
  
  // Listings state
  const [listings, setListings] = useState<Listing[]>([]);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [listingsLoading, setListingsLoading] = useState(true);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isFullscreenImage, setIsFullscreenImage] = useState(false);
  
  // Touch swipe handling
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  const isSwiping = useRef<boolean>(false);
  
  const handleTouchStart = (e: TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchEndX.current = e.touches[0].clientX;
    isSwiping.current = true;
  };
  
  const handleTouchMove = (e: TouchEvent) => {
    if (isSwiping.current) {
      touchEndX.current = e.touches[0].clientX;
    }
  };
  
  const handleTouchEnd = (allImages: string[]) => {
    if (!isSwiping.current || touchStartX.current === null || touchEndX.current === null) {
      return;
    }
    
    const diff = touchStartX.current - touchEndX.current;
    const threshold = 50;
    
    if (Math.abs(diff) > threshold && allImages.length > 1) {
      if (diff > 0) {
        // Swipe left - next image
        setCurrentImageIndex(prev => prev === allImages.length - 1 ? 0 : prev + 1);
      } else {
        // Swipe right - previous image
        setCurrentImageIndex(prev => prev === 0 ? allImages.length - 1 : prev - 1);
      }
    }
    
    touchStartX.current = null;
    touchEndX.current = null;
    isSwiping.current = false;
  };
  
  // Navigation functions for fullscreen
  const goToNextImage = (allImages: string[]) => {
    if (allImages.length > 1) {
      setCurrentImageIndex(prev => prev === allImages.length - 1 ? 0 : prev + 1);
    }
  };
  
  const goToPrevImage = (allImages: string[]) => {
    if (allImages.length > 1) {
      setCurrentImageIndex(prev => prev === 0 ? allImages.length - 1 : prev - 1);
    }
  };
  
  // Filters
  const [city, setCity] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [rooms, setRooms] = useState('');
  const [propertyType, setPropertyType] = useState('');
  const [minArea, setMinArea] = useState('');
  const [maxArea, setMaxArea] = useState('');
  const [hasParking, setHasParking] = useState(false);

  // Fetch listings from database
  const fetchListings = async () => {
    const { data, error } = await supabase
      .from('listings')
      .select('id, title, price, city, rooms, area, has_parking, phone, image_url, images, description, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching listings:', error);
    } else {
      setListings(data as Listing[]);
    }
    setListingsLoading(false);
  };

  // Fetch saved listing IDs for current user
  const fetchSavedIds = async (userId: string) => {
    const { data, error } = await supabase
      .from('saved_listings')
      .select('listing_id')
      .eq('user_id', userId);

    if (!error && data) {
      setSavedIds(new Set(data.map(item => item.listing_id)));
    }
  };

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
    fetchListings();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (!session?.user) {
        navigate('/auth');
      } else {
        setTimeout(() => {
          fetchSubscription(session.user.id);
          fetchSavedIds(session.user.id);
        }, 0);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (!session?.user) {
        navigate('/auth');
      } else {
        fetchSubscription(session.user.id);
        fetchSavedIds(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleLogout = async () => {
    // Clear local session even if server-side session is already gone
    await supabase.auth.signOut({ scope: 'local' });

    // Extra safety: remove any persisted tokens manually
    try {
      localStorage.removeItem('sb-qselmijdcggthggjvdej-auth-token');
      localStorage.removeItem('sb-qselmijdcggthggjvdej-auth-token-code-verifier');
    } catch {
      // ignore
    }

    setUser(null);
    navigate('/', { replace: true });
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

  const filteredListings = listings.filter((listing) => {
    if (!canUseFilters) return true; // Show all for basic plan (no filtering)
    if (city && city !== 'all' && listing.city.toLowerCase() !== city.toLowerCase()) return false;
    if (minPrice && listing.price < parseInt(minPrice)) return false;
    if (maxPrice && listing.price > parseInt(maxPrice)) return false;
    if (rooms && listing.rooms !== parseInt(rooms)) return false;
    if (propertyType) {
      // Filter by property type based on rooms count
      if (propertyType === 'apartment' && (listing.rooms === null || listing.rooms < 1)) return false;
      if (propertyType === 'house' && (listing.rooms === null || listing.rooms < 3)) return false;
      if (propertyType === 'studio' && listing.rooms !== 1) return false;
    }
    // Area filter
    if (minArea && (listing.area === null || listing.area < parseFloat(minArea))) return false;
    if (maxArea && (listing.area === null || listing.area > parseFloat(maxArea))) return false;
    // Parking filter
    if (hasParking && !listing.has_parking) return false;
    return true;
  });

  // Limit listings for basic plan
  const displayedListings = userPlan === 'basic' ? filteredListings.slice(0, 10) : filteredListings;

  const getPlanLabel = (plan: SubscriptionPlan) => {
    switch (plan) {
      case 'basic': return 'Standart';
      case 'plan_10_days': return 'Smart';
      case 'plan_30_days': return 'Pro';
    }
  };

  const openTelegramBot = () => {
    window.open('https://t.me/your_bot_name', '_blank');
  };

  const handleSaveListing = async (listingId: string) => {
    if (!user) return;
    
    if (savedIds.has(listingId)) {
      // Remove from saved
      const { error } = await supabase
        .from('saved_listings')
        .delete()
        .eq('user_id', user.id)
        .eq('listing_id', listingId);

      if (error) {
        toast({
          title: "Помилка",
          description: "Не вдалося видалити зі збережених",
          variant: "destructive",
        });
      } else {
        setSavedIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(listingId);
          return newSet;
        });
        toast({
          title: "Видалено",
          description: "Оголошення видалено зі збережених",
        });
      }
    } else {
      // Add to saved
      const { error } = await supabase
        .from('saved_listings')
        .insert({ user_id: user.id, listing_id: listingId });

      if (error) {
        toast({
          title: "Помилка",
          description: "Не вдалося зберегти оголошення",
          variant: "destructive",
        });
      } else {
        setSavedIds(prev => new Set(prev).add(listingId));
        toast({
          title: "Збережено",
          description: "Оголошення додано до збережених",
        });
      }
    }
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
          {/* Sidebar - independently scrollable */}
          <aside className="lg:sticky lg:top-24 lg:h-[calc(100vh-8rem)] lg:overflow-y-auto lg:overflow-x-hidden scrollbar-thin">
            <div className="card-container p-6">
              {/* User Info */}
              <div className="mb-6 pb-6 border-b border-border">
                <p className="text-sm text-muted-foreground mb-1">Ви увійшли як</p>
                <p className="font-medium text-foreground truncate">{user?.email || 'Завантаження...'}</p>
                <div className="mt-3 flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2">
                  <span className="font-medium text-foreground">Ваш план підписки:</span>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold ${
                    userPlan === 'basic' 
                      ? 'bg-green-500/10 text-green-600 dark:text-green-400' 
                      : userPlan === 'plan_10_days'
                        ? 'bg-red-500/10 text-red-600 dark:text-red-400'
                        : 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400'
                  }`}>
                    {planLoading ? 'Завантаження...' : getPlanLabel(userPlan)}
                  </span>
                </div>
                {!planLoading && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className={userPlan !== 'plan_30_days' ? 'opacity-60' : ''}>
                          <Button 
                            variant="outline" 
                            onClick={() => {
                              if (userPlan === 'plan_30_days') {
                                openTelegramBot();
                              } else {
                                toast({
                                  title: "Підвищіть план підписки",
                                  description: "Для доступу до Телеграм Бота потрібен 30-денний план",
                                  variant: "destructive",
                                });
                              }
                            }}
                            className={`w-full mt-4 rounded-xl border-[#0088cc] text-[#0088cc] hover:bg-[#0088cc]/10 ${userPlan !== 'plan_30_days' ? 'cursor-not-allowed' : ''}`}
                          >
                            <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                            </svg>
                            Телеграм Бот
                            {userPlan !== 'plan_30_days' && <Lock className="h-4 w-4 ml-2" />}
                          </Button>
                        </div>
                      </TooltipTrigger>
                      {userPlan !== 'plan_30_days' && (
                        <TooltipContent variant="warning">
                          <p>🔒 Оновіться до 30-денного плану для доступу до Телеграм Бота</p>
                        </TooltipContent>
                      )}
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className={userPlan !== 'plan_30_days' ? 'opacity-60' : ''}>
                          <Button 
                            variant="outline" 
                            onClick={() => {
                              if (userPlan === 'plan_30_days') {
                                navigate('/saved');
                              } else {
                                toast({
                                  title: "Підвищіть план підписки",
                                  description: "Для доступу до збережених оголошень потрібен 30-денний план",
                                  variant: "destructive",
                                });
                              }
                            }}
                            className={`w-full mt-3 rounded-xl border-accent text-accent hover:bg-accent/10 ${userPlan !== 'plan_30_days' ? 'cursor-not-allowed' : ''}`}
                          >
                            <Bookmark className="h-5 w-5 mr-2" />
                            Збережене
                            {userPlan !== 'plan_30_days' && <Lock className="h-4 w-4 ml-2" />}
                          </Button>
                        </div>
                      </TooltipTrigger>
                      {userPlan !== 'plan_30_days' && (
                        <TooltipContent variant="warning">
                          <p>🔒 Оновіться до 30-денного плану для доступу до збережених оголошень</p>
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </TooltipProvider>
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

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className={!canUseFilters ? 'opacity-60 cursor-not-allowed' : ''}>
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
                            <SelectItem value="all">Всі міста</SelectItem>
                            <SelectItem value="Вінниця">Вінниця</SelectItem>
                            <SelectItem value="Дніпро">Дніпро</SelectItem>
                            <SelectItem value="Житомир">Житомир</SelectItem>
                            <SelectItem value="Запоріжжя">Запоріжжя</SelectItem>
                            <SelectItem value="Івано-Франківськ">Івано-Франківськ</SelectItem>
                            <SelectItem value="Калинівка">Калинівка</SelectItem>
                            <SelectItem value="Київ">Київ</SelectItem>
                            <SelectItem value="Кропивницький">Кропивницький</SelectItem>
                            <SelectItem value="Луцьк">Луцьк</SelectItem>
                            <SelectItem value="Львів">Львів</SelectItem>
                            <SelectItem value="Миколаїв">Миколаїв</SelectItem>
                            <SelectItem value="Могилів-Подільський">Могилів-Подільський</SelectItem>
                            <SelectItem value="Одеса">Одеса</SelectItem>
                            <SelectItem value="Полтава">Полтава</SelectItem>
                            <SelectItem value="Рівне">Рівне</SelectItem>
                            <SelectItem value="Стрижавка">Стрижавка</SelectItem>
                            <SelectItem value="Суми">Суми</SelectItem>
                            <SelectItem value="Тернопіль">Тернопіль</SelectItem>
                            <SelectItem value="Ужгород">Ужгород</SelectItem>
                            <SelectItem value="Харків">Харків</SelectItem>
                            <SelectItem value="Херсон">Херсон</SelectItem>
                            <SelectItem value="Хмельницький">Хмельницький</SelectItem>
                            <SelectItem value="Хмільник">Хмільник</SelectItem>
                            <SelectItem value="Черкаси">Черкаси</SelectItem>
                            <SelectItem value="Чернівці">Чернівці</SelectItem>
                            <SelectItem value="Чернігів">Чернігів</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </TooltipTrigger>
                    {!canUseFilters && (
                      <TooltipContent variant="warning">
                        <p>🔒 Оновіться до преміум плану для використання фільтрів</p>
                      </TooltipContent>
                    )}
                  </Tooltip>
                </TooltipProvider>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className={!canUseFilters ? 'opacity-60 cursor-not-allowed' : ''}>
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
                    </TooltipTrigger>
                    {!canUseFilters && (
                      <TooltipContent variant="warning">
                        <p>🔒 Оновіться до преміум плану для використання фільтрів</p>
                      </TooltipContent>
                    )}
                  </Tooltip>
                </TooltipProvider>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className={!canUseFilters ? 'opacity-60 cursor-not-allowed' : ''}>
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
                    </TooltipTrigger>
                    {!canUseFilters && (
                      <TooltipContent variant="warning">
                        <p>🔒 Оновіться до преміум плану для використання фільтрів</p>
                      </TooltipContent>
                    )}
                  </Tooltip>
                </TooltipProvider>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className={!canUseFilters ? 'opacity-60 cursor-not-allowed' : ''}>
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
                    </TooltipTrigger>
                    {!canUseFilters && (
                      <TooltipContent variant="warning">
                        <p>🔒 Оновіться до преміум плану для використання фільтрів</p>
                      </TooltipContent>
                    )}
                  </Tooltip>
                </TooltipProvider>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className={!canUseFilters ? 'opacity-60 cursor-not-allowed' : ''}>
                        <label className="block text-sm font-medium text-foreground mb-2">Площа (м²)</label>
                        <div className="flex gap-2">
                          <Input
                            type="number"
                            placeholder="Від"
                            value={minArea}
                            onChange={(e) => handleFilterChange(setMinArea, e.target.value)}
                            className="rounded-xl"
                            disabled={!canUseFilters}
                          />
                          <Input
                            type="number"
                            placeholder="До"
                            value={maxArea}
                            onChange={(e) => handleFilterChange(setMaxArea, e.target.value)}
                            className="rounded-xl"
                            disabled={!canUseFilters}
                          />
                        </div>
                      </div>
                    </TooltipTrigger>
                    {!canUseFilters && (
                      <TooltipContent variant="warning">
                        <p>🔒 Оновіться до преміум плану для використання фільтрів</p>
                      </TooltipContent>
                    )}
                  </Tooltip>
                </TooltipProvider>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className={!canUseFilters ? 'opacity-60 cursor-not-allowed' : ''}>
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={hasParking}
                            onChange={(e) => {
                              if (!canUseFilters) {
                                toast({
                                  title: "Підвищіть план підписки",
                                  description: "Для використання фільтрів потрібен план на 10 або 30 днів",
                                  variant: "destructive",
                                });
                                return;
                              }
                              setHasParking(e.target.checked);
                            }}
                            disabled={!canUseFilters}
                            className="h-5 w-5 rounded border-border text-primary focus:ring-primary disabled:opacity-50"
                          />
                          <span className="text-sm font-medium text-foreground flex items-center gap-2">
                            <Car className="w-4 h-4" />
                            Тільки з паркінгом
                          </span>
                        </label>
                      </div>
                    </TooltipTrigger>
                    {!canUseFilters && (
                      <TooltipContent variant="warning">
                        <p>🔒 Оновіться до преміум плану для використання фільтрів</p>
                      </TooltipContent>
                    )}
                  </Tooltip>
                </TooltipProvider>

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
                    setMinArea('');
                    setMaxArea('');
                    setHasParking(false);
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
              <div className="card-container p-4 mb-6 bg-primary/5 border border-primary/30">
                <p className="text-base font-medium">
                  <span className="text-primary">💡 У вас базовий план. Для використання фільтрів та перегляду всіх оголошень </span>
                  <Link to="/subscription" className="text-destructive font-bold hover:underline">
                    оберіть преміум план
                  </Link>
                </p>
              </div>
            )}

            {userPlan === 'plan_10_days' && (
              <div className="card-container p-4 mb-6 bg-red-500/5 border border-red-500/30">
                <p className="text-base font-medium">
                  <span className="text-primary">💡 У вас </span>
                  <span className="text-red-600 dark:text-red-400 font-bold">Smart</span>
                  <span className="text-primary"> план. Для використання фільтрів та перегляду всіх оголошень оберіть преміум план </span>
                  <Link to="/subscription" className="text-yellow-600 dark:text-yellow-400 font-bold hover:underline">
                    Pro
                  </Link>
                </p>
              </div>
            )}

            {listingsLoading ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Завантаження оголошень...</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
                {displayedListings.map((listing) => (
                  <div key={listing.id} className="card-container-hover overflow-hidden">
                    <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                      <img
                        src={listing.image_url || 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&h=300&fit=crop'}
                        alt={listing.title}
                        className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&h=300&fit=crop';
                        }}
                      />
                      <div className="absolute top-3 right-3 px-3 py-1 rounded-full bg-background/90 backdrop-blur-sm text-foreground font-semibold text-sm">
                        {listing.price.toLocaleString()} ₴/міс
                      </div>
                      {userPlan === 'plan_30_days' && (
                        <button
                          onClick={() => handleSaveListing(listing.id)}
                          className="absolute top-3 left-3 p-2 rounded-full bg-background/90 backdrop-blur-sm hover:bg-background transition-colors"
                        >
                          {savedIds.has(listing.id) ? (
                            <BookmarkCheck className="w-5 h-5 text-accent" />
                          ) : (
                            <Bookmark className="w-5 h-5 text-foreground" />
                          )}
                        </button>
                      )}
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
                        {listing.rooms && (
                          <span className="flex items-center gap-1">
                            <Home className="w-4 h-4" />
                            {listing.rooms} кім.
                          </span>
                        )}
                      </div>
                      {listing.description && (
                        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                          {listing.description}
                        </p>
                      )}
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full rounded-xl"
                        onClick={() => {
                          setSelectedListing(listing);
                          setCurrentImageIndex(0);
                        }}
                      >
                        Детальніше
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Listing Detail Modal */}
            <Dialog open={!!selectedListing} onOpenChange={(open) => {
              if (!open) {
                setSelectedListing(null);
                setCurrentImageIndex(0);
              }
            }}>
              <DialogContent className="max-w-3xl w-full md:w-[95vw] max-h-[100dvh] md:max-h-[90vh] overflow-hidden p-0 rounded-none md:rounded-lg">
                {selectedListing && (() => {
                  const allImages = selectedListing.images?.length 
                    ? selectedListing.images 
                    : [selectedListing.image_url || 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200&h=800&fit=crop'];
                  
                  return (
                  <div className="flex flex-col max-h-[100dvh] md:max-h-[90vh] overflow-y-auto">
                    {/* Image Carousel */}
                    <div 
                      className="relative w-full h-[35vh] md:h-[46vh] bg-muted cursor-pointer md:cursor-default overflow-hidden flex-shrink-0"
                      onClick={() => window.innerWidth < 768 && setIsFullscreenImage(true)}
                      onTouchStart={handleTouchStart}
                      onTouchMove={handleTouchMove}
                      onTouchEnd={() => handleTouchEnd(allImages)}
                    >
                      {/* Blurred background to avoid empty side bars for portrait photos */}
                      <div
                        aria-hidden="true"
                        className="absolute inset-0 z-0 bg-center bg-cover blur-2xl scale-110 opacity-60"
                        style={{ backgroundImage: `url(${allImages[currentImageIndex]})` }}
                      />
                      <div aria-hidden="true" className="absolute inset-0 z-[1] bg-background/30" />

                      <img
                        src={allImages[currentImageIndex]}
                        alt={`${selectedListing.title} - фото ${currentImageIndex + 1}`}
                        className="relative z-10 w-full h-full object-contain transition-opacity duration-300"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop';
                        }}
                      />
                      
                      {/* Tap to fullscreen hint on mobile - positioned at top */}
                      <div className="absolute top-4 right-4 z-20 px-2 py-1 rounded-full bg-background/80 backdrop-blur-sm text-xs text-foreground md:hidden">
                        👆 Збільшити
                      </div>
                      
                      {/* Navigation arrows - hidden on mobile, visible on desktop */}
                      {allImages.length > 1 && (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setCurrentImageIndex(prev => prev === 0 ? allImages.length - 1 : prev - 1);
                            }}
                            className="hidden md:flex absolute left-3 top-1/2 z-20 -translate-y-1/2 p-2 rounded-full bg-background/90 backdrop-blur-sm hover:bg-background transition-colors"
                          >
                            <ChevronLeft className="w-6 h-6 text-foreground" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setCurrentImageIndex(prev => prev === allImages.length - 1 ? 0 : prev + 1);
                            }}
                            className="hidden md:flex absolute right-3 top-1/2 z-20 -translate-y-1/2 p-2 rounded-full bg-background/90 backdrop-blur-sm hover:bg-background transition-colors"
                          >
                            <ChevronRight className="w-6 h-6 text-foreground" />
                          </button>
                        </>
                      )}
                      
                      {/* Image counter */}
                      {allImages.length > 1 && (
                        <div className="absolute top-4 left-4 z-20 px-3 py-1 rounded-full bg-background/90 backdrop-blur-sm text-sm font-medium text-foreground">
                          {currentImageIndex + 1} / {allImages.length}
                        </div>
                      )}
                      
                      {/* Image overlay with price */}
                      <div className="absolute bottom-3 left-3 right-3 z-20 md:bottom-4 md:left-4 md:right-4 flex items-end justify-between gap-2">
                        <div className="px-3 py-1.5 md:px-4 md:py-2 rounded-xl bg-background/95 backdrop-blur-sm">
                          <span className="text-lg md:text-2xl font-bold text-accent">
                            {selectedListing.price.toLocaleString()} ₴/міс
                          </span>
                        </div>
                        {userPlan === 'plan_30_days' && (
                          <Button
                            variant={savedIds.has(selectedListing.id) ? "default" : "outline"}
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSaveListing(selectedListing.id);
                            }}
                            className="rounded-xl bg-background/95 backdrop-blur-sm text-xs md:text-sm"
                          >
                            {savedIds.has(selectedListing.id) ? (
                              <>
                                <BookmarkCheck className="w-4 h-4 md:mr-2" />
                                <span className="hidden md:inline">Збережено</span>
                              </>
                            ) : (
                              <>
                                <Bookmark className="w-4 h-4 md:mr-2" />
                                <span className="hidden md:inline">Зберегти</span>
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                    
                    {/* Thumbnail strip */}
                    {allImages.length > 1 && (
                      <div className="flex gap-2 p-3 bg-background border-b border-border overflow-x-auto flex-shrink-0">
                        {allImages.map((img, idx) => (
                          <button
                            key={idx}
                            onClick={() => setCurrentImageIndex(idx)}
                            className={`flex-shrink-0 w-16 h-12 rounded-lg overflow-hidden border-2 transition-all ${
                              idx === currentImageIndex 
                                ? 'border-accent ring-2 ring-accent/20' 
                                : 'border-transparent opacity-60 hover:opacity-100'
                            }`}
                          >
                            <img 
                              src={img} 
                              alt={`Мініатюра ${idx + 1}`} 
                              className="w-full h-full object-cover bg-muted" 
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=100&h=75&fit=crop';
                              }}
                            />
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Content */}
                    <div className="p-6 space-y-6">
                      {/* Title */}
                      <div>
                        <h2 className="font-display text-2xl font-bold text-foreground mb-2">
                          {selectedListing.title}
                        </h2>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <MapPin className="w-4 h-4" />
                          <span>{selectedListing.city}</span>
                        </div>
                      </div>

                      {/* Contact Phone */}
                      {selectedListing.phone && (
                        <div className="card-container p-4 bg-accent/5 border-accent/20">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center">
                                <Phone className="w-6 h-6 text-accent" />
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground">Телефон орендодавця</p>
                                <p className="text-lg font-semibold text-foreground">{selectedListing.phone}</p>
                              </div>
                            </div>
                            <Button 
                              variant="hero" 
                              size="sm"
                              onClick={() => window.open(`tel:${selectedListing.phone}`, '_self')}
                              className="rounded-xl"
                            >
                              Зателефонувати
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* Details Grid */}
                      <div>
                        <h3 className="font-semibold text-foreground mb-3">Характеристики</h3>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          <div className="card-container p-4 text-center">
                            <Home className="w-6 h-6 mx-auto mb-2 text-accent" />
                            <p className="text-xs text-muted-foreground mb-1">Кімнат</p>
                            <p className="font-bold text-foreground text-lg">
                              {selectedListing.rooms || '—'}
                            </p>
                          </div>
                          <div className="card-container p-4 text-center">
                            <Maximize2 className="w-6 h-6 mx-auto mb-2 text-accent" />
                            <p className="text-xs text-muted-foreground mb-1">Площа</p>
                            <p className="font-bold text-foreground text-lg">
                              {selectedListing.area ? `${selectedListing.area} м²` : '—'}
                            </p>
                          </div>
                          <div className="card-container p-4 text-center">
                            <Car className="w-6 h-6 mx-auto mb-2 text-accent" />
                            <p className="text-xs text-muted-foreground mb-1">Паркінг</p>
                            <div className="flex items-center justify-center gap-1">
                              {selectedListing.has_parking ? (
                                <>
                                  <CheckCircle className="w-5 h-5 text-green-500" />
                                  <span className="font-bold text-foreground">Є</span>
                                </>
                              ) : (
                                <>
                                  <XCircle className="w-5 h-5 text-muted-foreground" />
                                  <span className="font-bold text-muted-foreground">Немає</span>
                                </>
                              )}
                            </div>
                          </div>
                          <div className="card-container p-4 text-center">
                            <Calendar className="w-6 h-6 mx-auto mb-2 text-accent" />
                            <p className="text-xs text-muted-foreground mb-1">Дата</p>
                            <p className="font-bold text-foreground text-sm">
                              {new Date(selectedListing.created_at).toLocaleDateString('uk-UA')}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Description */}
                      {selectedListing.description && (
                        <div>
                          <h3 className="font-semibold text-foreground mb-3">Опис</h3>
                          <div className="card-container p-4">
                            <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
                              {selectedListing.description}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Contact Actions */}
                      <div className="flex gap-3">
                        {selectedListing.phone && (
                          <Button 
                            variant="hero" 
                            className="flex-1"
                            onClick={() => window.open(`tel:${selectedListing.phone}`, '_self')}
                          >
                            <Phone className="w-4 h-4 mr-2" />
                            Зателефонувати
                          </Button>
                        )}
                        {userPlan === 'plan_30_days' && (
                          <Button
                            variant={savedIds.has(selectedListing.id) ? "secondary" : "outline"}
                            className="flex-1"
                            onClick={() => handleSaveListing(selectedListing.id)}
                          >
                            {savedIds.has(selectedListing.id) ? (
                              <>
                                <BookmarkCheck className="w-4 h-4 mr-2" />
                                Видалити зі збережених
                              </>
                            ) : (
                              <>
                                <Bookmark className="w-4 h-4 mr-2" />
                                Зберегти оголошення
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                  );
                })()}
              </DialogContent>
            </Dialog>

            {/* Fullscreen Image Modal for Mobile */}
            {isFullscreenImage && selectedListing && (() => {
              const allImages = selectedListing.images?.length 
                ? selectedListing.images 
                : [selectedListing.image_url || 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200&h=800&fit=crop'];
              
              return (
                <div 
                  className="fixed inset-0 z-[200] bg-black flex items-center justify-center md:hidden touch-none"
                >
                  <img
                    src={allImages[currentImageIndex]}
                    alt={`${selectedListing.title} - фото ${currentImageIndex + 1}`}
                    className="w-full h-full object-contain pointer-events-none select-none"
                  />
                  
                  {/* Close button - more prominent + reliable on mobile */}
                  <button
                    type="button"
                    aria-label="Закрити"
                    onPointerDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsFullscreenImage(false);
                    }}
                    className="absolute top-5 right-5 p-4 rounded-full bg-destructive text-destructive-foreground shadow-2xl z-10 border-4 border-background pointer-events-auto touch-manipulation"
                  >
                    <X className="w-8 h-8" strokeWidth={3} />
                  </button>
                  
                  {/* Image counter */}
                  {allImages.length > 1 && (
                    <div className="absolute top-5 left-5 px-4 py-2 rounded-full bg-background/90 text-foreground text-base font-bold shadow-lg pointer-events-none">
                      {currentImageIndex + 1} / {allImages.length}
                    </div>
                  )}
                  
                  {/* Navigation arrows for fullscreen - main controls */}
                  {allImages.length > 1 && (
                    <>
                      <button
                        type="button"
                        aria-label="Попереднє фото"
                        onPointerDown={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          goToPrevImage(allImages);
                        }}
                        className="absolute left-6 top-1/2 -translate-y-1/2 p-4 rounded-full bg-background/95 text-foreground shadow-2xl z-10 border border-border pointer-events-auto touch-manipulation"
                      >
                        <ChevronLeft className="w-10 h-10" strokeWidth={3} />
                      </button>
                      <button
                        type="button"
                        aria-label="Наступне фото"
                        onPointerDown={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          goToNextImage(allImages);
                        }}
                        className="absolute right-6 top-1/2 -translate-y-1/2 p-4 rounded-full bg-background/95 text-foreground shadow-2xl z-10 border border-border pointer-events-auto touch-manipulation"
                      >
                        <ChevronRight className="w-10 h-10" strokeWidth={3} />
                      </button>
                    </>
                  )}
                </div>
              );
            })()}

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
