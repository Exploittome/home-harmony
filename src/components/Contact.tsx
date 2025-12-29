import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { Send } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
export function Contact() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const {
    toast
  } = useToast();
  const {
    ref,
    isVisible
  } = useScrollAnimation();
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) {
      toast({
        title: 'Помилка',
        description: 'Будь ласка, заповніть всі поля',
        variant: 'destructive'
      });
      return;
    }
    setLoading(true);

    try {
      // Send to Telegram
      const { data, error } = await supabase.functions.invoke('send-telegram', {
        body: {
          name: name.trim(),
          email: email.trim(),
          message: message.trim()
        }
      });

      if (error) throw error;

      // Also save to database
      await supabase
        .from('contact_messages')
        .insert({
          name: name.trim(),
          email: email.trim(),
          message: message.trim()
        });

      toast({
        title: 'Повідомлення надіслано!',
        description: 'Ми зв\'яжемося з вами найближчим часом.'
      });
      setName('');
      setEmail('');
      setMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Помилка',
        description: 'Не вдалося надіслати повідомлення. Спробуйте ще раз.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };
  return <section id="contact" className="py-24 px-4">
      <div className="max-w-7xl mx-auto">
        <div ref={ref} className={`transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-semibold text-foreground mb-4">
                Зв'яжіться з нами
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Маєте питання? Потрібна допомога? Напишіть нам, і ми обов'язково відповімо.
              </p>
              <div className="space-y-4 text-muted-foreground">
                <p>📧 support@gotohome.com.ua</p>
                <p>📞 +380 (77) 777-77-77</p>
                <p>Львів, Україна</p>
              </div>
            </div>

            <div className="card-container p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-foreground mb-2">
                    Ім'я
                  </label>
                  <Input id="name" value={name} onChange={e => setName(e.target.value)} placeholder="Ваше ім'я" className="rounded-xl h-12" maxLength={100} />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                    Email
                  </label>
                  <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" className="rounded-xl h-12" maxLength={255} />
                </div>
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-foreground mb-2">
                    Повідомлення
                  </label>
                  <Textarea id="message" value={message} onChange={e => setMessage(e.target.value)} placeholder="Ваше повідомлення..." className="rounded-xl min-h-[120px] resize-none" maxLength={1000} />
                </div>
                <Button type="submit" variant="hero" size="lg" className="w-full" disabled={loading}>
                  {loading ? 'Надсилання...' : 'Надіслати'}
                  <Send className="w-4 h-4 ml-2" />
                </Button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>;
}