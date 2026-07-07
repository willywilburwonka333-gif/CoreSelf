export default function PotentialAvatar({ mode = 'Talk' }) {
  return (
    <div className={`avatar avatar-${mode.toLowerCase()}`}>
      <div className="halo" />
      <div className="auraShard shardOne" />
      <div className="auraShard shardTwo" />
      <div className="head">
        <div className="eyes" />
      </div>
      <div className="body">
        <div className="coreGem" />
      </div>
      <div className="ring" />
      <div className="pulse" />
      <strong>Potential Dylan</strong>
      <small>{mode} Form</small>
    </div>
  );
}
