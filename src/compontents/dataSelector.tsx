import Map from "./map/map.tsx";

function DataSelector() {
  return (
    <>
      <div className="flex h-full w-full flex-row justify-stretch">
        <div className="flex w-full border-4 border-amber-500">
          <Map />
        </div>
        <div className="flex w-full border-4 border-blue-900">Table Here</div>
      </div>
    </>
  );
}

export default DataSelector;
