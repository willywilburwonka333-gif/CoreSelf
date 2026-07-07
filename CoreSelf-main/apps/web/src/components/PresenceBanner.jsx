import { presenceLine } from '../services/presenceEngine';

export default function PresenceBanner({ mode }) {
  return (
    <div className="presenceBanner">
      <span>Presence Engine</span>
      <p>{presenceLine(mode)}</p>
    </div>
  );
}
