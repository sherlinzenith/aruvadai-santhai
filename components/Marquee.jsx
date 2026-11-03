const items = ["Farmers", "Manufacturers", "Food processors", "Bakeries", "Wholesalers", "Resellers", "Traders & distributors", "Retailers", "Producers"];
export default function Marquee() {
    const row = [...items, ...items];
    return (<div className="marquee" aria-label="Who trades on UlavanSanthai">
      <div className="track">
        {row.map((t, i) => (<span key={i}>{t}<i>•</i></span>))}
      </div>
    </div>);
}
