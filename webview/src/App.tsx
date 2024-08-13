
import "./App.css";

import  Response  from "@/pages/Response";
import "primereact/resources/themes/mdc-dark-deeppurple/theme.css";
import "primeicons/primeicons.css"; //icons
import "primeflex/primeflex.css"; // flex
import "@/styles/custom-theme.css";
import "@/styles/monokai.css";
function App() {
  

  return (
    <main>
      {/* <Response /> */}
      <i className="pi pi-check" style={{ fontSize: "1rem" }}></i>
      <i className="pi pi-times" style={{ fontSize: "1.5rem" }}></i>
      <i className="pi pi-search" style={{ fontSize: "2rem" }}></i>
      <i className="pi pi-user" style={{ fontSize: "2.5rem" }}></i>
    </main>
  );
}

export default App;
