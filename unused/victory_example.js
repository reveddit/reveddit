import React from "react";
import { render } from "react-dom";
import { VictoryChart, VictoryLine, VictoryVoronoiContainer } from "victory";

class Cursor extends React.Component {
  render() {
    const { x, scale } = this.props;
    const range = scale.y.range();
    return (
      <line
        style={{
          stroke: "black",
          strokeWidth: 1
        }}
        x1={x}
        x2={x}
        y1={Math.max(...range)}
        y2={Math.min(...range)}
      />
    );
  }
}

class App extends React.Component {
  constructor(props) {
    super(props);
    this.onActivated = this.updatePoint.bind(this);
    this.onClick = this.updateClicked.bind(this);
    this.state = {
      point: {},
      savedPoint: {}
    };
  }

  updatePoint(points) {
    this.setState({ point: points[0] });
  }

  updateClicked() {
    this.setState({
      savedPoint: this.state.point
    });
  }

  render() {
    return (
      <div>
        <VictoryChart
          domainPadding={{ y: 10 }}
          containerComponent={
            <VictoryVoronoiContainer
              dimension="x"
              labels={true}
              labelComponent={<Cursor />}
              onActivated={this.onActivated}
            />
          }
          events={[
            {
              target: "parent",
              eventHandlers: {
                onClick: this.onClick
              }
            }
          ]}
        >
          <VictoryLine
            data={[
              { x: 1, y: -3 },
              { x: 2, y: 5 },
              { x: 3, y: 3 },
              { x: 4, y: 1 },
              { x: 5, y: -2 },
              { x: 6, y: -2 },
              { x: 7, y: 5 }
            ]}
          />
        </VictoryChart>
        <h1>{`Hover: (${this.state.point.x || "-"}, ${this.state.point.y ||
          "-"})`}</h1>
        <h1>{`Clicked: (${this.state.savedPoint.x || "-"}, ${this.state
          .savedPoint.y || "-"})`}</h1>
      </div>
    );
  }
}

render(<App />, document.getElementById("root"));

