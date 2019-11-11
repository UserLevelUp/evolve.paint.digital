import * as React from "react";
import { saveAs } from "file-saver";

import { Menu } from "../Menu";
import { PaintingEvolver } from "./PaintingEvolver";
import { Evolver } from "../../engine/brushEvolver";
import { DownloadDialog } from "../../components/DownloadDialog";
import { PaintingEvolverMenu } from "./PaintingEvolverMenu";
import { Config } from "../../engine/brushConfig";

import { brushData } from "../../engine/starbrush";
import { BrushSetData, BrushSet } from "../../engine/brushSet";

export interface PaintingEvolverPageState {
    imageLoaded: boolean;
    started: boolean;
    displayMode: number;
    imageLoading: boolean;
    trianglesLoading: boolean;
    lastStatsUpdate: number;
    fps: number;
    similarityText: string;
    similarity: number;
    progressSpeed: number;
    triangleCount: number;
    stats: { [key: string]: number };
    currentViewMode: number;
    config: Config;

    exportImageWidth: number;
    exportImageHeight: number;
    exportImageTimestamp: number;
    exportImageData?: Uint8Array;
}

React.createContext(null, null);

export class PaintingEvolverPage extends React.Component<{}, PaintingEvolverPageState> {

    private evolver: Evolver;
    private snapshotCanvas: HTMLCanvasElement;

    constructor(props) {
        super(props);
        this.state = {
            imageLoaded: false,
            started: false,
            displayMode: 0,
            imageLoading: false,
            trianglesLoading: false,
            lastStatsUpdate: new Date().getTime(),
            fps: 0,
            similarityText: "0%",
            similarity: 0,
            progressSpeed: 0,
            triangleCount: 0,
            stats: {},
            currentViewMode: 0,
            exportImageWidth: 0,
            exportImageHeight: 0,
            exportImageData: null,
            exportImageTimestamp: new Date().getTime(),
            config: {
                saveSnapshots: false,
                maxSnapshots: 1800,
                focusExponent: 1,
                minColorMutation: 0.001,
                maxColorMutation: 0.01,
                frameSkip: 10,
                enabledMutations: {
                    "append": true,
                    "color": true,
                    "delete": true,
                    "points": true,
                    "position": true,
                },
            },
        };
    }

    componentDidMount() {

        // TODO: temporary scaffolding to test brush-based painting evolver
        // This should probably be put in the brush set file.
        // ===================================================================

        // load image, get image pixels as Uint8Array in onload callback
        const img = new Image();
        img.src = brushData;
        img.onload = () => {
            const c2 = document.createElement("canvas");
            c2.width = img.width;
            c2.height = img.height;

            const ctx = c2.getContext("2d");
            ctx.drawImage(img, 0, 0);


            const imageData = ctx.getImageData(0, 0, img.width, img.height).data;

            // If there are no transparent pixels, assume that there is a white
            // background
            let isTransparentBackground = false;

            // convert shades of white to levels of transparent
            let maxValue = 0;
            let minValue = 10000;
            for (let c = 0; c < imageData.length; c += 4) {
                const r = imageData[c];
                if (r > maxValue) {
                    maxValue = r;
                }
                if (r < minValue) {
                    minValue = r;
                }
                const alpha = imageData[c + 3];
                // alpha of less than 10 is as good as fully transparent
                isTransparentBackground = isTransparentBackground || alpha <= 10;
            }
            // Only make the background transparent
            if (!isTransparentBackground) {
                // Based on min/max values in the image, normalize
                // the values and then assign to alpha.
                const alphaMultiplier = (maxValue - minValue) / 255.0;
                for (let c = 0; c < imageData.length; c += 4) {
                    const r = imageData[c];
                    // calculate alpha
                    // darker value is higher alpha, because of
                    // the assumed white background
                    const alpha = Math.floor(255.0 - (r - minValue) * alphaMultiplier);
                    // set alpha
                    imageData[c + 3] = alpha;
                }
            }



            // Build brush set from image data
            const brushSetData: BrushSetData = {
                brushDataUri: brushData,
                height: img.height,
                width: img.width,
                brushes: [
                    // Large brushes
                    // first row left to right
                    {
                        left: 23,
                        top: 40,
                        right: 249,
                        bottom: 417,
                    },
                    {
                        left: 278,
                        top: 30,
                        right: 469,
                        bottom: 513,
                    },
                    {
                        left: 487,
                        top: 52,
                        right: 487 + 230,
                        bottom: 52 + 369,
                    },
                    {
                        left: 730,
                        top: 49,
                        right: 730 + 154,
                        bottom: 49 + 414,
                    },
                    {
                        left: 908,
                        top: 75,
                        right: 908 + 136,
                        bottom: 75 + 361,
                    },
                    // Second row left to right
                    {
                        left: 16,
                        top: 539,
                        right: 16 + 481,
                        bottom: 539 + 269,
                    },
                    {
                        left: 537,
                        top: 512,
                        right: 537 + 496,
                        bottom: 512 + 310,
                    },
                    // Third row left to right
                    {
                        left: 21,
                        top: 860,
                        right: 21 + 122,
                        bottom: 860 + 680,
                    },
                    {
                        left: 201,
                        top: 884,
                        right: 201 + 195,
                        bottom: 884 + 659,
                    },
                    {
                        left: 422,
                        top: 919,
                        right: 422 + 197,
                        bottom: 919 + 583,
                    },
                    {
                        left: 681,
                        top: 1055,
                        right: 681 + 146,
                        bottom: 1055 + 304,
                    },
                    {
                        left: 857,
                        top: 1031,
                        right: 857 + 139,
                        bottom: 1031 + 410,
                    },
                    // Fourth row left to right
                    {
                        left: 19,
                        top: 1609,
                        right: 19 + 101,
                        bottom: 1609 + 329,
                    },
                    {
                        left: 151,
                        top: 1591,
                        right: 151 + 112,
                        bottom: 1591 + 360,
                    },
                    {
                        left: 286,
                        top: 1529,
                        right: 286 + 177,
                        bottom: 1529 + 506,
                    },
                    {
                        left: 512,
                        top: 1604,
                        right: 512 + 113,
                        bottom: 1604 + 345,
                    },
                    {
                        left: 639,
                        top: 1595,
                        right: 639 + 295,
                        bottom: 1595 + 364,
                    },

                    // Small brushes
                    // first column top to bottom
                    {
                        left: 1241,
                        top: 21,
                        right: 1241 + 222,
                        bottom: 21 + 49,
                    },
                    {
                        left: 1290,
                        top: 88,
                        right: 1290 + 108,
                        bottom: 88 + 40,
                    },
                    {
                        left: 1261,
                        top: 141,
                        right: 1261 + 132,
                        bottom: 141 + 51,
                    },
                    {
                        left: 1249,
                        top: 216,
                        right: 1249 + 165,
                        bottom: 216 + 34,
                    },
                    {
                        left: 1255,
                        top: 275,
                        right: 1255 + 184,
                        bottom: 275 + 28,
                    },
                    {
                        left: 1251,
                        top: 338,
                        right: 1251 + 181,
                        bottom: 338 + 54,
                    },
                    {
                        left: 1257,
                        top: 410,
                        right: 1257 + 142,
                        bottom: 410 + 39,
                    },
                    {
                        left: 1258,
                        top: 480,
                        right: 1258 + 157,
                        bottom: 480 + 41,
                    },
                    {
                        left: 1268,
                        top: 531,
                        right: 1268 + 25,
                        bottom: 531 + 29,
                    },
                    {
                        left: 1298,
                        top: 530,
                        right: 1298 + 29,
                        bottom: 530 + 29,
                    },
                    {
                        left: 1335,
                        top: 527,
                        right: 1335 + 51,
                        bottom: 527 + 34,
                    },
                    {
                        left: 1285,
                        top: 570,
                        right: 1285 + 92,
                        bottom: 570 + 35,
                    },
                    {
                        left: 1270,
                        top: 616,
                        right: 1270 + 144,
                        bottom: 616 + 37,
                    },
                    // to be continued...
                ],
            };
            const brushSet: BrushSet = new BrushSet(brushSetData, imageData);
            this.evolver = new Evolver(
                document.getElementById("c") as HTMLCanvasElement,
                this.state.config,
                brushSet,
            );
            this.evolver.onSnapshot = this.onSnapshot.bind(this);
            // TODO: capture handles and clear on unmount
            // Optimize every minute
            window.setInterval(() => this.evolver.optimize(), 60000);
            // Update stats twice a second
            window.setInterval(() => this.updateStats(), 500);
        };


    }

    onDisplayModeChanged(displayMode: number) {
        this.evolver.display.displayTexture = displayMode;
        this.setState({
            currentViewMode: displayMode,
        });
    }

    onStartStop() {
        if (this.evolver.running) {
            this.evolver.stop();
        } else {
            this.evolver.start();
        }
        this.setState({
            started: this.evolver.running,
        });
    }

    onImageLoadStart() {
        this.setState({
            imageLoading: true,
        });
    }

    onImageLoadComplete(srcImage: HTMLImageElement) {
        const size = Math.sqrt(srcImage.width * srcImage.height);
        this.setState({
            imageLoading: false,
            imageLoaded: true,
            config: this.state.config,
            exportImageWidth: srcImage.width,
            exportImageHeight: srcImage.height,
        });
        if (this.evolver.running) {
            this.onStartStop();
        }
        this.evolver.setSrcImage(srcImage);
    }

    onExportImage() {
        this.evolver.exportPNG((pixels, width, height) => {
            this.setState({
                exportImageData: pixels,
                exportImageWidth: width,
                exportImageHeight: height,
                exportImageTimestamp: new Date().getTime(),
            });
        });
    }

    onExportTriangles() {
        const triangles = this.evolver.exportBrushStrokes();
        var blob = new Blob([triangles], { type: "text/plain" })
        saveAs(blob, "painting.txt");
    }

    onloadTrianglesStart() {
        this.setState({
            trianglesLoading: true,
        });
    }

    onLoadTriangles(painting: string) {
        this.evolver.importBrushStrokes(painting);
        this.setState({
            trianglesLoading: false,
        });
    }

    onCancelExportImage() {
        this.setState({
            exportImageData: null,
        });
    }

    private getSimilarityPercentage(): number {
        return this.evolver.similarity * 100;
    }

    private onSnapshot(pixels: Uint8Array, num: number) {
        const ctx = this.snapshotCanvas.getContext("2d");
        const imageData = ctx.createImageData(this.state.exportImageWidth, this.state.exportImageHeight);
        for (let i = 0; i < pixels.length; i++) {
            imageData.data[i] = pixels[i];
        }
        ctx.putImageData(imageData, 0, 0);
        let filename = `${num}`;
        while (filename.length < 4) {
            filename = "0" + filename;
        }
        filename = filename + ".png";
        this.snapshotCanvas.toBlob(result => {
            saveAs(result, filename);
        }, "image/png");
    }

    updateStats() {
        let lastStatsUpdate = this.state.lastStatsUpdate
        const now = new Date().getTime();
        const fps = Math.round(1000 * this.evolver.frames / (now - lastStatsUpdate));
        this.evolver.frames = 0;
        lastStatsUpdate = now;
        const similarity = this.getSimilarityPercentage();
        const similarityText = similarity.toFixed(4) + "%";
        const progressSpeed = similarity - this.state.similarity;

        this.setState({
            lastStatsUpdate: lastStatsUpdate,
            fps: fps,
            similarityText: similarityText,
            similarity: similarity,
            stats: this.evolver.mutatorstats,
            progressSpeed: progressSpeed,
            triangleCount: this.evolver.strokes.length,
        });
    }

    render() {
        return <div className="row">
            <div className="col-lg-8 offset-lg-2 col-md-12">
                <Menu>
                    <PaintingEvolverMenu onStartStop={this.onStartStop.bind(this)}
                        imageLoaded={this.state.imageLoaded}
                        started={this.state.started}
                        imageLoading={this.state.imageLoading}
                        onImageLoadStart={this.onImageLoadStart.bind(this)}
                        onImageLoadComplete={this.onImageLoadComplete.bind(this)}
                        onSaveImage={this.onExportImage.bind(this)}
                        trianglesLoading={this.state.trianglesLoading}
                        onLoadTrianglesComplete={this.onLoadTriangles.bind(this)}
                        onLoadTrianglesStart={this.onloadTrianglesStart.bind(this)}
                        onSaveTriangles={this.onExportTriangles.bind(this)}
                    />
                </Menu>
                <PaintingEvolver
                    fps={this.state.fps}
                    similarityText={this.state.similarityText}
                    triangleCount={this.state.triangleCount}
                    stats={this.state.stats}
                    currentMode={this.state.currentViewMode}
                    onViewModeChanged={this.onDisplayModeChanged.bind(this)}
                    config={this.state.config}
                    progressSpeed={this.state.progressSpeed} />
            </div>
            <DownloadDialog
                imageWidth={this.state.exportImageWidth}
                imageHeight={this.state.exportImageHeight}
                imageData={this.state.exportImageData}
                onClose={this.onCancelExportImage.bind(this)}
                timestamp={this.state.exportImageTimestamp} />
            <canvas
                width={this.state.exportImageWidth}
                height={this.state.exportImageHeight}
                style={{ display: "none" }}
                ref={c => this.snapshotCanvas = c}
            />
        </div>;
    }
}
