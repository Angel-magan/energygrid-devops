const TelemetryTable = ({ data }) => {
  return (
    <div className="w-full overflow-x-auto rounded-xl">
      <table className="w-full border-separate border-spacing-y-2.5 text-left min-w-[600px]">
        <thead>
          <tr className="text-xs font-bold uppercase tracking-widest text-grid-dim select-none">
            <th className="px-5 pb-1">Distrito</th>
            <th className="px-5 pb-1">Subestación</th>
            <th className="px-5 pb-1">Consumo (kW)</th>
            <th className="px-5 pb-1">Timestamp</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item) => {
            const isHighLoad = item.consumption_kw > 4000;

            return (
              <tr
                key={item.id}
                className="group bg-grid-deep/40 hover:bg-grid-blue/10 border border-grid-border transition-colors duration-200"
              >
                <td className="p-4 text-sm font-semibold text-grid-text rounded-l-xl border-y border-l border-grid-border/40 group-hover:border-grid-blue/30">
                  {item.district_id}
                </td>
                <td className="p-4 text-sm text-grid-dim font-medium border-y border-grid-border/40 group-hover:border-grid-blue/30">
                  {item.substation_id}
                </td>
                <td className="p-4 text-sm border-y border-grid-border/40 group-hover:border-grid-blue/30">
                  <span
                    className={`inline-flex items-center font-mono-tech font-bold text-sm px-2.5 py-1 rounded-md
                    ${
                      isHighLoad
                        ? "text-grid-danger bg-grid-danger/10 border border-grid-danger/20 animate-pulse"
                        : "text-grid-cyan bg-grid-blue/10 border border-grid-blue/20"
                    }`}
                  >
                    {item.consumption_kw.toLocaleString()} kW
                  </span>
                </td>
                <td className="p-4 text-xs text-grid-dim font-mono-tech rounded-r-xl border-y border-r border-grid-border/40 group-hover:border-grid-blue/30">
                  {new Date(item.timestamp).toLocaleString()}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default TelemetryTable;
