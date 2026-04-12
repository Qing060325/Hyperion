import { type ParentProps, Show, createSignal, onMount } from "solid-js";
import { A, Route, RouteDataArgs, useMatch, useNavigate, useParams } from "@solidjs/router";
import MainLayout from "./components/layout/MainLayout";
import { TitleBar } from "./components/layout/TitleBar";
import { Sidebar } from "./components/layout/Sidebar";
import { StatusBar } from "./components/layout/StatusBar";
import { createClashStore } from "./stores/clash";
import { createThemeStore } from "./stores/theme";
import Dashboard from "./pages/Dashboard";
import Proxies from "./pages/Proxies";
import Connections from "./pages/Connections";
import Rules from "./pages/Rules";
import Logs from "./pages/Logs";
import Configs from "./pages/Configs";
import DNS from "./pages/DNS";
import Subscriptions from "./pages/Subscriptions";
import Settings from "./pages/Settings";

export default function App(props: ParentProps) {
  const clash = createClashStore();
  const theme = createThemeStore();

  return (
    <MainLayout>
      <Route path="/" component={Dashboard} />
      <Route path="/proxies" component={Proxies} />
      <Route path="/connections" component={Connections} />
      <Route path="/rules" component={Rules} />
      <Route path="/logs" component={Logs} />
      <Route path="/configs" component={Configs} />
      <Route path="/dns" component={DNS} />
      <Route path="/subscriptions" component={Subscriptions} />
      <Route path="/settings" component={Settings} />
    </MainLayout>
  );
}
