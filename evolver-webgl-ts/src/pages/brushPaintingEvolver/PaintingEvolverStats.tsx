import * as React from "react";
import { Config } from "../../engine/brushConfig";
import { ConfigItem } from "../../components/ConfigItem";
import { MutationTypeAppend, MutationTypePosition, MutationTypeColor, MutationTypeRotation, MutationTypeDelete } from "../../engine/brushMutator";

export interface PaintingEvolverStatsProps {
    fps: number;
    similarityText: string;
    triangleCount: number;
    stats: { [key: string]: number };
    progressSpeed: number;
    config: Config;
}

export interface PaintingEvolverStatsState {
    config: Config;
}

export class PaintingEvolverStats extends React.Component<PaintingEvolverStatsProps, PaintingEvolverStatsState> {

    constructor(props: PaintingEvolverStatsProps) {
        super(props);
        this.state = {
            config: props.config,
        };
    }

    onUpdateFocusExponentBase(newBase: number) {
        if (newBase < 0) {
            newBase = 0;
        }
        if (newBase > 10) {
            newBase = 10;
        }
        this.state.config.focusExponent = newBase;
        this.setState({
            config: this.state.config,
        });
    }

    onUpdateFrameSkip(newFrameSkip: number) {
        if (newFrameSkip < 1) {
            newFrameSkip = 1;
        }
        if (newFrameSkip > 100) {
            newFrameSkip = 100;
        }
        this.state.config.frameSkip = newFrameSkip;
        this.setState({
            config: this.state.config,
        });
    }

    onUpdateMinColorMutation(newRate: number) {
        if (newRate < 0) {
            newRate = 0;
        }
        if (newRate >= this.state.config.maxColorMutation) {
            return;
        }
        this.state.config.minColorMutation = newRate;
        this.setState({
            config: this.state.config,
        });
    }

    onUpdateMaxColorMutation(newRate: number) {
        if (newRate >= 1 || newRate <= this.state.config.minColorMutation) {
            return;
        }
        this.state.config.maxColorMutation = newRate;
        this.setState({
            config: this.state.config,
        });
    }

    onUpdateSaveSnapshots(newValue: boolean) {
        this.state.config.saveSnapshots = newValue;
        this.setState({
            config: this.state.config,
        });
    }

    onUpdateMaxSnapshots(newValue: number) {
        if (newValue <= 0) {
            return;
        }
        if (newValue > 1800) {
            return;
        }
        this.state.config.maxSnapshots = newValue;
        this.setState({
            config: this.state.config,
        });
    }

    onUpdateEnabledMutations(mutationType: string) {
        this.state.config.enabledMutations[mutationType] = !this.state.config.enabledMutations[mutationType];
        // Make sure at least one mutation type is enabled
        let count = 0;
        for (let mutationType of [MutationTypeAppend, MutationTypeColor, MutationTypePosition, MutationTypeRotation]) {
            if (this.state.config.enabledMutations[mutationType]) {
                count++;
            }
        }
        if (count == 0) {
            this.state.config.enabledMutations[mutationType] = true;
        }
        this.setState({
            config: this.state.config,
        });
    }

    renderControls() {
        return (<div id="stats">
            <ConfigItem
                label="Focus Exponent"
                onUpdate={this.onUpdateFocusExponentBase.bind(this)}
                value={this.state.config.focusExponent} />
            <ConfigItem
                label="Frame Skip"
                onUpdate={this.onUpdateFrameSkip.bind(this)}
                value={this.state.config.frameSkip} />
            <ConfigItem
                label="Min Color Mutation"
                onUpdate={this.onUpdateMinColorMutation.bind(this)}
                value={this.state.config.minColorMutation}
                increment={0.001}
                skipIncrement={0.01}
                displayDecimals={3} />
            <ConfigItem
                label="Max Color Mutation"
                onUpdate={this.onUpdateMaxColorMutation.bind(this)}
                value={this.state.config.maxColorMutation}
                increment={0.001}
                skipIncrement={0.01}
                displayDecimals={3} />
            {/* We can bring back snapshots when we are able to save things on a server. */}
            {/* <ConfigCheckbox
                label="Enable Snapshots"
                value={this.state.config.saveSnapshots}
                onUpdate={this.onUpdateSaveSnapshots.bind(this)} />
            <ConfigItem
                label="Max Snapshots"
                value={this.state.config.maxSnapshots}
                increment={10}
                skipIncrement={100}
                onUpdate={this.onUpdateMaxSnapshots.bind(this)} /> */}
        </div>);
    }

    renderStats() {
        // const stats = [
        //     `Append Random Triangle: ${this.evolver.mutatorstats[MutationTypeAppend]}`,
        //     `Adjust Triangle Position: ${this.evolver.mutatorstats[MutationTypePosition]}`,
        //     `Adjust Triangle Color: ${this.evolver.mutatorstats[MutationTypeColor]}`,
        //     `Adjust Triangle Shape: ${this.evolver.mutatorstats[MutationTypePoints]}`,
        //     `Delete Triangle: ${this.evolver.mutatorstats[MutationTypeDelete]}`,
        // ];
        return (<div id="stats">
            <div>
                <input type="checkbox"
                    onChange={() => this.onUpdateEnabledMutations(MutationTypeAppend)}
                    checked={this.state.config.enabledMutations[MutationTypeAppend]} />
                Append Random Triangle: {this.props.stats[MutationTypeAppend]}
            </div>
            <div>
                <input type="checkbox"
                    onChange={() => this.onUpdateEnabledMutations(MutationTypePosition)}
                    checked={this.state.config.enabledMutations[MutationTypePosition]} />
                Adjust Triangle Position: {this.props.stats[MutationTypePosition]}
            </div>

            <div>
                <input type="checkbox"
                    onChange={() => this.onUpdateEnabledMutations(MutationTypeColor)}
                    checked={this.state.config.enabledMutations[MutationTypeColor]} />
                Adjust Triangle Color: {this.props.stats[MutationTypeColor]}
            </div>

            <div>Delete Triangle: {this.props.stats[MutationTypeDelete]}</div>
            {/* {
                this.props.stats.map((item, i) => {
                    return <div key={`stats-${i}`}>{item}</div>;
                })
            } */}
        </div>);
    }

    render() {
        return <div className="col-sm-6" id="stats-container">
            <h4>Stats</h4>
            FPS:
                <span id="fps">{this.props.fps}</span>
            <br /> Triangle Count:
                <span id="triangles">{this.props.triangleCount}</span>
            <br /> Progress Speed:
                <span id="triangles">{this.props.progressSpeed}</span>
            <br /> Similarity:
                <div className="progress">
                <div id="similarity" className="progress-bar" role="progressbar" style={{ width: this.props.similarityText }}>
                    {this.props.similarityText}
                </div>
            </div>
            <hr />
            <h4>Mutation Improvements</h4>
            {this.renderStats()}
            <hr />
            <h4>Controls</h4>
            {this.renderControls()}
        </div>;
    }
}