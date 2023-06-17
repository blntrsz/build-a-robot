"use client";
import { useState } from "react";
import useWebSocket from "react-use-websocket";

export default function Home() {
  const [isHeadActive, setIsHeadActive] = useState(true);
  const [isBodyActive, setIsBodyActive] = useState(true);
  const [isLegsActive, setIsLegsActive] = useState(true);

  const isCreating = !(isBodyActive && isHeadActive && isLegsActive);

  useWebSocket(process.env.NEXT_PUBLIC_WS_URL ?? "", {
    onOpen: () => {
      console.log("WebSocket connection established.");
    },
    onMessage: (message) => {
      if (message.data === "Head Created!") {
        setIsHeadActive(true);
      }
      if (message.data === "Body Created!") {
        setIsBodyActive(true);
      }

      if (message.data === "Robot creation finished!") {
        setIsLegsActive(true);
      }
    },
  });

  return (
    <main className="max-w-4xl m-auto p-16 flex flex-col gap-8">
      <RobotPart text={"Head"} isActive={isHeadActive} />
      <RobotPart text={"Body"} isActive={isBodyActive} />
      <RobotPart text={"Legs"} isActive={isLegsActive} />
      {isCreating ? (
        <button disabled>Building robot...</button>
      ) : (
        <button
          onClick={() => {
            setIsBodyActive(false);
            setIsHeadActive(false);
            setIsLegsActive(false);

            fetch(process.env.NEXT_PUBLIC_API_URL ?? "", {
              method: "POST",
            });
          }}
        >
          Build a robot
        </button>
      )}
    </main>
  );
}

interface RobotPartProps {
  text: string;
  isActive: boolean;
}

function RobotPart({ text, isActive }: RobotPartProps) {
  return (
    <section
      className={`transition-colors duration-1000 p-4 font-extrabold rounded-xl text-black ${
        isActive ? "bg-orange-500" : "bg-orange-50"
      }`}
    >
      {text}
    </section>
  );
}
