import { onMount, Show, createEffect, onCleanup, type ParentProps } from "solid-js";
import { Router, Route, useNavigate } from "@solidjs/router";
import { useThemeStore } from "./stores/theme";
import { useClashStore } from "./stores/clash";
import { useSettingsStore } from "./stores/settings";
import { activeNode, setActiveNode } from "./stores/activeNode";
import { clashRepository } from "@/domain";
import MainLayout from "./components/layout/MainLayout";
import WelcomeWizard from "./components/wizard/WelcomeWizard";
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

      <Router root={LayoutWrapper}>
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
        <Route path="/nodes" component={Proxies} />
        <Route path="/traffic" component={Connections} />
      </Router>
    </>
  );
}

function LayoutWrapper(props: ParentProps) {
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

  onMount(() => {
    const fetchActiveNode = async () => {
      try {
        const data = await clashRepository.proxy.list() as any;
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

  return <MainLayout>{props.children}</MainLayout>;
}
