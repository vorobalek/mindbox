const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor as new (
  ...args: string[]
) => (...args: unknown[]) => Promise<unknown>;

export async function evalJs(code: string): Promise<unknown> {
  // Try expression mode first: `return (<expr>)`. If it fails to parse, fall back to statement mode.
  try {
    const fnExpr = new AsyncFunction("context", `with (context) { return (${code}); }`);
    return await fnExpr(window);
  } catch {
    const fnStmt = new AsyncFunction("context", `with (context) { ${code}\n }`);
    return await fnStmt(window);
  }
}


