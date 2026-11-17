// Fonte unica: a mesma funcao pura usada pelo PWA e executada no Deno.
// Nao edite formulas aqui; atualize src/analysis/screeners-inteligencia.js.
import "../../../src/analysis/screeners-inteligencia.js";
export const scoreEngine = globalThis.DiarioScreenersInteligencia;
if (!scoreEngine || scoreEngine.version !== "v2.0") throw new Error("Score Engine v2 indisponivel");
