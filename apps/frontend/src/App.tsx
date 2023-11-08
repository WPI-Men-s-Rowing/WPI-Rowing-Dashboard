import "./App.css";
import DataSelector from "./compontents/dataSelector.tsx";
import Navbar from "./compontents/navbar/navbar.tsx";

function App() {
  return (
    <>
      <div className="flex h-screen w-screen flex-col">
        <Navbar />
        <DataSelector />
      </div>
    </>
  );
}

export default App;
