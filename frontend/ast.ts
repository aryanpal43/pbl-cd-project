// deno-lint-ignore-file no-empty-interface
// https://github.com/tlaceby/guide-to-interpreters-series

// -----------------------------------------------------------
// --------------          AST TYPES        ------------------
// ---     Defines the structure of our languages AST      ---
// -----------------------------------------------------------

export type NodeType =
	| "Program"
	| "VarDeclaration"
	| "FunctionDeclaration"
	| "IfStatement"
	| "WhileStatement"
	| "ForStatement"
	| "ReturnStatement"
	| "AssignmentExpr"
	| "MemberExpr"
	| "CallExpr"
	| "Property"
	| "ObjectLiteral"
	| "NumericLiteral"
	| "Identifier"
	| "BinaryExpr"
	| "StringLiteral";

/**
 * Statements do not result in a value at runtime.
 They contain one or more expressions internally */
export interface Stmt {
	kind: NodeType;
}

/**
 * Defines a block which contains many statements.
 * -  Only one program will be contained in a file.
 */
export interface Program extends Stmt {
	kind: "Program";
	body: Stmt[];
}

export interface VarDeclaration extends Stmt {
	kind: "VarDeclaration";
	constant: boolean;
	identifier: string;
	value?: Expr;
}

export interface FunctionDeclaration extends Stmt {
	kind: "FunctionDeclaration";
	parameters: string[];
	name: string;
	body: Stmt[];
}

/**  Expressions will result in a value at runtime unlike Statements */
export interface Expr extends Stmt {}

export interface AssignmentExpr extends Expr {
	kind: "AssignmentExpr";
	assigne: Expr;
	value: Expr;
}

/**
 * A operation with two sides seperated by a operator.
 * Both sides can be ANY Complex Expression.
 * - Supported Operators -> + | - | / | * | %
 */
export interface BinaryExpr extends Expr {
	kind: "BinaryExpr";
	left: Expr;
	right: Expr;
	operator: string; // needs to be of type BinaryOperator
}

export interface CallExpr extends Expr {
	kind: "CallExpr";
	args: Expr[];
	caller: Expr;
}

export interface MemberExpr extends Expr {
	kind: "MemberExpr";
	object: Expr;
	property: Expr;
	computed: boolean;
}

// LITERAL / PRIMARY EXPRESSION TYPES
/**
 * Represents a user-defined variable or symbol in source.
 */
export interface Identifier extends Expr {
	kind: "Identifier";
	symbol: string;
}

/**
 * Represents a numeric constant inside the soure code.
 */
export interface NumericLiteral extends Expr {
	kind: "NumericLiteral";
	value: number;
}

export interface Property extends Expr {
	kind: "Property";
	key: string;
	value?: Expr;
}

export interface ObjectLiteral extends Expr {
	kind: "ObjectLiteral";
	properties: Property[];
}

export interface IfStatement extends Stmt {
	kind: "IfStatement";
	test: Expr;
	consequent: Stmt[];
	alternate?: Stmt[];
}

export interface WhileStatement extends Stmt {
	kind: "WhileStatement";
	test: Expr;
	body: Stmt[];
}

export interface ForStatement extends Stmt {
	kind: "ForStatement";
	init?: Stmt;
	test?: Expr;
	update?: Expr;
	body: Stmt[];
}

export interface StringLiteral extends Expr {
	kind: "StringLiteral";
	value: string;
}

export interface ReturnStatement extends Stmt {
	kind: "ReturnStatement";
	value?: Expr;
}
