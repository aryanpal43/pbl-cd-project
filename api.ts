import { serve } from "https://deno.land/std@0.181.0/http/server.ts";
import { evaluate } from "./runtime/interpreter.ts";
import Parser from "./frontend/parser.ts";
import { createGlobalEnv } from "./runtime/environment.ts";

function runUserCode(code: string, inputs: any[] = []): string {
  let output = "";
  // Patch console.log to capture output
  const originalLog = console.log;
  console.log = (...args: any[]) => {
    output += args.join(" ") + "\n";
  };
  try {
    const parser = new Parser();
    const ast = parser.produceAST(code);
    const env = createGlobalEnv();
    // Attach inputProvider to env for scan()
    (env as any).inputProvider = Array.isArray(inputs) ? [...inputs] : [];
    const result = await evaluate(ast, env);
    // Show the result of the last evaluated expression if not null
    if (result && result.type !== "null" && typeof result.value !== "undefined") {
      output += String(result.value) + "\n";
    }
  } catch (e) {
    output += "Error: " + (e?.message || e) + "\n";
  }
  console.log = originalLog;
  return output;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  if (req.method === "POST" && new URL(req.url).pathname === "/run") {
    const { code, inputs } = await req.json();
    const result = await runUserCode(code, inputs);
    return new Response(JSON.stringify({ output: result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  return new Response("Not found", { status: 404, headers: corsHeaders });
}); 