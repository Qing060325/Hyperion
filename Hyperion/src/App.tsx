import { onMount, Show, createEffect, type ParentProps } from "solid-js";
import { Router, Route, useNavigate } from "@solidjs/router";
import { useThemeStore } from "./stores/theme";
import { useClashStore } from "./stores/clash";
import { useSettingsStore } from "./stores/settings";
import Sidebar from "./components/layout/Sidebar";
import MobileNav from "./components/layout/MobileNav";
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
    // Load settings from localStorage
    settingsStore.loadSettings();
    
    // Connect to Clash if configured
    if (!clash.connected()) clash.connect();
  });

  // Mark first run as complete after initial load
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
      {/* Show welcome wizard for first-time users */}
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
      </Router>
    </>
  );
}

function Root(props: ParentProps) {
  // Initialize hotkey service inside Router context (has access to navigate)
  onMount(() => {
    const clash = useClashStore();
    import("./services/hotkeys").then(({ hotkeyService }) => {
      const navigate = useNavigate();
      hotkeyService.onAction('toggle-proxy', () => {});
      hotkeyService.onAction('reload-config', () => { clash.reloadConfig(); });
      hotkeyService.onAction('show-connections', () => { navigate('/connections'); });
      hotkeyService.onAction('show-proxies', () => { navigate('/proxies'); });
      hotkeyService.onAction('open-settings', () => { navigate('/settings'); });
    });
  });

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
