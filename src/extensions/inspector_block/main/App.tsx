import useHooks from "./hooks";

function App() {
  const { properties } = useHooks();

  if (!properties) {
    return null;
  }

  return (
    <div className="flex flex-col gap-4 text-sm text-gray-700">
      {properties.map((prop) => (
        <div key={prop.id} className="flex flex-col gap-1">
          <div className="font-bold uppercase text-black">{prop.key}</div>
          {["text", "textarea"].includes(prop.type) ? (
            <div className="whitespace-pre-wrap break-words">{prop.value}</div>
          ) : (
            <div>{prop.value}</div>
          )}
        </div>
      ))}
    </div>
  );
}

export default App;
