const AddressesList = () => {
  return (
    <>
      <table className="w-full">
        <thead>
          <tr>
            <th className="text-left">Private Key</th>
            <th className="text-left">Address</th>
            <th>Balance (ETH)</th>
          </tr>
        </thead>
        <tbody>
          {keys.map((key, index) => (
            <tr key={index}>
              <td className="text-left">{key}</td>
              <td className="text-left">{addresses[index]}</td>
              <td
                className={clsx(
                  "text-right",
                  balances[index] === "0" || !balances[index]
                    ? ""
                    : "text-danger",
                  balances[index]
                )}
              >
                {balances[index] ? balances[index] : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
};
export default AddressesList;
