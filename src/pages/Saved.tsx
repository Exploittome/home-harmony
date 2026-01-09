import { useState, useEffect, useRef, TouchEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useTheme } from '@/hooks/useTheme';
import { Sun, Moon, ArrowLeft, MapPin, Home, Trash2, Phone, Maximize2, Car, Calendar, CheckCircle, XCircle, ChevronLeft, ChevronRight, X } from 'lucide-react';
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

interface SavedListing {
  id: string;
  listing: Listing;
}

export default function Saved() {
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [user, setUser] = useState<User | null>(null);
  const [savedListings, setSavedListings] = useState<SavedListing[]>([]);
  const [loading, setLoading] = useState(true);
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
        setCurrentImageIndex(prev => prev === allImages.length - 1 ? 0 : prev + 1);
      } else {
        setCurrentImageIndex(prev => prev === 0 ? allImages.length - 1 : prev - 1);
      }
    }
    
    touchStartX.current = null;
    touchEndX.current = null;
    isSwiping.current = false;
  };

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

  const fetchSavedListings = async (userId: string) => {
    const { data, error } = await supabase
      .from('saved_listings')
      .select(`
        id,
        listing:listings (
          id,
          title,
          price,
          city,
          rooms,
          area,
          has_parking,
          phone,
          image_url,
          images,
          description,
          created_at
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching saved listings:', error);
      toast({
        title: "Помилка",
        description: "Не вдалося завантажити збережені оголошення",
        variant: "destructive",
      });
    } else {
      setSavedListings(data as unknown as SavedListing[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (!session?.user) {
        navigate('/auth');
      } else {
        fetchSavedListings(session.user.id);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (!session?.user) {
        navigate('/auth');
      } else {
        fetchSavedListings(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleRemove = async (savedId: string, listingId: string) => {
    const { error } = await supabase
      .from('saved_listings')
      .delete()
      .eq('id', savedId);

    if (error) {
      toast({
        title: "Помилка",
        description: "Не вдалося видалити оголошення",
        variant: "destructive",
      });
    } else {
      setSavedListings(prev => prev.filter(item => item.id !== savedId));
      // Close modal if the deleted listing was being viewed
      if (selectedListing?.id === listingId) {
        setSelectedListing(null);
      }
      toast({
        title: "Видалено",
        description: "Оголошення видалено зі збережених",
      });
    }
  };

  // Find saved id by listing id
  const getSavedIdByListingId = (listingId: string) => {
    const found = savedListings.find(item => item.listing.id === listingId);
    return found?.id;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/main')} className="rounded-full">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <Link to="/" className="flex items-center gap-3">
              <img src="/images/logo.png" alt="GOTOHOME" className="w-10 h-10 object-contain" />
              <span className="font-display text-xl font-semibold text-foreground">GOTOHOME</span>
            </Link>
          </div>

          <Button variant="ghost" size="icon" onClick={toggleTheme} className="rounded-full">
            {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="font-display text-2xl md:text-3xl font-semibold text-foreground mb-6">
          Збережені оголошення
        </h1>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Завантаження...</p>
          </div>
        ) : savedListings.length === 0 ? (
          <div className="card-container p-8 text-center">
            <p className="text-muted-foreground mb-4">У вас поки немає збережених оголошень</p>
            <Button variant="hero" onClick={() => navigate('/main')}>
              Переглянути оголошення
            </Button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
            {savedListings.map((item) => (
              <div key={item.id} className="card-container-hover overflow-hidden">
                <div 
                  className="relative aspect-[4/3] cursor-pointer"
                  onClick={() => {
                    setSelectedListing(item.listing);
                    setCurrentImageIndex(0);
                  }}
                >
                  <img
                    src={item.listing.image_url || 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&h=300&fit=crop'}
                    alt={item.listing.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 right-3 px-3 py-1 rounded-full bg-background/90 backdrop-blur-sm text-foreground font-semibold text-sm">
                    {item.listing.price.toLocaleString()} ₴/міс
                  </div>
                </div>
                <div className="p-5">
                  <h3 
                    className="font-display text-lg font-semibold text-foreground mb-2 cursor-pointer hover:text-accent transition-colors"
                    onClick={() => {
                      setSelectedListing(item.listing);
                      setCurrentImageIndex(0);
                    }}
                  >
                    {item.listing.title}
                  </h3>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {item.listing.city}
                    </span>
                    {item.listing.rooms && (
                      <span className="flex items-center gap-1">
                        <Home className="w-4 h-4" />
                        {item.listing.rooms} кім.
                      </span>
                    )}
                  </div>
                  {item.listing.description && (
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {item.listing.description}
                    </p>
                  )}
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      className="flex-1 rounded-xl"
                      onClick={() => {
                        setSelectedListing(item.listing);
                        setCurrentImageIndex(0);
                      }}
                    >
                      Детальніше
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="rounded-xl text-destructive border-destructive hover:bg-destructive/10"
                      onClick={() => handleRemove(item.id, item.listing.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
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
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0 md:max-h-[90vh]">
            {selectedListing && (() => {
              const allImages = selectedListing.images?.length 
                ? selectedListing.images 
                : [selectedListing.image_url || 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200&h=800&fit=crop'];
              
              return (
              <div className="flex flex-col">
                {/* Image Carousel */}
                <div 
                  className="relative aspect-[16/10] bg-muted cursor-pointer md:cursor-default"
                  onClick={() => window.innerWidth < 768 && setIsFullscreenImage(true)}
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={() => handleTouchEnd(allImages)}
                >
                  <img
                    src={allImages[currentImageIndex]}
                    alt={`${selectedListing.title} - фото ${currentImageIndex + 1}`}
                    className="w-full h-full object-contain bg-muted transition-opacity duration-300"
                  />
                  
                  {/* Tap to fullscreen hint on mobile */}
                  <div className="absolute bottom-2 right-2 px-2 py-1 rounded-full bg-background/80 backdrop-blur-sm text-xs text-foreground md:hidden">
                    Натисніть для збільшення
                  </div>
                  
                  {/* Navigation arrows */}
                  {allImages.length > 1 && (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setCurrentImageIndex(prev => prev === 0 ? allImages.length - 1 : prev - 1);
                        }}
                        className="hidden md:flex absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-background/90 backdrop-blur-sm hover:bg-background transition-colors"
                      >
                        <ChevronLeft className="w-6 h-6 text-foreground" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setCurrentImageIndex(prev => prev === allImages.length - 1 ? 0 : prev + 1);
                        }}
                        className="hidden md:flex absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-background/90 backdrop-blur-sm hover:bg-background transition-colors"
                      >
                        <ChevronRight className="w-6 h-6 text-foreground" />
                      </button>
                    </>
                  )}
                  
                  {/* Image counter */}
                  {allImages.length > 1 && (
                    <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-background/90 backdrop-blur-sm text-sm font-medium text-foreground">
                      {currentImageIndex + 1} / {allImages.length}
                    </div>
                  )}
                  
                  {/* Image overlay with price */}
                  <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
                    <div className="px-4 py-2 rounded-xl bg-background/95 backdrop-blur-sm">
                      <span className="text-2xl font-bold text-accent">
                        {selectedListing.price.toLocaleString()} ₴/міс
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Thumbnail strip */}
                {allImages.length > 1 && (
                  <div className="flex gap-2 p-3 bg-muted/50 overflow-x-auto">
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
                        <img src={img} alt={`Мініатюра ${idx + 1}`} className="w-full h-full object-contain bg-muted" />
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
                    <Button
                      variant="outline"
                      className="flex-1 text-destructive border-destructive hover:bg-destructive/10"
                      onClick={() => {
                        const savedId = getSavedIdByListingId(selectedListing.id);
                        if (savedId) {
                          handleRemove(savedId, selectedListing.id);
                        }
                      }}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Видалити зі збережених
                    </Button>
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
              
              {/* Close button */}
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
              
              {/* Navigation arrows for fullscreen */}
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
      </div>
    </div>
  );
}
