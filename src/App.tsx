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
  symbol?: string;
  strokeDasharray?: string;
  datapoints: DataPoint[];
};

const toVictoryData = (line: Line) => {
  return line.datapoints.map((dp) => ({
    name: line.name,
    symbol: line.symbol,
    x: dp.x,
    y: dp.y
  }));
};

const percentiles: Array<string> = ["q99", "q50"];
const sequences: Array<string> = ["seq-a", "seq-b"];

const toVictoryLegend = (
  hiddenLegendKeys: Set<string>,
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
        // type: hiddenLegendKeys.has(p) ? "square" : "circle",
        fillOpacity: hiddenLegendKeys.has(p) ? 0.5 : 1.0
      }
    };
  });
};

type HiddenItems = {
  // The series to hide because they have been toggled off.
  sequences: Set<string>;
  // The percentiles to hide because they have been toggled off.
  percentiles: Set<string>;

  // The keys in the legend to hide because they have been toggled off.
  // Note that while series and percentiles are data on the chart, this is
  // referring to the legend item, and is how we control the opacity of
  // differenr elements in the legend.
  legendKeys: Set<string>;
};

export default function App() {
  const [hiddenItems, setHiddenItems] = useState<HiddenItems>({
    sequences: new Set(),
    percentiles: new Set(),
    legendKeys: new Set()
  });
  const [series, setSeries] = useState<Array<Line>>([
    {
      sequence: "seq-a",
      percentile: "q50",
      name: "seq-a-q50",
      color: "pink",
      symbol: "square",
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
      color: "pink",
      symbol: "circle",
      strokeDasharray: "2,2",
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
      symbol: "square",
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
      color: "teal",
      symbol: "circle",
      strokeDasharray: "2,1",
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
                  // Change the opacity of the selected legend key.
                  const hiddenLegendKeysLocal = hiddenItems.legendKeys;
                  if (!hiddenLegendKeysLocal.delete(key)) {
                    hiddenLegendKeysLocal.add(key);
                  }

                  // Hide either the sequence or the percentile in the plot.
                  let hiddenSeriesLocal =
                    keyName === "sequence"
                      ? hiddenItems.sequences
                      : hiddenItems.percentiles;
                  series.forEach((line) => {
                    if (line[keyName] === key) {
                      if (!hiddenSeriesLocal.delete(line.name)) {
                        // Returns true if value was already in Set; otherwise false.
                        // Was not already hidden => add to set
                        hiddenSeriesLocal.add(line.name);
                      }
                    }
                  });

                  // Change all state at once now that we have modified state data locally.
                  setHiddenItems({
                    percentiles:
                      keyName !== "sequence"
                        ? new Set(hiddenSeriesLocal)
                        : hiddenItems.percentiles,
                    sequences:
                      keyName === "sequence"
                        ? new Set(hiddenSeriesLocal)
                        : hiddenItems.sequences,
                    legendKeys: new Set(hiddenLegendKeysLocal)
                  });

                  // NOTE: It is possible to instead modify the legend key opacity here, but doing so
                  // was not working because by modihing React state we force a re-render which
                  // wipes out the opacity change. Instead we control the opacity with React state as well.
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
            hiddenItems.percentiles.has(s.name) ||
            hiddenItems.sequences.has(s.name)
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
                    strokeWidth: 2,
                    strokeDasharray: s.strokeDasharray
                  }
                }}
              />
              <VictoryScatter
                labels={({ datum }) => datum.y}
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
          data={toVictoryLegend(hiddenItems.legendKeys, series, "percentile", [
            "black",
            "grey"
          ])}
          height={90}
          y={50}
          events={buildEvents("legend-percentiles", percentiles, "percentile")}
        />
        <VictoryLegend
          name={"legend-sequences"}
          data={toVictoryLegend(hiddenItems.legendKeys, series, "sequence", [
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
