// Indicador de "arraste para o lado", acima dos cartões de todo carrossel.
// A bolinha desliza e volta a cada ~2,6 s (CSS em site-theme.css: .dica-arraste);
// some quando a pessoa mexe no carrossel. Com movimento reduzido, fica parada.
export default function DragHint({ oculto }: { oculto: boolean }) {
  return (
    <div aria-hidden className={`dica-arraste inline-flex h-8 items-center gap-2.5 rounded-full border border-white/15 bg-white/[0.06] pl-2 pr-3.5 text-xs text-white/70 backdrop-blur transition-opacity duration-500 ${oculto ? "opacity-0" : "opacity-100"}`}>
      <span className="relative h-4 w-9">
        <span className="dica-arraste-bolinha absolute left-0 top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-white/85" />
      </span>
      Arraste para o lado
    </div>
  );
}
