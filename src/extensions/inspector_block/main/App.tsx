import useHooks from "./hooks";

function App() {
  const { properties } = useHooks();

  if (!properties) {
    return null;
  }

  return (
    <div className="flex flex-col gap-2 text-sm">
      {properties.map((prop) => (
        <div key={prop.id}>
          <strong>{prop.key}</strong>
          <pre>{prop.value}</pre>
        </div>
      ))}
    </div>
  );
}

export default App;
