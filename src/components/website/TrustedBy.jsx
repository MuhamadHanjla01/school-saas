import './TrustedBy.css';

const INSTITUTIONS = [
  { icon: 'school', name: "St. Mary's Academy" },
  { icon: 'account_balance', name: 'Global Tech University' },
  { icon: 'menu_book', name: 'Heritage International' },
  { icon: 'history_edu', name: 'Oxford Prep School' },
  { icon: 'architecture', name: 'Design Institute' },
  { icon: 'science', name: 'Bio-Science College' },
];

function InstitutionRow() {
  return (
    <>
      {INSTITUTIONS.map((inst, i) => (
        <div className="trusted__item" key={i}>
          <span className="material-symbols-outlined trusted__icon">{inst.icon}</span>
          <span className="trusted__name">{inst.name}</span>
        </div>
      ))}
    </>
  );
}

export default function TrustedBy() {
  return (
    <section className="trusted" id="trusted-by">
      <div className="container trusted__heading">
        <p className="trusted__label text-label-sm">TRUSTED BY LEADING INSTITUTIONS</p>
      </div>
      <div className="trusted__marquee">
        <div className="trusted__track animate-scroll">
          <InstitutionRow />
        </div>
        <div className="trusted__track animate-scroll" aria-hidden="true">
          <InstitutionRow />
        </div>
      </div>
    </section>
  );
}
