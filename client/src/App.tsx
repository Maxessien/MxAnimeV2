import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Route, Switch, Router as WouterRouter } from 'wouter';
import { Shell } from '@/components/layout/Shell';
import { ThemeProvider } from '@/components/theme-provider';

import Home from '@/pages/Home';
import TopAnime from '@/pages/TopAnime';
import Seasons from '@/pages/Seasons';
import Schedule from '@/pages/Schedule';
import Search from '@/pages/Search';
import AnimeDetail from '@/pages/AnimeDetail';
import History from '@/pages/History';
import Downloads from '@/pages/Downloads';
import Settings from '@/pages/Settings';
import NotFound from '@/pages/not-found';
import { ToastContainer } from 'react-toastify';
import DownloadDetails from './pages/DownloadDetails';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function Router() {
  return (
    <Shell>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/top" component={TopAnime} />
        <Route path="/seasons" component={Seasons} />
        <Route path="/schedule" component={Schedule} />
        <Route path="/search" component={Search} />
        <Route path="/anime/:id" component={AnimeDetail} />
        <Route path="/history" component={History} />
        <Route path="/downloads" component={Downloads} />
        <Route path="/downloads/:id" component={DownloadDetails} />
        <Route path="/settings" component={Settings} />
        <Route component={NotFound} />
      </Switch>
    </Shell>
  );
}

function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
            <Router />
          </WouterRouter>
          {/* <Toaster /> */}
          <ToastContainer closeButton draggable newestOnTop pauseOnHover position='top-center' theme='colored' />
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
