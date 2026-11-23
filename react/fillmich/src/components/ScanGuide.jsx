import eanImage from '../assets/kodlek-ean.svg'
import matrixImage from '../assets/kodlek-ui.svg'

export default function ScanGuide({ type }) {
  const ean = type === 'ean'
  return <figure className="scan-guide">
    <img src={ean ? eanImage : matrixImage} alt={ean ? 'Przykładowe opakowania z podłużnym kodem kreskowym.' : 'Przykładowe opakowania z kwadratowym kodem Data Matrix.'} />
    <figcaption><strong>{ean ? 'Tak wygląda kod EAN' : 'Tak wygląda Data Matrix'}</strong><span>{ean ? 'Szukaj podłużnego kodu kreskowego z cyframi.' : 'Szukaj małego, kwadratowego kodu na opakowaniu.'}</span><small>Ilustracja poglądowa. Zeskanuj kod ze swojego opakowania.</small></figcaption>
  </figure>
}
