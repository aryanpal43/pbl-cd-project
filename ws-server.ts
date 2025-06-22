import { serve } from "https://deno.land/std@0.181.0/http/server.ts";
import { evaluate } from "./runtime/interpreter.ts";
import Parser from "./frontend/parser.ts";
import { createGlobalEnv } from "./runtime/environment.ts";

const clients = new Set<WebSocket>();

function handleWs(sock: WebSocket) {
  clients.add(sock);

  sock.onmessage = async (event) => {
    try {
      const msg = JSON.parse(event.data);
      if (msg.code) {
        // Run code with interactive scan
        let output = "";
        const parser = new Parser();
        const ast = parser.produceAST(msg.code);
        const env = createGlobalEnv();
        (env as any).ws = sock;
        (env as any).output = (text: string) => {
          output += text + "\n";
          sock.send(JSON.stringify({ type: "output", data: text }));
        };
        // Patch console.log
        const originalLog = console.log;
        console.log = (...args: any[]) => {
          (env as any).output(args.join(" "));
        };
        try {
          await evaluate(ast, env);
        } catch (e) {
          (env as any).output("Error: " + (e?.message || e));
        }
        console.log = originalLog;
        sock.send(JSON.stringify({ type: "done" }));
      } else if (msg.input) {
        // Input from user for scan
        if ((sock as any).scanResolver) {
          (sock as any).scanResolver(msg.input);
          (sock as any).scanResolver = null;
        }
      }
    } catch (e) {
      sock.send(JSON.stringify({ type: "output", data: "[Server error]" }));
    }
  };

  sock.onclose = () => {
    clients.delete(sock);
  };

  sock.onerror = (e) => {
    clients.delete(sock);
  };
}

serve(async (req) => {
  const { socket, response } = Deno.upgradeWebSocket(req);
  handleWs(socket);
  return response;
}, { port: 8181 }); 