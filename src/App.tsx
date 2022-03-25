import "./styles.css";
import React, { useEffect, useState } from "react";
import {
  VictoryLine,
  VictoryScatter,
  VictoryZoomContainer,
  VictoryChart,
  VictoryGroup,
  VictoryLegend,
  VictoryVoronoiContainer,
  createContainer,
  VictoryAxis
} from "victory";

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

// const colors = ["brown", "black", "grey"];

const percentiles: Array<string> = ["q99", "q50"];
const sequences: Array<string> = ["seq-a", "seq-b"];

const toVictoryLegend = (
  hiddenKeys: Set<string>,
  lines: Array<Line>,
  key: string,
  colors: Array<string>
) => {
  const vals = key === "percentile" ? percentiles : sequences;
  console.log(vals);
  // const a = lines.map((l) => l[key]);
  // const b = a.filter((item, index) => {
  //   return a.indexOf(item) === index;
  // });
  // return b.map((p) => {
  let i = 0;
  return vals.map((p) => {
    i++;
    return {
      name: p,
      symbol: {
        fill: colors[i % 2],
        // type: hiddenKeys.has(p) ? "square" : "circle",
        fillOpacity: hiddenKeys.has(p) ? 0.5 : 1.0
      }
    };
  });
};

type State = {
  hiddenSeries: Set<string>;
};

export default function App() {
  const [hiddenPercentile, setHiddenPercentile] = useState<State>({
    hiddenSeries: new Set()
  });
  const [hiddenSequence, setHiddenSequence] = useState<State>({
    hiddenSeries: new Set()
  });
  const [hiddenKeys, setHiddenKeys] = useState<Set<string>>(new Set());
  const [series, setSeries] = useState<Array<Line>>([
    {
      sequence: "seq-a",
      percentile: "q50",
      name: "seq-a-q50",
      color: "pink",
      datapoints: [
        { x: 0, y: 5 },
        { x: 1, y: 8 },
        { x: 2, y: 5 }
      ]
    },
    {
      sequence: "seq-a",
      percentile: "q99",
      name: "seq-a-q99",
      color: "red",
      datapoints: [
        { x: 0, y: 6 },
        { x: 1, y: 9 },
        { x: 2, y: 6 }
      ]
    },
    {
      sequence: "seq-b",
      percentile: "q50",
      name: "seq-b-q50",
      color: "teal",
      datapoints: [
        { x: 0, y: 1 },
        { x: 1, y: 4 },
        { x: 2, y: 1 }
      ]
    },
    {
      sequence: "seq-b",
      percentile: "q99",
      name: "seq-b-q99",
      color: "blue",
      datapoints: [
        { x: 0, y: 2 },
        { x: 1, y: 5 },
        { x: 2, y: 2 }
      ]
    }
  ]);

  const buildAllEvents = () => {
    const e = buildEvents(
      "legend-percentiles",
      percentiles,
      "percentile",
      0
    ).concat(buildEvents("legend-sequences", sequences, "sequence", 0));
    console.log(e);
    return e;
  };

  const buildEvents = (
    legend: string,
    keyList: Array<string>,
    keyName: string,
    startingIndex: number
  ) => {
    return keyList.map((key, idx) => {
      return {
        childName: [legend],
        target: ["data", "labels"],
        eventKey: String(startingIndex + idx),
        eventHandlers: {
          onClick: () => {
            return [
              {
                // childName: [legend], // we don't mutate any elements directly with this, instead we modify hiddenSeries |  ["area-" + idx],
                target: "data",
                // eventKey: String(startingIndex + idx), // "all",
                mutation: (props: any) => {
                  console.log(keyName, key, startingIndex + idx);
                  let hiddenSeriesLocal =
                    keyName === "sequence"
                      ? hiddenSequence.hiddenSeries
                      : hiddenPercentile.hiddenSeries;

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
                  if (keyName === "sequence") {
                    setHiddenSequence({
                      hiddenSeries: new Set(hiddenSeriesLocal)
                    });
                  } else {
                    setHiddenPercentile({
                      hiddenSeries: new Set(hiddenSeriesLocal)
                    });
                  }
                  const hiddenKeysLocal = hiddenKeys;
                  let hideKey = false;
                  if (!hiddenKeysLocal.delete(key)) {
                    // Was not already hidden => add to set
                    hiddenKeysLocal.add(key);
                    setHiddenKeys(hiddenKeysLocal);
                    hideKey = true;
                  }
                  const s = {
                    style: {
                      ...props.style,
                      // fill:
                      //   props.style &&
                      //   (!props.style.fill || props.style.fill === "#525252")
                      //     ? "blue"
                      //     : "#525252",
                      fillOpacity: hideKey ? 0.5 : 1.0
                      // fillOpacity:
                      //   props.style &&
                      //   (!props.style.fillOpacity ||
                      //     props.style.fillOpacity === 1.0)
                      //     ? 0.5
                      //     : 1.0
                    }
                  };
                  return s;
                }
              }
            ];
          }
          // onMouseOver: () => {
          //   return [
          //     {
          //       // childName: legend, // we don't mutate any elements directly with this, instead we modify hiddenSeries |  ["area-" + idx],
          //       target: "data",
          //       // eventKey: String(startingIndex + idx), // "all",
          //       mutation: (props: any) => {
          //         console.log("mouseOver", props);
          //         const s = {
          //           style: {
          //             ...props.style,
          //             // fill:
          //             //   props.style &&
          //             //   (!props.style.fill || props.style.fill === "#525252")
          //             //     ? "blue"
          //             //     : "#525252",
          //             fillOpacity:
          //               props.style &&
          //               (!props.style.fillOpacity ||
          //                 props.style.fillOpacity === 1.0)
          //                 ? 0.5
          //                 : 1.0
          //           }
          //         };
          //         return s;
          //         // return {
          //         //   size: 10,
          //         //   style: {
          //         //     ...props.style
          //         //   }
          //         // };
          //       }
          //     }
          //   ];
          // },
          // onMouseOut: () => {
          //   return [
          //     {
          //       // childName: legend, // we don't mutate any elements directly with this, instead we modify hiddenSeries |  ["area-" + idx],
          //       target: "data",
          //       // eventKey: String(startingIndex + idx), // "all",
          //       mutation: (props: any) => {
          //         return {
          //           size: 5,
          //           style: {
          //             ...props.style
          //           }
          //         };
          //       }
          //     }
          //   ];
          // }
        }
      };
    });
  };

  const VictoryZoomVoronoiContainer = createContainer("zoom", "voronoi");

  return (
    <div>
      <VictoryChart
        width={700}
        // height={400}
        domain={{ x: [0, 2], y: [0, 9] }}
        padding={{ left: 100, top: 50, right: 50, bottom: 50 }}
        domainPadding={{ x: [10, 10], y: [10, 10] }}
        containerComponent={
          <VictoryZoomVoronoiContainer
            labels={({ datum }) => `${datum.name} (${datum.x}, ${datum.y})`}
            voronoiBlacklist={["line"]}
          />
        }
        // events={buildAllEvents()}
      >
        <VictoryAxis />
        <VictoryAxis dependentAxis />
        {series.map((s, idx) => {
          if (
            hiddenPercentile.hiddenSeries.has(s.name) ||
            hiddenSequence.hiddenSeries.has(s.name)
          ) {
            return (
              <VictoryGroup
                key={"group-" + idx}
                name={"group-" + idx}
                data={toVictoryData(s)}
                maxDomain={{ y: 10 }}
              ></VictoryGroup>
            );
          }
          return (
            <VictoryGroup
              key={"group-" + idx}
              name={"group-" + idx}
              data={toVictoryData(s)}
              maxDomain={{ y: 10 }}
            >
              <VictoryLine
                name="line"
                style={{
                  data: {
                    stroke: s.color,
                    strokeWidth: 2
                  }
                }}
              />
              <VictoryScatter
                style={{
                  data: {
                    stroke: s.color,
                    strokeWidth: 2
                  }
                }}
              />
            </VictoryGroup>
          );
        })}
        <VictoryLegend
          name={"legend-percentiles"}
          data={toVictoryLegend(hiddenKeys, series, "percentile", [
            "navy",
            "blue"
          ])}
          // colorScale={[ "navy", "blue", "cyan" ]}
          height={90}
          y={50}
          events={buildEvents(
            "legend-percentiles",
            percentiles,
            "percentile",
            0
          )}
        />
        <VictoryLegend
          name={"legend-sequences"}
          data={toVictoryLegend(hiddenKeys, series, "sequence", [
            "red",
            "green"
          ])}
          height={90}
          y={150}
          events={buildEvents("legend-sequences", sequences, "sequence", 0)}
        />
      </VictoryChart>
    </div>
  );
}
