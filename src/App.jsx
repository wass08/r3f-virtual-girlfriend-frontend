import { Loader } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Leva } from "leva";
import { useState } from "react";
import { Experience } from "./components/Experience";
import { UI } from "./components/UI";

function App() {
  const [currentExpression, setCurrentExpression] = useState("");
  const [currentAnimation, setCurrentAnimation] = useState("");
  const [currentAvatar, setCurrentAvatar] = useState("Aurora"); // Default to Aurora

  return (
    <>
      <Loader />
      <Leva hidden />
      <UI 
        currentExpression={currentExpression} 
        setCurrentExpression={setCurrentExpression}
        currentAnimation={currentAnimation}
        setCurrentAnimation={setCurrentAnimation}
        currentAvatar={currentAvatar}
        setCurrentAvatar={setCurrentAvatar}
      />
      <Canvas shadows camera={{ position: [0, 0, 1], fov: 30 }}>
        <Experience 
          currentExpression={currentExpression} 
          currentAnimation={currentAnimation}
          currentAvatar={currentAvatar}
        />
      </Canvas>
    </>
  );
}

export default App;
