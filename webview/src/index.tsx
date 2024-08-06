import { render } from "preact";
import App from "./App";
import { PrimeReactProvider } from "primereact/api";


render(
  <PrimeReactProvider>
    <App />
  </PrimeReactProvider>,
  document.getElementById("root")!
);