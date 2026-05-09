const TelemetryTable = ({ data }) => {
  return (
    <div className="table-container">
      <table>
        <thead>
          <tr>
            <th>Distrito</th>
            <th>Subestación</th>
            <th>Consumo (kW)</th>
            <th>Timestamp</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item) => (
            <tr key={item.id}>
              <td>{item.district_id}</td>
              <td>{item.substation_id}</td>
              <td className={item.consumption_kw > 4000 ? "high-load" : ""}>
                {item.consumption_kw}
              </td>
              <td>{new Date(item.timestamp).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TelemetryTable;
