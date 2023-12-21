import { Aspect, Dimensions } from "@/app/image/type";
import { useState } from "react";

interface AspectRatioProps {
  dimensions?: Dimensions;
  handleChangeAspect: (a: number | string) => void;
  selectedAspect: number | string;
}

const AspectRatio: React.FC<AspectRatioProps> = ({
  dimensions,
  handleChangeAspect,
  selectedAspect,
}) => {
  const ASPECT_RATIOS: Aspect[] = [
    { name: "Free Form", value: 0 },
    { name: "Square", value: 1 },
    { name: "Landscape 16:9", value: 16 / 9 },
    { name: "Landscape 4:3", value: 4 / 3 },
    { name: "Portrait 9:16", value: 9 / 16 },
    { name: "Portrait 3:4", value: 3 / 4 },
    { name: "Custom", value: "custom" },
  ];
  if (dimensions?.height) {
    ASPECT_RATIOS.unshift({
      name: "Original",
      value: "original",
    });
  }
  return (
    <>
      <div className="mb-2">
        <label htmlFor="aspect-ratio" className="text-[14px]">
          Aspect Ratio
        </label>
      </div>
      <div>
        <select
          name="aspect-ratio"
          id="aspect-ratio"
          className="w-full p-2 rounded-lg border border-bodydark bg-white outline-bodydark dark:outline-boxdark text-[14px]"
          onChange={(e) => handleChangeAspect(e.target.value)}
          value={selectedAspect}
        >
          {ASPECT_RATIOS.map((r) => (
            <option key={r.value} value={r.value}>
              {r.name}
            </option>
          ))}
        </select>
      </div>
    </>
  );
};
export default AspectRatio;
