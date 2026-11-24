// Seção "Economia" da página Câmeras IA. Ajuste os valores aqui; o
// componente (_components/Calculadora.tsx) só lê este arquivo.

export const ECONOMIA = {
  /** Faixa de preço por unidade de uma câmera com IA embarcada, em reais (site em português). */
  precoMinimo: 6500,
  precoMaximo: 21000,
  /**
   * A mesma faixa em dólares, para o site em inglês e em russo. Convertida com
   * US$ 1 = R$ 5,96 (24/11/2026) e arredondada; atualize junto com os reais.
   */
  precoMinimoUsd: 1100,
  precoMaximoUsd: 3500,
  /** Economia aproximada em relação à troca dos equipamentos, em %. */
  economiaPercentual: 80,
};

/** Moeda e faixa de preço por idioma: reais em português, dólares nos outros. */
export function faixaPreco(idioma: string) {
  return idioma === "pt"
    ? { moeda: "BRL", minimo: ECONOMIA.precoMinimo, maximo: ECONOMIA.precoMaximo }
    : { moeda: "USD", minimo: ECONOMIA.precoMinimoUsd, maximo: ECONOMIA.precoMaximoUsd };
}
