import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/hooks/useTheme';
import { Sun, Moon, ArrowLeft, MapPin, Home, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import { useToast } from '@/hooks/use-toast';

interface SavedListing {
  id: string;
  listing: {
    id: string;
    title: string;
    price: number;
    city: string;
    rooms: number | null;
    image_url: string | null;
    description: string | null;
  };
}

export default function Saved() {
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [user, setUser] = useState<User | null>(null);
  const [savedListings, setSavedListings] = useState<SavedListing[]>([]);
  const [loading, setLoading] = useState(true);

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
          image_url,
          description
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

  const handleRemove = async (savedId: string) => {
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
      toast({
        title: "Видалено",
        description: "Оголошення видалено зі збережених",
      });
    }
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
                <div className="relative aspect-[4/3]">
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
                  <h3 className="font-display text-lg font-semibold text-foreground mb-2">
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
                  <Button
                    variant="outline"
                    className="w-full rounded-xl text-destructive border-destructive hover:bg-destructive/10"
                    onClick={() => handleRemove(item.id)}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Видалити зі збережених
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
