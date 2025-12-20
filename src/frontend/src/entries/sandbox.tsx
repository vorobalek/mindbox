import "../styles/sandbox.css";

import { createRoot } from "react-dom/client";
import { App } from "../app/App";

(function () {
  let mount = document.getElementById("app");
  if (!mount) {
    mount = document.createElement("main");
    mount.id = "app";
    document.body.appendChild(mount);
  }

  mount.className = "wrap";
  createRoot(mount).render(<App />);
})();


