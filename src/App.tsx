import "./App.css";
import Navbar from "./compontents/navbar/navbar.tsx";
import DataSelector from "./compontents/dataSelector.tsx";

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
