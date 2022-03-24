import "./styles.css";
import React, { useEffect, useState } from "react";
import { VictoryLine, VictoryChart, VictoryLegend, VictoryAxis } from "victory";

type DataPoint = {
  x: number | Date;
  y: number;
};

type Line = {
  name: string;
  sequence: string;
  percentile: string;
  color?: string;
  datapoints: DataPoint[];
};

const toVictoryData = (line: Line) => {
  return line.datapoints.map((dp) => ({
    name: line.name,
    x: dp.x,
    y: dp.y
  }));
};

// const toVictoryLegend = (line: Line) => {
//   let i = {
//     name: line.name
//   };
//   if (line.color) {
//     return {
//       ...i,
//       symbol: {
//         fill: line.color
//       }
//     };
//   } else {
//     return i;
//   }
// };

const toVictoryLegend = (lines: Array<Line>, key: string) => {
  const a = lines.map((l) => l[key]);
  const b = a.filter((item, index) => {
    return a.indexOf(item) === index;
  });
  return b.map((p) => {
    return {
      name: p
    };
  });
};

type State = {
  hiddenSeries: Set<string>;
};

export default function App() {
  const [state, setState] = useState<State>({ hiddenSeries: new Set() });
  const [series, setSeries] = useState<Array<Line>>([
    {
      sequence: "sequence-a",
      percentile: "q50",
      name: "sequence-a-q50",
      color: "pink",
      datapoints: [
        { x: 0, y: 5 },
        { x: 1, y: 8 },
        { x: 2, y: 5 }
      ]
    },
    {
      sequence: "sequence-a",
      percentile: "q99",
      name: "sequence-a-q99",
      color: "red",
      datapoints: [
        { x: 0, y: 6 },
        { x: 1, y: 9 },
        { x: 2, y: 6 }
      ]
    },
    {
      sequence: "sequence-b",
      percentile: "q50",
      name: "sequence-b-q50",
      color: "teal",
      datapoints: [
        { x: 0, y: 1 },
        { x: 1, y: 4 },
        { x: 2, y: 1 }
      ]
    },
    {
      sequence: "sequence-b",
      percentile: "q99",
      name: "sequence-b-q99",
      color: "blue",
      datapoints: [
        { x: 0, y: 2 },
        { x: 1, y: 5 },
        { x: 2, y: 2 }
      ]
    }
  ]);

  const percentiles: Array<string> = ["q50", "q99"];
  const sequences: Array<string> = ["sequence-a", "sequence-b"];

  const buildEvents = (
    legend: string,
    keyList: Array<string>,
    keyName: string
  ) => {
    return keyList.map((key, idx) => {
      return {
        childName: [legend],
        target: ["data", "labels"],
        eventKey: String(idx),
        eventHandlers: {
          onClick: () => {
            return [
              {
                childName: "legend", // we don't mutate any elements directly with this, instead we modify hiddenSeries |  ["area-" + idx],
                target: "data",
                eventKey: String(idx), // "all",
                mutation: (props: any) => {
                  let hiddenSeriesLocal = state.hiddenSeries;

                  // We have the percentile and we want to show / hide all lines with that percentile
                  series.forEach((line) => {
                    if (line[keyName] === key) {
                      if (!hiddenSeriesLocal.delete(line.name)) {
                        // Returns true if value was already in Set; otherwise false.
                        // Was not already hidden => add to set
                        hiddenSeriesLocal.add(line.name);
                      }
                    }
                  });
                  setState({
                    hiddenSeries: new Set(hiddenSeriesLocal)
                  });
                  return {
                    style: {
                      ...props.style,
                      fillOpacity:
                        props.style &&
                        (!props.style.fillOpacity ||
                          props.style.fillOpacity === 1.0)
                          ? 0.5
                          : 1.0
                    }
                  };
                }
              }
            ];
          }
        }
      };
    });
  };
  //           buildEvents("legend-sequences", sequences, "sequence")
  return (
    <div>
      <VictoryChart
        width={700}
        // height={400}
        domain={{ x: [0.5, 2], y: [0, 9] }}
        padding={{ left: 100, top: 50, right: 50, bottom: 50 }}
        domainPadding={{ x: [10, 10], y: [10, 10] }}
        events={buildEvents("legend-percentiles", percentiles, "percentile")}
      >
        <VictoryAxis />
        <VictoryAxis dependentAxis />
        {series.map((s, idx) => {
          if (state.hiddenSeries.has(s.name)) {
            return undefined;
          }
          return (
            <VictoryLine
              key={"area-" + idx}
              name={"area-" + idx}
              data={toVictoryData(s)}
              maxDomain={{ y: 10 }}
              // domainPadding={{ y: [0, 20] }}
              style={{
                data: {
                  stroke: s.color,
                  strokeWidth: 2
                }
              }}
            />
          );
        })}
        {/* <VictoryLegend
          name={"legend"}
          data={series.map((s, idx) => {
            const item = toVictoryLegend(s);
            if (state.hiddenSeries.has(idx)) {
              return { ...item, symbol: { fill: "#999" } };
            }
            return item;
          })}
          height={90}
        /> */}
        <VictoryLegend
          name={"legend-percentiles"}
          data={toVictoryLegend(series, "percentile")}
          height={90}
          y={50}
        />
        {/* <VictoryLegend
          name={"legend-sequences"}
          data={toVictoryLegend(series, "sequence")}
          height={90}
          y={100}
        /> */}
      </VictoryChart>
    </div>
  );
}
