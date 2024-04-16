import TextBox from "@/components/Input/TextBox";

interface FractionComponentProps {
  numerator: string;
  denominator: string;
  whole: string;
  readonly?: boolean;
  enableWhole?: boolean;
  handleIntegerChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleNumberatorChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleDenominatorChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const FractionComponent: React.FC<FractionComponentProps> = ({
  numerator,
  denominator,
  whole = "",
  enableWhole = false,
  handleIntegerChange,
  handleNumberatorChange,
  handleDenominatorChange,
}) => {
  return (
    <>
      <table id="tbl1">
        <tbody>
          <tr>
            {(whole || !enableWhole) && (
              <td rowSpan={2}>
                <TextBox
                  value={whole.toString()}
                  type="number"
                  additionalClass="text-center w-20 mr-1"
                  onChange={handleIntegerChange}
                />
                {enableWhole}
              </td>
            )}
            {
              <td id="td13" className="border-b-2">
                <TextBox
                  value={numerator.toString()}
                  type="number"
                  additionalClass="text-center mb-1 w-30"
                  onChange={handleNumberatorChange}
                />
              </td>
            }
          </tr>
          <tr>
            <td id="td21">
              {
                <TextBox
                  value={denominator.toString()}
                  type="number"
                  additionalClass="text-center mt-1 w-30"
                  onChange={handleDenominatorChange}
                />
              }
            </td>
          </tr>
        </tbody>
      </table>
    </>
  );
};
export default FractionComponent;
