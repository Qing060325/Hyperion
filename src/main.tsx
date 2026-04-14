/* @refresh reload */
import { render } from "solid-js/web";
import App from "./App";
import "./index.css";
import "./components/ui/RippleEffect"; // Register ripple directive type

const root = document.getElementById("root");
if (!root) throw new Error("Root element not found");

render(() => <App />, root);
