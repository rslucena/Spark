import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { MainLayout } from "./layouts/MainLayout";
import { motion } from "framer-motion";

function App() {
  const [greetMsg, setGreetMsg] = useState("");
  const [name, setName] = useState("");

  async function greet() {
    // Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
    setGreetMsg(await invoke("greet", { name }));
  }

  return (
    <MainLayout>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="max-w-2xl mx-auto flex flex-col items-center justify-center space-y-8 mt-12"
      >
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold tracking-tight text-white">Welcome to Spark</h1>
          <p className="text-neutral-400">Local-First Knowledge Management</p>
        </div>

        <form
          className="flex space-x-2"
          onSubmit={(e) => {
            e.preventDefault();
            greet();
          }}
        >
          <input
            id="greet-input"
            className="px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-neutral-500"
            onChange={(e) => setName(e.currentTarget.value)}
            placeholder="Enter a name..."
          />
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-md transition-colors"
          >
            Greet
          </button>
        </form>

        {greetMsg && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-lg font-medium text-green-400"
          >
            {greetMsg}
          </motion.p>
        )}
      </motion.div>
    </MainLayout>
  );
}

export default App;
