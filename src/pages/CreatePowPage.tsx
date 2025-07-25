import { useSeoMeta } from '@unhead/react';
import { CreatePowNote } from '@/components/CreatePowNote';
import { LoginArea } from '@/components/auth/LoginArea';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const CreatePowPage = () => {
  useSeoMeta({
    title: 'Create PoW Note | Nostr PoW Explorer',
    description: 'Create your own Nostr note with Proof of Work. Mine a note with your desired difficulty level.',
  });

  return (
    <div className="min-h-screen bg-background">
      <header className="shadow-sm border-b dark:border-gray-800 py-2">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-bold">Nostr PoW Explorer</h1>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" asChild>
                <Link to="/">Explore</Link>
              </Button>
              <Button variant="default" size="sm" asChild>
                <Link to="/create">Create</Link>
              </Button>
            </div>
          </div>
          <LoginArea className="max-w-60" />
        </div>
        <footer className="text-center text-xs text-muted-foreground mt-1">
          <p>Built with MKStack • Vibed with MKStack • <a href="https://soapbox.pub/mkstack" className="underline">soapbox.pub/mkstack</a></p>
        </footer>
      </header>

      <main>
        <CreatePowNote />
      </main>
      
      <footer className="mt-12 border-t py-6 dark:border-gray-800">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>
            This application showcases Proof of Work in Nostr as defined in{' '}
            <a 
              href="https://github.com/nostr-protocol/nips/blob/master/13.md" 
              target="_blank" 
              rel="noreferrer"
              className="font-medium underline hover:text-primary"
            >
              NIP-13
            </a>.
          </p>
          <p className="mt-2">
            © {new Date().getFullYear()} Nostr PoW Explorer
          </p>
        </div>
      </footer>
    </div>
  );
};

export default CreatePowPage;