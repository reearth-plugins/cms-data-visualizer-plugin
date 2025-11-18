import useHooks from "./hooks";
import PropertyItem from "./PropertyItem";

function App() {
  const { inspector } = useHooks();

  if (!inspector) {
    return null;
  }

  return (
    <div className="flex flex-col gap-4 text-sm text-gray-700">
      {inspector.title && (
        <div className="text-lg font-bold">{inspector.title}</div>
      )}
      {inspector.properties.map((property) =>
        property.type === "group" ? (
          <div key={property.id} className="flex flex-col gap-2">
            {!property.hideTitle && (
              <div className="font-bold text-black">
                {property.name ?? property.key}
              </div>
            )}
            <div key={property.id} className="flex flex-col gap-2">
              {property.children?.map((child) => (
                <PropertyItem key={child.id} property={child} />
              )) ?? null}
            </div>
          </div>
        ) : (
          <PropertyItem key={property.id} property={property} />
        )
      )}
    </div>
  );
}

export default App;
