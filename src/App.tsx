import "./styles.css";
import React, { useState } from "react";
import {
  VictoryLine,
  VictoryScatter,
  VictoryChart,
  VictoryGroup,
  VictoryLegend,
  createContainer,
  VictoryAxis
} from "victory";

import {
  List,
  ListItemIcon,
  ListItemText,
  Checkbox,
  ListItem
} from "@material-ui/core";

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

const percentiles: Array<string> = ["q99", "q50"];
const sequences: Array<string> = ["seq-a", "seq-b"];

const toVictoryLegend = (
  hiddenKeys: Set<string>,
  lines: Array<Line>,
  key: string,
  colors: Array<string>
) => {
  const vals = key === "percentile" ? percentiles : sequences;
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
                target: "data",
                mutation: (props: any) => {
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
                  if (!hiddenKeysLocal.delete(key)) {
                    // Was not already hidden => add to set
                    hiddenKeysLocal.add(key);
                    setHiddenKeys(hiddenKeysLocal);
                  }
                  return null;
                }
              }
            ];
          }
        }
      };
    });
  };

  const VictoryZoomVoronoiContainer = createContainer("zoom", "voronoi");

  const [selectedMetrics, setSelectedMetrics] = useState<string[]>([]);
  const toggleMetric = (metric: string) => {
    if (selectedMetrics.includes(metric)) {
      setSelectedMetrics(selectedMetrics.filter((m) => m !== metric));
    } else {
      setSelectedMetrics([...selectedMetrics, metric]);
    }
  };

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
      >
        <VictoryAxis />
        <VictoryAxis dependentAxis />
        {series.map((s, idx) => {
          if (
            hiddenPercentile.hiddenSeries.has(s.name) ||
            hiddenSequence.hiddenSeries.has(s.name)
          ) {
            return undefined;
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
          height={90}
          y={50}
          events={buildEvents("legend-percentiles", percentiles, "percentile")}
        />
        <VictoryLegend
          name={"legend-sequences"}
          data={toVictoryLegend(hiddenKeys, series, "sequence", [
            "red",
            "green"
          ])}
          height={90}
          y={150}
          events={buildEvents("legend-sequences", sequences, "sequence")}
        />
      </VictoryChart>

      <List component="nav">
        {[0, 1, 2, 3].map((val) => {
          return (
            <ListItem key={val}>
              <ListItemText id={String(val)} primary={`Line item ${val}`} />
              <Checkbox
                value={val}
                defaultChecked
                checked={selectedMetrics.includes(String(val))}
                onClick={() => toggleMetric(String(val))}
              />
            </ListItem>
          );
        })}
      </List>
    </div>
  );
}
