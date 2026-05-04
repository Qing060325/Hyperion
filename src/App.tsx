import { onMount, Show, createEffect, createSignal, onCleanup, type ParentProps } from "solid-js";
import { Router, Route, useNavigate } from "@solidjs/router";
import { useThemeStore } from "./stores/theme";
import { useClashStore } from "./stores/clash";
import { useSettingsStore } from "./stores/settings";
import Sidebar from "./components/layout/Sidebar";
import MobileNav from "./components/layout/MobileNav";
import WelcomeWizard from "./components/wizard/WelcomeWizard";
import SakuraCanvas from "./components/sakura/SakuraCanvas";
import ScenicBackdrop from "./components/scenic/ScenicBackdrop";
import PageTransition from "./components/ui/PageTransition";
import "./components/ui/RippleEffect";
import Dashboard from "./pages/Dashboard";
import Proxies from "./pages/Proxies";
import Connections from "./pages/Connections";
import Rules from "./pages/Rules";
import Logs from "./pages/Logs";
import Configs from "./pages/Configs";
import DNS from "./pages/DNS";
import Subscriptions from "./pages/Subscriptions";
import Settings from "./pages/Settings";
import Profiles from "./pages/Profiles";
import RuleEditorPage from "./pages/RuleEditorPage";

export default function App() {
  useThemeStore();
  const clash = useClashStore();
  const settingsStore = useSettingsStore();

  onMount(() => {
    settingsStore.loadSettings();
    if (!clash.connected()) clash.connect();
  });

  createEffect(() => {
    if (settingsStore.settings().first_run) {
      settingsStore.updateSettings({ first_run: false });
      settingsStore.saveSettings();
    }
  });

  const handleWizardComplete = () => {
    settingsStore.updateSettings({ wizard_completed: true });
    settingsStore.saveSettings();
  };

  return (
    <>
      <Show when={!settingsStore.settings().wizard_completed}>
        <WelcomeWizard onComplete={handleWizardComplete} />
      </Show>

      <Router root={Root}>
        <Route path="/" component={Dashboard} />
        <Route path="/proxies" component={Proxies} />
        <Route path="/connections" component={Connections} />
        <Route path="/rules" component={Rules} />
        <Route path="/rules/editor" component={RuleEditorPage} />
        <Route path="/logs" component={Logs} />
        <Route path="/configs" component={Configs} />
        <Route path="/dns" component={DNS} />
        <Route path="/subscriptions" component={Subscriptions} />
        <Route path="/settings" component={Settings} />
        <Route path="/profiles" component={Profiles} />
        {/* New routes for the upgraded nav */}
        <Route path="/nodes" component={Proxies} />
        <Route path="/traffic" component={Connections} />
      </Router>
    </>
  );
}

function Root(props: ParentProps) {
  onMount(() => {
    const clash = useClashStore();
    import("./services/hotkeys").then(({ hotkeyService }) => {
      const navigate = useNavigate();
      hotkeyService.onAction('toggle-proxy', () => {});
      hotkeyService.onAction('reload-config', () => { clash.connect(); });
      hotkeyService.onAction('show-connections', () => { navigate('/connections'); });
      hotkeyService.onAction('show-proxies', () => { navigate('/proxies'); });
      hotkeyService.onAction('open-settings', () => { navigate('/settings'); });
    });
  });

  const clash = useClashStore();
  const [activeNode, setActiveNode] = createSignal("");

  onMount(() => {
    const fetchActiveNode = async () => {
      try {
        const res = await fetch(`${clash.baseUrl()}/proxies`, { headers: clash.headers() });
        if (!res.ok) return;
        const data = await res.json();
        const globalNow = data?.proxies?.GLOBAL?.now || data?.proxies?.["🚀 节点选择"]?.now || "";
        if (globalNow) setActiveNode(globalNow);
      } catch (e) {
        console.error(e);
      }
    };

    fetchActiveNode();
    const timer = setInterval(fetchActiveNode, 15000);
    onCleanup(() => clearInterval(timer));
  });

  return (
    <div class="app-layout bg-base-200 noise-bg">
      <ScenicBackdrop nodeName={activeNode()} />
      <SakuraCanvas />
      <Sidebar />
      <main class="main-content" style={{ position: "relative", "z-index": 1 }}>
        <div class="p-4 md:p-6 lg:p-8 max-w-[1400px] mx-auto">
          <PageTransition>{props.children}</PageTransition>
        </div>
      </main>
      <MobileNav />
    </div>
  );
}
