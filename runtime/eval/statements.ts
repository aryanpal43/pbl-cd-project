import {
	FunctionDeclaration,
	Program,
	VarDeclaration,
} from "../../frontend/ast.ts";
import Environment from "../environment.ts";
import { evaluate } from "../interpreter.ts";
import { FunctionValue, MK_NULL, RuntimeVal } from "../values.ts";

export async function eval_program(program: Program, env: Environment): Promise<RuntimeVal> {
	let lastEvaluated: RuntimeVal = MK_NULL();
	for (const statement of program.body) {
		lastEvaluated = await evaluate(statement, env);
	}
	return lastEvaluated;
}

export async function eval_var_declaration(
	declaration: VarDeclaration,
	env: Environment
): Promise<RuntimeVal> {
	const value = declaration.value
		? await evaluate(declaration.value, env)
		: MK_NULL();

	return env.declareVar(declaration.identifier, value, declaration.constant);
}

export async function eval_function_declaration(
	declaration: FunctionDeclaration,
	env: Environment
): Promise<RuntimeVal> {
	// Create new function scope
	const fn = {
		type: "function",
		name: declaration.name,
		parameters: declaration.parameters,
		declarationEnv: env,
		body: declaration.body,
	} as FunctionValue;

	env.declareVar(declaration.name, fn, true);
	return fn;
}
