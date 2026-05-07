import { onMount, Show, createEffect, onCleanup, type ParentProps } from "solid-js";
import { Router, Route, useNavigate } from "@solidjs/router";
import { useThemeStore } from "./stores/theme";
import { useClashStore } from "./stores/clash";
import { useSettingsStore } from "./stores/settings";
import { activeNode, setActiveNode } from "./stores/activeNode";
import { clashRepository } from "@/domain";
import { logger, logEmoji } from "./utils/logger";
import { performanceMonitor, trackAction } from "./utils/performance";
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
    // 初始化性能监控
    performanceMonitor.measureWebVitals();
    trackAction("app_mount", "lifecycle");
    
    settingsStore.loadSettings();
    if (!clash.connected()) clash.connect();

    if (typeof window !== 'undefined') {
      const wizardControls = {
        closeWizard: () => {
          settingsStore.updateSettings({ wizard_completed: true });
          settingsStore.saveSettings();
          logger.log(`${logEmoji.success} Wizard closed via console command`);
        },
        resetWizard: () => {
          settingsStore.updateSettings({ wizard_completed: false });
          settingsStore.saveSettings();
          logger.log(`${logEmoji.warning} Wizard reset via console command`);
        },
        showWizard: () => {
          settingsStore.updateSettings({ wizard_completed: false });
          logger.log(`${logEmoji.wizard} Wizard will show on next render`);
        },
      };

      window.closeWizard = wizardControls.closeWizard;
      window.resetWizard = wizardControls.resetWizard;
      window.showWizard = wizardControls.showWizard;

      window.hyperion = {
        version: '0.5.0',
        ...wizardControls,
      };

      logger.log(`${logEmoji.info} Hyperion v0.5.0 initialized`);
      logger.log(`${logEmoji.info} Debug commands available: window.hyperion.closeWizard(), .resetWizard(), .showWizard()`);
    }
  });

  createEffect(() => {
    if (settingsStore.settings().first_run) {
      settingsStore.updateSettings({ first_run: false });
      settingsStore.saveSettings();
      logger.log(`${logEmoji.info} First run flag cleared`);
    }

    const savedConnection = localStorage.getItem('hyperion-connection');
    if (savedConnection && !settingsStore.settings().wizard_completed) {
      try {
        const config = JSON.parse(savedConnection);
        if (config.host && config.port) {
          logger.log(`${logEmoji.connection} Detected existing connection config, auto-skipping wizard`);
          settingsStore.updateSettings({ wizard_completed: true });
          settingsStore.saveSettings();
        }
      } catch (e) {
        logger.error(`${logEmoji.error} Failed to parse saved connection:`, e);
      }
    }
  });

  const handleWizardComplete = () => {
    settingsStore.updateSettings({ wizard_completed: true });
    settingsStore.saveSettings();
    logger.log(`${logEmoji.success} Wizard completed`);
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
  const clash = useClashStore();
  const navigate = useNavigate();

  onMount(() => {
    import("./services/hotkeys").then(({ hotkeyService }) => {
      hotkeyService.onAction('toggle-proxy', () => {});
      hotkeyService.onAction('reload-config', () => { clash.connect(); });
      hotkeyService.onAction('show-connections', () => { navigate('/connections'); });
      hotkeyService.onAction('show-proxies', () => { navigate('/proxies'); });
      hotkeyService.onAction('open-settings', () => { navigate('/settings'); });
    }).catch((e) => {
      logger.error(`${logEmoji.error} Failed to load hotkeys service:`, e);
    });

    const fetchActiveNode = async () => {
      try {
        const data = await clashRepository.proxy.list() as any;
        const globalNow = data?.proxies?.GLOBAL?.now || data?.proxies?.["🚀 节点选择"]?.now || "";
        if (globalNow) setActiveNode(globalNow);
      } catch (e) {
        logger.error(`${logEmoji.error} Failed to fetch active node:`, e);
      }
    };

    fetchActiveNode();
    const timer = setInterval(fetchActiveNode, 15000);
    onCleanup(() => clearInterval(timer));
  });

  return <MainLayout>{props.children}</MainLayout>;
}
