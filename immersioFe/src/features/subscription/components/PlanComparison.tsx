import { comparisonData } from "../plans";

export function PlanComparison() {
  return (
    <section
      className="subscription-comparison"
      aria-labelledby="plan-comparison-title"
    >
      <div className="workspace-section-heading">
        <h2 id="plan-comparison-title">The details, side by side.</h2>
      </div>
      <div
        className="learning-paper subscription-table-wrap"
        tabIndex={0}
        role="region"
        aria-label="Plan comparison; scroll horizontally for all plans"
      >
        <table>
          <caption className="sr-only">
            Features included in each Immersio plan
          </caption>
          <thead>
            <tr>
              <th scope="col">What’s included</th>
              <th scope="col">Basic</th>
              <th scope="col">Plus</th>
              <th scope="col">Premium</th>
            </tr>
          </thead>
          <tbody>
            {comparisonData.map((row) => (
              <tr key={row.category}>
                <th scope="row">{row.category}</th>
                <td>{row.basic}</td>
                <td>{row.plus}</td>
                <td>{row.premium}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="subscription-scroll-hint">
        On a small screen, scroll the table to see every plan.
      </p>
    </section>
  );
}
