import { NumberVal, RuntimeVal, FunctionValue, MK_NULL, MK_STRING } from "./values.ts";
import {
	AssignmentExpr,
	BinaryExpr,
	CallExpr,
	FunctionDeclaration,
	Identifier,
	NumericLiteral,
	ObjectLiteral,
	Program,
	Stmt,
	VarDeclaration,
	IfStatement,
	WhileStatement,
	ForStatement,
	StringLiteral,
	ReturnStatement,
} from "../frontend/ast.ts";
import Environment from "./environment.ts";
import {
	eval_function_declaration,
	eval_program,
	eval_var_declaration,
} from "./eval/statements.ts";
import {
	eval_assignment,
	eval_binary_expr,
	eval_call_expr,
	eval_identifier,
	eval_object_expr,
} from "./eval/expressions.ts";

export async function evaluate(astNode: Stmt, env: Environment): Promise<RuntimeVal> {
	switch (astNode.kind) {
		case "NumericLiteral":
			return {
				value: (astNode as NumericLiteral).value,
				type: "number",
			} as NumberVal;
		case "Identifier":
			return await eval_identifier(astNode as Identifier, env);
		case "ObjectLiteral":
			return await eval_object_expr(astNode as ObjectLiteral, env);
		case "CallExpr":
			return await eval_call_expr(astNode as CallExpr, env);
		case "AssignmentExpr":
			return await eval_assignment(astNode as AssignmentExpr, env);
		case "BinaryExpr": {
			const bin = astNode as BinaryExpr;
			const left = await evaluate(bin.left, env);
			const right = await evaluate(bin.right, env);
			if (bin.operator === "+") {
				if (left.type === "string" || right.type === "string") {
					return MK_STRING(String((left as any).value ?? left) + String((right as any).value ?? right));
				}
			}
			return await eval_binary_expr(astNode as BinaryExpr, env);
		}
		case "Program":
			return await eval_program(astNode as Program, env);
		// Handle statements
		case "VarDeclaration":
			return await eval_var_declaration(astNode as VarDeclaration, env);
		case "FunctionDeclaration":
			return await eval_function_declaration(astNode as FunctionDeclaration, env);
		case "IfStatement": {
			const { test, consequent, alternate } = astNode as IfStatement;
			const testVal = await evaluate(test, env) as NumberVal;
			if (testVal.type === "number" && testVal.value) {
				let result: RuntimeVal = MK_NULL();
				for (const stmt of consequent) {
					result = await evaluate(stmt, env);
				}
				return result;
			} else if (alternate) {
				let result: RuntimeVal = MK_NULL();
				for (const stmt of alternate) {
					result = await evaluate(stmt, env);
				}
				return result;
			}
			return MK_NULL();
		}
		case "WhileStatement": {
			const { test, body } = astNode as WhileStatement;
			let result: RuntimeVal = MK_NULL();
			while (true) {
				const testVal = await evaluate(test, env) as NumberVal;
				if (!(testVal.type === "number" && testVal.value)) break;
				for (const stmt of body) {
					result = await evaluate(stmt, env);
				}
			}
			return result;
		}
		case "ForStatement": {
			const { init, test, update, body } = astNode as ForStatement;
			let result: RuntimeVal = MK_NULL();
			const loopEnv = new Environment(env);
			if (init) {
				if (init.kind === "VarDeclaration") {
					await eval_var_declaration(init, loopEnv);
				} else {
					await evaluate(init, loopEnv);
				}
			}
			while (true) {
				if (test) {
					const testVal = await evaluate(test, loopEnv) as NumberVal;
					if (!(testVal.type === "number" && testVal.value)) break;
				}
				for (const stmt of body) {
					result = await evaluate(stmt, loopEnv);
				}
				if (update) await evaluate(update, loopEnv);
			}
			return result;
		}
		case "StringLiteral":
			return MK_STRING(astNode.value);
		case "ReturnStatement": {
			const value = astNode.value ? await evaluate(astNode.value, env) : MK_NULL();
			throw { type: "__return__", value };
		}
		// Handle unimplimented ast types as error.
		default:
			console.error(
				"This AST Node has not yet been setup for interpretation.\n",
				astNode
			);
			return MK_NULL();
	}
}
