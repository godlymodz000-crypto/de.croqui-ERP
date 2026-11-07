import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router';
import { Icon } from '../../ui/ds';
import { presentationsApi, type PresentationWithData } from '../../api/presentations';

/**
 * Tela provisória de /apresentacoes/:id, só até a etapa E7, quando o editor (6b-04) toma o lugar dela.
 * Mostra o nome e o número para confirmar que a apresentação foi criada.
 */
export function PresentationPendingPage() {
  const { id = '' } = useParams();
  const [p, setP] = useState<PresentationWithData | null>(null);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    presentationsApi.get(id).then(setP, () => setMissing(true));
  }, [id]);

  return (
    <section className="placeholder">
      <Link to="/apresentacoes" className="back-link">
        <Icon name="arrow-left" size={18} />
        Voltar para Apresentações
      </Link>
      <h1 className="placeholder__title">{p ? p.name : 'Apresentação'}</h1>
      <p className="placeholder__text">
        {missing
          ? 'Não foi possível abrir esta apresentação. Ela pode ter sido excluída junto com o projeto.'
          : p
            ? `Nº ${p.number}. O editor da apresentação chega na próxima etapa.`
            : ''}
      </p>
    </section>
  );
}
