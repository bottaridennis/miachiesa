import React, { useState } from 'react';
import { ViewMode } from './types';
import HomeView from './components/HomeView';
import LiturgyView from './components/LiturgyView';
import CommunityView from './components/CommunityView';
import ServicesView from './components/ServicesView';
import AdminView from './components/AdminView';
import RegistrationsView from './components/RegistrationsView';
import DonationsView from './components/DonationsView';
import GlobalSearch from './components/GlobalSearch';
import { Home, BookOpen, Users, FileText, Settings, LogIn, LogOut, ClipboardList, Heart } from 'lucide-react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useDocument } from 'react-firebase-hooks/firestore';
import { auth, db, loginWithGoogle, logout } from './firebase';
import { doc, setDoc } from 'firebase/firestore';
import { AnimatePresence, motion } from 'motion/react';

export default function App() {
  const [currentView, setCurrentView] = useState<ViewMode | 'admin' | 'registrations'>('home');
  const [user, loading] = useAuthState(auth);
  const [userDoc] = useDocument(user ? doc(db, 'users', user.uid) : null);

  React.useEffect(() => {
    // Visitor tracking logic
    const visitorId = localStorage.getItem('visitor_id');
    if (!visitorId) {
      const newVisitorId = Math.random().toString(36).substring(2, 15);
      localStorage.setItem('visitor_id', newVisitorId);
      setDoc(doc(db, 'visitors', newVisitorId), {
        timestamp: new Date().toISOString()
      }).catch(console.error);
    }

    if (user) {
      setDoc(doc(db, 'users', user.uid), {
        name: user.displayName,
        email: user.email,
        photoUrl: user.photoURL,
        lastLogin: new Date().toISOString()
      }, { merge: true });
    }
  }, [user]);

  const isAdmin = user?.email === 'dennisbottari@gmail.com' || userDoc?.data()?.isAdmin === true;

  const renderView = () => {
    switch (currentView) {
      case 'home': return <HomeView setCurrentView={setCurrentView} />;
      case 'liturgy': return <LiturgyView />;
      case 'community': return <CommunityView />;
      case 'services': return <ServicesView />;
      case 'admin': return <AdminView />;
      case 'registrations': return <RegistrationsView />;
      case 'donations': return <DonationsView />;
      default: return <HomeView setCurrentView={setCurrentView} />;
    }
  };

  const navItems = [
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'liturgy', icon: BookOpen, label: 'Liturgia' },
    { id: 'community', icon: Users, label: 'Comunità' },
    { id: 'services', icon: FileText, label: 'Servizi' },
    { id: 'registrations', icon: ClipboardList, label: 'Iscrizioni' },
    { id: 'donations', icon: Heart, label: 'Donazioni' },
  ] as const;

  return (
    <div className="min-h-screen bg-church-50 flex flex-col md:flex-row">
      
      {/* Desktop Sidebar (hidden on mobile) */}
      <aside className="hidden md:flex flex-col w-64 bg-church-900 border-r-4 border-yellow-400 fixed h-full z-50 text-white">
        <div className="p-6">
          <h1 className="text-2xl font-serif font-bold text-yellow-400">Unità Pastorale</h1>
          <p className="text-xs text-church-300 mt-1">Oppeano e Ca' degli Oppi</p>
        </div>
        <nav className="flex-1 px-4 space-y-2 mt-4 overflow-y-auto">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id as any)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded transition-all font-medium ${
                currentView === item.id 
                  ? 'bg-church-800/50 text-yellow-400' 
                  : 'text-church-300 hover:bg-church-800/30 hover:text-white'
              }`}
            >
              <item.icon size={20} className={currentView === item.id ? 'text-yellow-400' : 'text-church-400'} />
              {item.label}
            </button>
          ))}
          {user && (
            <button
              onClick={() => setCurrentView('admin')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded transition-all font-medium mt-4 ${
                currentView === 'admin' 
                  ? 'bg-church-800/50 text-yellow-400' 
                  : 'text-church-300 hover:bg-church-800/30 hover:text-white'
              }`}
            >
              <Settings size={20} className={currentView === 'admin' ? 'text-yellow-400' : 'text-church-400'} />
              {isAdmin ? 'Area Riservata' : 'Area Utente'}
            </button>
          )}
        </nav>
        
        <div className="p-4 border-t border-church-800 mt-auto">
          {loading ? (
            <div className="text-church-400 text-sm">Caricamento...</div>
          ) : user ? (
            <div className="flex flex-col gap-2">
              <span className="text-xs text-church-300 truncate" title={user.email || ''}>{user.email}</span>
              <button 
                onClick={logout}
                className="flex items-center gap-2 text-sm text-church-400 hover:text-white transition-colors"
              >
                <LogOut size={16} /> Esci
              </button>
            </div>
          ) : (
            <button 
              onClick={loginWithGoogle}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-church-800 text-white rounded hover:bg-church-700 transition-colors text-sm font-medium"
            >
              <LogIn size={16} /> Accedi
            </button>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 md:ml-64 relative min-h-screen max-w-full overflow-x-hidden">
        {/* Mobile Header */}
        <header className="md:hidden bg-church-900 sticky top-0 z-40 border-b-4 border-yellow-400 px-4 py-4 flex flex-col justify-center items-center shadow-sm">
          <h1 className="text-xl font-serif font-bold text-yellow-400 tracking-wide">Unità Pastorale</h1>
          <p className="text-[10px] text-church-300">Oppeano e Ca' degli Oppi</p>
          
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            {!loading && !user && (
              <button onClick={loginWithGoogle} className="p-2 text-church-300 hover:text-white">
                <LogIn size={20} />
              </button>
            )}
            {!loading && user && (
              <button onClick={() => setCurrentView('admin')} className={`p-2 ${currentView === 'admin' ? 'text-yellow-400' : 'text-church-300 hover:text-white'}`}>
                <Settings size={20} />
              </button>
            )}
          </div>
        </header>

        <div className="hidden md:block sticky top-0 z-40 bg-church-50/90 backdrop-blur-md border-b border-church-200">
          <GlobalSearch setCurrentView={setCurrentView} />
        </div>
        <div className="md:hidden">
          <GlobalSearch setCurrentView={setCurrentView} />
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentView}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {renderView()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-lg border-t border-church-200 px-1 pb-[env(safe-area-inset-bottom)] z-50">
        <div className="flex justify-around items-center h-16">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id as any)}
              className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors overflow-hidden ${
                currentView === item.id ? 'text-yellow-500' : 'text-church-400 hover:text-yellow-500'
              }`}
            >
              <item.icon size={22} className={`shrink-0 ${currentView === item.id ? 'fill-yellow-500/10' : ''}`} />
              <span className="text-[10px] font-semibold w-full text-center truncate px-0.5">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
