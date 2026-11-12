import { StoreProvider, useStore } from './lib/store';
import { Toasts } from './components/ui';
import { Logo } from './components/Mascot';
import { Categories, Daily, GamesScreen, Home, LangSelect, MapScreen, Profiles, Register, Welcome, WorldScreen } from './screens/main';
import { GameHost, QuizHost, ResultScreen } from './screens/play';
import { Achievements, Leaderboard, Weekly, useChampionCheck } from './screens/compete';
import { Help, Parent, ProfileScreen, Settings } from './screens/parent';

const NO_PROFILE = new Set(['welcome', 'lang', 'register', 'profiles']);
/** Hər marşrut obyektinə sabit açar (yeni oyun = yeni komponent, amma yenidən render zamanı vəziyyət qorunur) */
const ids = new WeakMap<object, number>();
let nextId = 0;
const keyOf = (o: object) => {
  if (!ids.has(o)) ids.set(o, ++nextId);
  return ids.get(o)!;
};

function Router() {
  const { ready, route, profile, data } = useStore();
  useChampionCheck();
  if (!ready)
    return (
      <div className="grid min-h-screen place-items-center">
        <Logo size={150} />
      </div>
    );
  if (!profile && !NO_PROFILE.has(route.name)) return data.profiles.length ? <Profiles /> : <LangSelect />;
  switch (route.name) {
    case 'welcome': return <Welcome />;
    case 'lang': return <LangSelect />;
    case 'register': return <Register />;
    case 'profiles': return <Profiles />;
    case 'home': return <Home />;
    case 'categories': return <Categories />;
    case 'quiz': return <QuizHost key={keyOf(route)} session={route.session} />;
    case 'game': return <GameHost key={keyOf(route)} session={route.session} game={route.game} />;
    case 'result': return <ResultScreen session={route.session} ok={route.ok} n={route.n} score={route.score} />;
    case 'map': return <MapScreen />;
    case 'world': return <WorldScreen id={route.id} />;
    case 'games': return <GamesScreen kind={route.kind} />;
    case 'daily': return <Daily />;
    case 'weekly': return <Weekly />;
    case 'leaderboard': return <Leaderboard />;
    case 'achievements': return <Achievements />;
    case 'profile': return <ProfileScreen />;
    case 'parent': return <Parent />;
    case 'settings': return <Settings />;
    case 'help': return <Help />;
  }
}

export default function App() {
  return (
    <StoreProvider>
      <Router />
      <Toasts />
    </StoreProvider>
  );
}
