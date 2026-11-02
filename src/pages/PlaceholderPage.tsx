import { Badge } from '../ui/ds';

export function PlaceholderPage({ title, text, soon = false }: { title: string; text: string; soon?: boolean }) {
  return (
    <section className="placeholder">
      <h1 className="placeholder__title">
        {title}
        {soon && <Badge tone="neutral">Em breve</Badge>}
      </h1>
      <p className="placeholder__text">{text}</p>
    </section>
  );
}
