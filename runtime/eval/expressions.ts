import {
	AssignmentExpr,
	BinaryExpr,
	CallExpr,
	Identifier,
	ObjectLiteral,
} from "../../frontend/ast.ts";
import Environment from "../environment.ts";
import { evaluate } from "../interpreter.ts";
import {
	FunctionValue,
	MK_NULL,
	NativeFnValue,
	NumberVal,
	ObjectVal,
	RuntimeVal,
	MK_NUMBER,
} from "../values.ts";

function eval_numeric_binary_expr(
	lhs: NumberVal,
	rhs: NumberVal,
	operator: string
): NumberVal {
	let result: number;
	if (operator == "+") {
		result = lhs.value + rhs.value;
	} else if (operator == "-") {
		result = lhs.value - rhs.value;
	} else if (operator == "*") {
		result = lhs.value * rhs.value;
	} else if (operator == "/") {
		// TODO: Division by zero checks
		result = lhs.value / rhs.value;
	} else {
		result = lhs.value % rhs.value;
	}

	return { value: result, type: "number" };
}

/**
 * Evaulates expressions following the binary operation type.
 */
export async function eval_binary_expr(
	binop: BinaryExpr,
	env: Environment
): Promise<RuntimeVal> {
	const lhs = await evaluate(binop.left, env);
	const rhs = await evaluate(binop.right, env);

	// Support numeric and comparison operations
	if (lhs.type == "number" && rhs.type == "number") {
		const lnum = lhs as NumberVal;
		const rnum = rhs as NumberVal;
		switch (binop.operator) {
			case "+":
			case "-":
			case "*":
			case "/":
			case "%":
				return eval_numeric_binary_expr(lnum, rnum, binop.operator);
			case "==":
				return MK_NUMBER(lnum.value === rnum.value ? 1 : 0);
			case "<":
				return MK_NUMBER(lnum.value < rnum.value ? 1 : 0);
			case ">":
				return MK_NUMBER(lnum.value > rnum.value ? 1 : 0);
			case "<=":
				return MK_NUMBER(lnum.value <= rnum.value ? 1 : 0);
			case ">=":
				return MK_NUMBER(lnum.value >= rnum.value ? 1 : 0);
		}
	}

	// One or both are NULL
	return MK_NULL();
}

export async function eval_identifier(
	ident: Identifier,
	env: Environment
): Promise<RuntimeVal> {
	const val = env.lookupVar(ident.symbol);
	return val;
}

export async function eval_assignment(
	node: AssignmentExpr,
	env: Environment
): Promise<RuntimeVal> {
	if (node.assigne.kind !== "Identifier") {
		throw `Invalid LHS inaide assignment expr ${JSON.stringify(node.assigne)}`;
	}

	const varname = (node.assigne as Identifier).symbol;
	return env.assignVar(varname, await evaluate(node.value, env));
}

export async function eval_object_expr(
	obj: ObjectLiteral,
	env: Environment
): Promise<RuntimeVal> {
	const object = { type: "object", properties: new Map() } as ObjectVal;
	for (const { key, value } of obj.properties) {
		const runtimeVal =
			value == undefined ? env.lookupVar(key) : await evaluate(value, env);

		object.properties.set(key, runtimeVal);
	}

	return object;
}

export async function eval_call_expr(expr: CallExpr, env: Environment): Promise<RuntimeVal> {
	const args = [];
	for (const arg of expr.args) {
		args.push(await evaluate(arg, env));
	}
	const fn = await evaluate(expr.caller, env);

	if (fn.type == "native-fn") {
		const result = await (fn as NativeFnValue).call(args, env);
		return result;
	}

	if (fn.type == "function") {
		const func = fn as FunctionValue;
		const scope = new Environment(func.declarationEnv);

		// Create the variables for the parameters list
		for (let i = 0; i < func.parameters.length; i++) {
			// TODO Check the bounds here.
			// verify arity of function
			const varname = func.parameters[i];
			scope.declareVar(varname, args[i], false);
		}

		let result: RuntimeVal = MK_NULL();
		// Evaluate the function body line by line
		try {
			for (const stmt of func.body) {
				result = await evaluate(stmt, scope);
			}
		} catch (e) {
			if (e && e.type === "__return__") {
				return e.value;
			}
			throw e;
		}

		return result;
	}

	throw "Cannot call value that is not a function: " + JSON.stringify(fn);
}
