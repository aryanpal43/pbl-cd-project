import Parser from "./frontend/parser.ts";
import { createGlobalEnv } from "./runtime/environment.ts";
import { evaluate } from "./runtime/interpreter.ts";

run("./test.txt");

async function run(filename: string) {
	const parser = new Parser();
	const env = createGlobalEnv();
	(env as any).inputProvider = [];
	(env as any).ws = null; 
	const originalLog = console.log;
	console.log = (...args: any[]) => {
		originalLog(...args);
	};
	const input = await Deno.readTextFile(filename);
	const program = parser.produceAST(input);
	const origScan = (env as any).variables.get("scan");
	if (origScan) {
		(env as any).variables.set("scan", {
			type: "native-fn",
			call: async (_args: any[], scope: any) => {
				const provider = (scope as any).inputProvider;
				if (provider && Array.isArray(provider) && provider.length > 0) {
					const value = provider.shift();
					if (!isNaN(Number(value))) {
						return { type: "number", value: Number(value) };
					} else {
						return { type: "string", value: String(value) };
					}
				}
				await Deno.stdout.write(new TextEncoder().encode("> "));
				const buf = new Uint8Array(1024);
				const n = <number>await Deno.stdin.read(buf);
				const inputStr = new TextDecoder().decode(buf.subarray(0, n)).trim();
				if (!isNaN(Number(inputStr))) {
					return { type: "number", value: Number(inputStr) };
				} else {
					return { type: "string", value: String(inputStr) };
				}
			},
		});
	}

	const result = await evaluate(program, env);
	console.log = originalLog;
}
