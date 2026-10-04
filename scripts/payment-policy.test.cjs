// Pruebas puras sin arrancar React Native, WordPress ni las pasarelas.
const test = require("node:test");
const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { resolve } = require("node:path");
const ts = require("typescript");
const vm = require("node:vm");
const exportsObject = {};
const code = ts.transpileModule(
  readFileSync(
    resolve(__dirname, "../core/checkout/payment-policy.ts"),
    "utf8",
  ),
  {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2021,
    },
  },
).outputText;
vm.runInNewContext(code, { exports: exportsObject });
const { browserReturned, isPaidOrder, isPayableOrder, isWaitingOrder } =
  exportsObject;

test("retorno/cierre de navegador no equivale a pago; cancelación conserva el carrito", () => {
  assert.equal(browserReturned("success"), true);
  assert.equal(browserReturned("dismiss"), true);
  assert.equal(browserReturned("cancel"), false);
  assert.equal(isPaidOrder("on-hold"), false);
  assert.equal(isWaitingOrder("on-hold"), true);
  assert.equal(isPayableOrder("on-hold"), false);
});

test("solo pedidos confirmados habilitan entradas", () => {
  for (const status of ["processing", "completed"]) {
    assert.equal(isPaidOrder(status), true);
    assert.equal(isPayableOrder(status), false);
  }
  for (const status of ["cancelled", "refunded", undefined]) {
    assert.equal(isPaidOrder(status), false);
    assert.equal(isPayableOrder(status), false);
  }
  assert.equal(isPayableOrder("pending"), true);
  assert.equal(isPayableOrder("failed"), true);
});
