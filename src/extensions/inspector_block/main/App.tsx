import useHooks from "./hooks";
import PropertyValue, { SingleValueProperty } from "./PropertyValue";

function App() {
  const { properties } = useHooks();

  if (!properties) {
    return null;
  }

  return (
    <div className="flex flex-col gap-4 text-sm text-gray-700">
      {properties.map((prop) => (
        <div key={prop.id} className="flex flex-col gap-1">
          <div className="font-bold text-black">{prop.name ?? prop.key}</div>
          {Array.isArray(prop.value) ? (
            <div className="flex flex-col gap-1">
              {prop.value.map((item, index) => (
                <PropertyValue
                  key={index}
                  property={{ ...prop, value: item }}
                />
              ))}
            </div>
          ) : (
            <PropertyValue property={prop as SingleValueProperty} />
          )}
        </div>
      ))}
    </div>
  );
}

export default App;
