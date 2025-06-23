# Custom Interpreter & Web IDE

A TypeScript-based interpreter for a custom programming language, featuring a modern web-based IDE (VS Code–like) built with React and Monaco Editor. The project supports variables, arithmetic, if/else, while/for loops, user-defined functions, return statements, string literals, and interactive input via `scan()`.

---

## Features
- **Custom Language Interpreter** (TypeScript/Deno)
  - Variables (`let`, `const`), arithmetic, comparison, and logical operators
  - Control flow: `if`, `else`, `while`, `for` loops
  - User-defined functions with `return`
  - String literals and string concatenation
  - Interactive input with `scan()`
  - Print output with `print()`
- **Web IDE** (React + Monaco Editor)
  - VS Code–like look and feel
  - Run code and see output in real time
  - Interactive input support (modal prompt for `scan()`)

---

## Directory Structure

```
.
├── api.ts                # Deno backend HTTP API for code execution
├── main.ts               # CLI runner for interpreter
├── ws-server.ts          # Deno WebSocket server for interactive input
├── frontend/             # Lexer, parser, and AST for the language
├── runtime/              # Interpreter, environment, and runtime values
├── test.txt              # Example input file
└── web-ide/web-ide/      # React web IDE (Vite project)
```

---

## Prerequisites
- [Deno](https://deno.land/) (v1.30+ recommended)
- [Node.js](https://nodejs.org/) (v18+ recommended)
- [npm](https://www.npmjs.com/) (for frontend)

---

## Getting Started

### 1. Clone the Repository
```sh
git clone <your-repo-url>
cd ep11-user-defined-functions
```

### 2. Install Frontend Dependencies
```sh
cd web-ide/web-ide
npm install
```

### 3. Start the Backend (Deno HTTP API)
In the project root:
```sh
deno run --allow-net --allow-read api.ts
```
- This starts the HTTP server on `http://localhost:8000` (for non-interactive code)

### 4. Start the WebSocket Server (for interactive input)
In a new terminal, in the project root:
```sh
deno run --allow-net --allow-read ws-server.ts
```
- This starts the WebSocket server on `ws://localhost:8181` (for code using `scan()`)

### 5. Start the Web IDE (Frontend)
In `web-ide/web-ide`:
```sh
npm run dev
```
- Open the URL shown in the terminal (usually `http://localhost:5173`)

---

## How to Use
1. Write your code in the Monaco Editor (left panel).
2. Click the **Run ▶** button.
3. Output appears in the Output panel below.
4. If your code uses `scan()`, an input prompt will appear for user input.

### Example Code
```
let name = scan();
let age = scan();
print("Hello, " + name + "! You are " + age + " years old.");
```

---

## Troubleshooting
- **CORS errors:** Make sure the backend (`api.ts`) is running and accessible from the frontend's port.
- **Port conflicts:** Default ports are 8000 (HTTP API) and 8181 (WebSocket). Change them in the source if needed.
- **Deno permissions:** Always use `--allow-net --allow-read` when running Deno scripts.
- **Frontend not loading:** Ensure you are in `web-ide/web-ide` when running `npm run dev`.

---

## Contributing
Pull requests and issues are welcome! Please open an issue for bugs or feature requests.

## License
MIT License. See [LICENSE](LICENSE) for details. 