/** Aviso enquanto o ERP confere a sessão (até o tempo máximo de 15 s), em vez de uma tela vazia. */
export function AppLoading() {
  return (
    <section className="app-loading" role="status" aria-live="polite">
      <span className="spinner spinner--light" aria-hidden />
      <p className="app-loading__text">Carregando o ERP</p>
    </section>
  );
}
