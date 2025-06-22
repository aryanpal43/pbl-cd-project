import React, { useState, useRef } from "react";
import MonacoEditor from "@monaco-editor/react";

export default function App() {
  const [code, setCode] = useState(
`let x=scan();
fn add(a, b) {
  return a + b;
}
print(add(1, 2));
if(1)
{
  print(x);
}else
{
  print(x+1);
}
print("hello world");
`
);
  const [outputLines, setOutputLines] = useState([]);
  const [outputHeight, setOutputHeight] = useState(100); // Initial output panel height
  const [waitingForInput, setWaitingForInput] = useState(false);
  const [inputPrompt, setInputPrompt] = useState("");
  const wsRef = useRef(null);
  const dragging = useRef(false);
  const inputRef = useRef(null);

  // Helper: detect if code uses scan()
  function codeUsesScan(code) {
    return /\bscan\s*\(/.test(code);
  }

  // Connect to WebSocket and handle interactive session
  const runCode = async () => {
    setOutputLines([]);
    setWaitingForInput(false);
    setInputPrompt("");
    if (codeUsesScan(code)) {
      // Use WebSocket interactive mode
      if (wsRef.current) {
        wsRef.current.close();
      }
      const ws = new window.WebSocket("ws://localhost:8181");
      wsRef.current = ws;
      ws.onopen = () => {
        ws.send(JSON.stringify({ code }));
      };
      ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.type === "output") {
          setOutputLines(lines => [...lines, msg.data]);
        } else if (msg.type === "scan") {
          setWaitingForInput(true);
          setInputPrompt("");
          setTimeout(() => {
            if (inputRef.current) inputRef.current.focus();
          }, 100);
        } else if (msg.type === "done") {
          setWaitingForInput(false);
          setInputPrompt("");
          ws.close();
        }
      };
      ws.onerror = (e) => {
        setOutputLines(lines => [...lines, "[WebSocket error]"]);
      };
      ws.onclose = () => {
        setWaitingForInput(false);
        setInputPrompt("");
      };
    } else {
      // Use HTTP POST for non-interactive code
      setOutputLines(["Running..."]);
      try {
        const res = await fetch("http://localhost:8000/run", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code }),
        });
        const data = await res.json();
        console.log('[DEBUG] HTTP response from backend:', data);
        setOutputLines(data.output.split("\n").filter(line => line.length > 0));
      } catch (e) {
        setOutputLines(["Error: " + e.message]);
      }
    }
  };

  // Handle user input for scan
  const sendInput = (e) => {
    e.preventDefault();
    if (wsRef.current && inputPrompt.trim() !== "") {
      wsRef.current.send(JSON.stringify({ input: inputPrompt }));
      setOutputLines(lines => [...lines, "> " + inputPrompt]);
      setInputPrompt("");
      setWaitingForInput(false);
    }
  };

  // Drag handlers for resizing output panel
  const onMouseDown = (e) => {
    dragging.current = true;
    document.body.style.cursor = "row-resize";
  };
  React.useEffect(() => {
    const onMouseMove = (e) => {
      if (!dragging.current) return;
      const container = document.getElementById("editor-container");
      if (container) {
        const rect = container.getBoundingClientRect();
        const newHeight = rect.bottom - e.clientY;
        if (newHeight > 40 && newHeight < rect.height - 40) {
          setOutputHeight(newHeight);
        }
      }
    };
    const onMouseUp = () => {
      dragging.current = false;
      document.body.style.cursor = "default";
    };
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, []);

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", background: "#1e1e1e" }}>
      {/* Top Bar */}
      <div style={{ height: 40, background: "#23272e", color: "#fff", display: "flex", alignItems: "center", paddingLeft: 16, fontWeight: 600, letterSpacing: 1 }}>
        <span style={{ color: "#4FC3F7", marginRight: 8 }}>●</span> Custom Interpreter IDE
      </div>
      <div style={{ flex: 1, display: "flex", minHeight: 0 }}>
        {/* Sidebar */}
        <div style={{ width: 56, background: "#21252b", display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 12 }}>
          {/* VS Code-like icons (placeholders) */}
          <div style={{ width: 32, height: 32, marginBottom: 8, background: "#333", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", color: "#4FC3F7", fontSize: 20 }}>📄</div>
          <div style={{ width: 32, height: 32, marginBottom: 8, background: "#333", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", color: "#81C784", fontSize: 20 }}>🔍</div>
          <div style={{ width: 32, height: 32, marginBottom: 8, background: "#333", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", color: "#FFD54F", fontSize: 20 }}>🐞</div>
        </div>
        {/* Main Editor Area */}
        <div id="editor-container" style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0, position: "relative" }}>
          <div style={{ flex: 1, minHeight: 0, height: `calc(100% - ${outputHeight}px)` }}>
            <MonacoEditor
              height="100%"
              defaultLanguage="javascript"
              theme="vs-dark"
              value={code}
              onChange={value => setCode(value)}
              options={{
                fontSize: 16,
                fontFamily: 'Fira Mono, Menlo, Monaco, Consolas, monospace',
                minimap: { enabled: false },
                lineNumbers: "on",
                scrollBeyondLastLine: false,
                wordWrap: "on",
                automaticLayout: true,
                tabSize: 2,
                padding: { top: 16 },
              }}
            />
          </div>
          {/* Drag Bar */}
          <div
            style={{
              height: 6,
              cursor: "row-resize",
              background: dragging.current ? "#4FC3F7" : "#23272e",
              width: "100%",
              zIndex: 10,
              position: "relative",
            }}
            onMouseDown={onMouseDown}
          />
          {/* Output Panel */}
          <div style={{
            background: "#181a1b",
            color: "#b9f18d",
            padding: 12,
            fontFamily: "Fira Mono, monospace",
            fontSize: 15,
            minHeight: 40,
            maxHeight: "60vh",
            height: outputHeight,
            borderTop: "1px solid #222",
            overflowY: "auto",
            transition: "height 0.1s",
          }}>
            <div style={{ display: "flex", alignItems: "center", marginBottom: 4 }}>
              <button onClick={runCode} style={{ background: "#4FC3F7", color: "#222", border: "none", borderRadius: 4, padding: "4px 16px", fontWeight: 600, marginRight: 12, cursor: "pointer" }}>Run ▶</button>
              <span style={{ color: "#fff", fontSize: 14, opacity: 0.7, marginRight: 16 }}>Output:</span>
            </div>
            <div style={{ minHeight: 30 }}>
              {console.log('[DEBUG] Rendering outputLines:', outputLines)}
              {outputLines.map((line, i) => (
                <div key={i} style={{ whiteSpace: "pre-wrap" }}>{line}</div>
              ))}
            </div>
            {/* Modal Popup for scan() input */}
            {waitingForInput && (
              <div style={{
                position: "fixed",
                top: 0,
                left: 0,
                width: "100vw",
                height: "100vh",
                background: "rgba(30,30,30,0.7)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 1000,
              }}>
                <form onSubmit={sendInput} style={{
                  background: "#23272e",
                  border: "3px solid #FFD54F",
                  borderRadius: 12,
                  padding: 36,
                  boxShadow: "0 8px 32px #000a",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  minWidth: 320,
                }}>
                  <div style={{ color: '#FFD54F', fontWeight: 700, fontSize: 22, marginBottom: 18 }}>
                    Input Required
                  </div>
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputPrompt}
                    onChange={e => setInputPrompt(e.target.value)}
                    style={{
                      background: "#181a1b",
                      color: "#b9f18d",
                      border: "2px solid #FFD54F",
                      borderRadius: 6,
                      padding: "12px 18px",
                      fontFamily: "Fira Mono, monospace",
                      fontSize: 20,
                      width: 220,
                      outline: "none",
                      boxShadow: "0 0 12px #FFD54F",
                      caretColor: "#FFD54F",
                      marginBottom: 18,
                    }}
                    disabled={!waitingForInput}
                    autoFocus
                  />
                  <button type="submit" style={{
                    background: "#FFD54F",
                    color: "#222",
                    border: "none",
                    borderRadius: 4,
                    padding: "10px 32px",
                    fontWeight: 700,
                    fontSize: 18,
                    cursor: "pointer",
                  }} disabled={!waitingForInput}>Submit</button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 