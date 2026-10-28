import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch, Router as WouterRouter } from "wouter";
import { Shell } from "@/components/layout/Shell";
import { ThemeProvider } from "@/components/theme-provider";

import Home from "@/pages/Home";
import TopAnime from "@/pages/TopAnime";
import Seasons from "@/pages/Seasons";
import Schedule from "@/pages/Schedule";
import Search from "@/pages/Search";
import AnimeDetail from "@/pages/AnimeDetail";
import Downloads from "@/pages/Downloads";
import Settings from "@/pages/Settings";
import { ToastContainer } from "react-toastify";
import DownloadDetails from "./pages/DownloadDetails";
import { AnimeStream, AnimeStreamLocal } from "./pages/AnimeStream";
import { useEffect, useState } from "react";
import {
  isPermissionGranted,
  requestPermission,
} from "@tauri-apps/plugin-notification";
import { isMobile } from "./lib/utils";
import { listen, UnlistenFn } from "@tauri-apps/api/event";
import LatestEpisodes from "./pages/LatestEpisodes";
import { ongoingDownloadQueue } from "./lib/queue";
import axios from "axios";
import UpdatePopup from "./components/layout/UpdatePopup";


// Update on every github release to match github release tag name
const APP_RELEASE_TAG = "v0.1.0"

const LATEST_RELEASE_API = "https://api.github.com/repos/Maxessien/MxAnimeV2/releases/latest"

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
    <Switch>
      <Route path="/stream/local" component={AnimeStreamLocal} />
      <Shell>
          <Route path="/" component={Home} />
          <Route path="/stream" component={AnimeStream} />
          <Route path="/top" component={TopAnime} />
          <Route path="/seasons" component={Seasons} />
          <Route path="/latest" component={LatestEpisodes} />
          <Route path="/schedule" component={Schedule} />
          <Route path="/search" component={Search} />
          <Route path="/anime/:id" component={AnimeDetail} />
          <Route path="/downloads" component={Downloads} />
          <Route path="/downloads/:id" component={DownloadDetails} />
          <Route path="/settings" component={Settings} />
          {/*<Route component={NotFound} />*/}
      </Shell>
      </Switch>
  );
}

function App() {
  const [showUpdatePopup, setShowUpdatePopup] = useState(false)
  useEffect(() => {
    (async () => {
      let granted = await isPermissionGranted();
      if (!granted && isMobile) await requestPermission();
      try {
        const { data } = await axios.get(LATEST_RELEASE_API)
        if (data.tag_name && data.tag_name !== APP_RELEASE_TAG) setShowUpdatePopup(true)
      } catch (err) {}
    })();

    let unlisten: UnlistenFn | undefined;

    listen<{
      current: number;
      total: number;
      task_id: string;
      title: string;
    }>("dl_progress", async ({ payload }) => {

      ongoingDownloadQueue.updateProg(payload.task_id, {
        curr: payload.current / (1024 * 1024),
        total: payload.total / (1024 * 1024),
      });
    }).then((fn) => (unlisten = fn));

    return () => {
      if (unlisten) unlisten();
    };
  }, []);

  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          {showUpdatePopup && <UpdatePopup hidePopup={()=> setShowUpdatePopup(false)} />}
          {/* <Toaster /> */}
          <ToastContainer
            closeButton
            draggable
            newestOnTop
            pauseOnHover
            position="top-center"
            theme="colored"
          />
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
