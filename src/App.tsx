import "./styles.css";
import React, { useEffect, useState } from "react";
import { VictoryArea, VictoryChart, VictoryLegend, VictoryAxis } from "victory";

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

const toVictoryLegend = (line: Line) => {
  let i = {
    name: line.name
  };
  if (line.color) {
    return {
      ...i,
      symbol: {
        fill: line.color
      }
    };
  } else {
    return i;
  }
};

const toVictoryPercentileLegend = (lines: Array<Line>) => {
  const a = lines.map((l) => l.percentile);
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
  hiddenSeries: Set<number>;
};

export default function App() {
  const [state, setState] = useState<State>({ hiddenSeries: new Set() });
  const [series, setSeries] = useState<Array<Line>>([
    {
      sequence: "a",
      percentile: "q50",
      name: "a-q50",
      color: "#c33",
      datapoints: [
        { x: 0, y: 5 },
        { x: 1, y: 8 },
        { x: 2, y: 5 }
      ]
    },
    {
      sequence: "a",
      percentile: "q99",
      name: "a-q99",
      color: "#c33",
      datapoints: [
        { x: 0, y: 6 },
        { x: 1, y: 9 },
        { x: 2, y: 6 }
      ]
    },
    {
      sequence: "b",
      percentile: "q50",
      name: "b-q50",
      color: "#33c",
      datapoints: [
        { x: 0, y: 3 },
        { x: 1, y: 1 },
        { x: 2, y: 3 }
      ]
    },
    {
      sequence: "b",
      percentile: "q99",
      name: "b-q99",
      color: "#33c",
      datapoints: [
        { x: 0, y: 4 },
        { x: 1, y: 2 },
        { x: 2, y: 4 }
      ]
    }
  ]);

  const percentiles = ["q50", "q99"];

  const buildEvents = () => {
    return percentiles.map((percentile, idx) => {
      return {
        childName: ["legend"],
        target: ["data", "labels"],
        eventKey: String(idx),
        eventHandlers: {
          onClick: () => {
            return [
              {
                childName: ["area-" + idx],
                target: "data",
                eventKey: "all",
                mutation: () => {
                  // We have the percentile and we want to show / hide all lines with that percentile
                  state.forEach((line) => {});

                  if (!state.hiddenSeries.delete(idx)) {
                    // Returns true if value was already in Set; otherwise false.
                    // Was not already hidden => add to set
                    state.hiddenSeries.add(idx);
                  }
                  setState({
                    hiddenSeries: new Set(state.hiddenSeries)
                  });
                  return null;
                }
              }
            ];
          },
          onMouseOver: () => {
            return [
              {
                childName: ["area-" + idx],
                target: "data",
                eventKey: "all",
                mutation: (props: any) => {
                  console.log(props.data[0]);
                  return {
                    style: { ...props.style, strokeWidth: 4, fillOpacity: 0.5 }
                  };
                }
              }
            ];
          }
          // onMouseOut: () => {
          //   return [
          //     {
          //       childName: ["area-" + idx],
          //       target: "data",
          //       eventKey: "all",
          //       mutation: () => {
          //         return null;
          //       }
          //     }
          //   ];
          // }
        }
      };
    });
  };

  console.log(buildEvents());

  return (
    <div>
      <VictoryChart height={200} events={buildEvents()}>
        <VictoryAxis />
        {series.map((s, idx) => {
          if (state.hiddenSeries.has(idx)) {
            return undefined;
          }
          return (
            <VictoryArea
              key={"area-" + idx}
              name={"area-" + idx}
              data={toVictoryData(s)}
              style={{
                data: {
                  fill: s.color,
                  fillOpacity: 0.2,
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
          name={"legend"}
          data={toVictoryPercentileLegend(series)}
          height={90}
        />
      </VictoryChart>
    </div>
  );
}
