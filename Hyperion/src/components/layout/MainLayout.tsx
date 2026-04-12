import { type ParentProps, type Component, Show, createSignal } from "solid-js";
import { TitleBar } from "./TitleBar";
import { Sidebar } from "./Sidebar";
import { StatusBar } from "./StatusBar";

export const MainLayout: Component<ParentProps> = (props) => {
  return (
    <div class="flex flex-col h-screen w-screen overflow-hidden" style={{ background: "var(--bg-primary)" }}>
      <TitleBar />
      <div class="flex flex-1 overflow-hidden">
        <Sidebar />
        <main class="flex-1 overflow-auto p-5" style={{
          background: "var(--bg-primary)",
        }}>
          {props.children}
        </main>
      </div>
      <StatusBar />
    </div>
  );
};
