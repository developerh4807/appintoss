import "./App.css";
import { GameShell } from "./pages/GameShell";
import { SplashScreen } from "./pages/SplashScreen";
import { useState } from "react";

function App() {
  const [showSplash, setShowSplash] = useState(true);

  if (showSplash) {
    return <SplashScreen onFinished={() => setShowSplash(false)} />;
  }

  return <GameShell />;
}

export default App;
