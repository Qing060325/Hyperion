import { Route, Router, A } from "@solidjs/router";
import { useThemeStore } from "./stores/theme";
import Sidebar from "./components/layout/Sidebar";
import MobileNav from "./components/layout/MobileNav";
import Dashboard from "./pages/Dashboard";
import Proxies from "./pages/Proxies";
import Connections from "./pages/Connections";
import Rules from "./pages/Rules";
import Logs from "./pages/Logs";
import Configs from "./pages/Configs";
import DNS from "./pages/DNS";
import Subscriptions from "./pages/Subscriptions";
import Settings from "./pages/Settings";

export default function App() {
  useThemeStore();

  return (
    <Router root={Root}>
      <Route path="/" component={Dashboard} />
      <Route path="/proxies" component={Proxies} />
      <Route path="/connections" component={Connections} />
      <Route path="/rules" component={Rules} />
      <Route path="/logs" component={Logs} />
      <Route path="/configs" component={Configs} />
      <Route path="/dns" component={DNS} />
      <Route path="/subscriptions" component={Subscriptions} />
      <Route path="/settings" component={Settings} />
    </Router>
  );
}

function Root(props: any) {
  return (
    <div class="app-layout bg-base-200">
      <Sidebar />
      <main class="main-content">
        <div class="p-4 md:p-6 lg:p-8 max-w-[1400px] mx-auto">
          {props.children}
        </div>
      </main>
      <MobileNav />
    </div>
  );
}
