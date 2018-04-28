package main

import (
	"image/color"
	"math"
	"math/rand"

	"github.com/lucasb-eyer/go-colorful"
)

// A LineMutator creates random mutations in line instructions.
type LineMutator struct {
	config      *Config
	imageWidth  float64
	imageHeight float64
}

// NewLineMutator returns a new instance of `LineMutator`
func NewLineMutator(config *Config, imageWidth float64, imageHeight float64) *LineMutator {
	mut := new(LineMutator)
	mut.config = config
	mut.imageWidth = imageWidth
	mut.imageHeight = imageHeight
	return mut
}

// Mutate is the primary function of the mutator
// TODO: move this into another class that isn't specific to lines
func (mut *LineMutator) Mutate(instructions []Instruction) []Instruction {
	// TODO: use configurable weights to skew randomness towards different actions
	// this will allow for auto-tuning later on
	// 0 - append random item
	// 1 - append duplicate of random item, mutated
	// 2 - delete random item
	// 3 - mutate random item
	// 4 - swap random items

	switch rand.Int31n(5) {
	case 0:
		line := mut.RandomInstruction()
		instructions = append(instructions, line)
	case 1:
		item := mut.selectRandomInstruction(instructions)
		item = item.Clone()
		mut.MutateInstruction(item)
		instructions = append(instructions, item)
	case 2:
		i := rand.Int31n(int32(len(instructions)))
		instructions = InstructionList(instructions).Delete(int(i))
	case 3:
		item := mut.selectRandomInstruction(instructions)
		mut.MutateInstruction(item)
	case 4:
		i := rand.Int31n(int32(len(instructions)))
		j := rand.Int31n(int32(len(instructions)))
		instructions[i], instructions[j] = instructions[j], instructions[i]
	}
	return instructions
}

func (mut *LineMutator) selectRandomInstruction(instructions []Instruction) Instruction {
	i := rand.Int31n(int32(len(instructions)))
	return instructions[i]
}

func (mut *LineMutator) MutateInstruction(instruction Instruction) {
	line := instruction.(*Line)
	// color
	// coordinates
	// width
	switch rand.Int31n(3) {
	case 0:
		mut.mutateColor(line)
	case 1:
		mut.mutateCoordinates(line)
	default:
		mut.mutateLineWidth(line)
	}
}

func (mut *LineMutator) InstructionType() string {
	return TypeLine
}

// Mutate Color
// Hue, Sat, Val
// Red, Green, Blue

func (mut *LineMutator) mutateColor(line *Line) {
	switch rand.Int31n(3) {
	case 0:
		mut.mutateHue(line)
	case 1:
		mut.mutateSaturation(line)
	default:
		mut.mutateLightness(line)
	}
}

func (mut *LineMutator) mutateHue(line *Line) {
	hue, sat, lightness := MakeColor(line.Color).Hsl()
	newHue := mut.mutateValue(0, 360, mut.config.MinHueMutation, mut.config.MaxHueMutation, hue)
	line.Color = colorful.Hsl(newHue, sat, lightness)
}

func (mut *LineMutator) mutateSaturation(line *Line) {
	hue, sat, lightness := MakeColor(line.Color).Hsl()
	newSat := mut.mutateValue(0, 1, mut.config.MinSaturationMutation, mut.config.MaxSaturationMutation, sat)
	line.Color = colorful.Hsl(hue, newSat, lightness)
}

func (mut *LineMutator) mutateLightness(line *Line) {
	hue, sat, lightness := MakeColor(line.Color).Hsl()
	newLightness := mut.mutateValue(0, 1, mut.config.MinValueMutation, mut.config.MaxValueMutation, lightness)
	line.Color = colorful.Hsl(hue, sat, newLightness)
}

// Mutate Brush Size
// Bigger
// Smaller
func (mut *LineMutator) mutateLineWidth(line *Line) {
	line.Width = mut.mutateValue(0.1, config.MaxLineWidth, mut.config.MinLineWidthMutation, mut.config.MaxLineWidthMutation, line.Width)
}

// Mutate Coordinates
// Increase/Decrease X
// Increase/Decrease Y
func (mut *LineMutator) mutateCoordinates(line *Line) {
	switch rand.Int31n(2) {
	case 0:
		mut.mutateStart(line)
	default:
		mut.mutateEnd(line)
	}
}

func (mut *LineMutator) mutateStart(line *Line) {
	line.StartX = mut.mutateValue(0, mut.imageWidth, mut.config.MinCoordinateMutation, mut.config.MaxCoordinateMutation, line.StartX)
	line.StartY = mut.mutateValue(0, mut.imageHeight, mut.config.MinCoordinateMutation, mut.config.MaxCoordinateMutation, line.StartY)
}

func (mut *LineMutator) mutateEnd(line *Line) {
	line.EndX = mut.mutateValue(0, mut.imageWidth, mut.config.MinCoordinateMutation, mut.config.MaxCoordinateMutation, line.EndX)
	line.EndY = mut.mutateValue(0, mut.imageHeight, mut.config.MinCoordinateMutation, mut.config.MaxCoordinateMutation, line.EndY)
}

func (mut *LineMutator) RandomInstruction() Instruction {
	// Favor shorter lines
	var lineLength float64
	switch rand.Intn(30) {
	case 0:
		lineLength = rand.Float64()*(mut.imageWidth-5) + 5
	case 1, 2:
		lineLength = rand.Float64()*((mut.imageWidth/3)-5) + 5
	case 3, 4, 5, 6:
		lineLength = rand.Float64()*((mut.imageWidth/10)-5) + 5
	default:
		lineLength = rand.Float64()*((mut.imageWidth/20)-5) + 5
	}
	angle := rand.Float64() * math.Pi * 2.0
	startX := rand.Float64() * mut.imageWidth
	startY := rand.Float64() * mut.imageHeight
	endY := math.Sin(angle)*lineLength + startY
	endX := math.Cos(angle)*lineLength + startX
	return &Line{
		// StartX: rand.Float64() * mut.imageWidth,
		// StartY: rand.Float64() * mut.imageHeight,
		// EndX:   rand.Float64() * mut.imageWidth,
		// EndY:   rand.Float64() * mut.imageHeight,
		StartX: startX,
		StartY: startY,
		EndX:   endX,
		EndY:   endY,
		Color: &color.RGBA{
			A: 255,
			G: uint8(rand.Int31n(255)),
			B: uint8(rand.Int31n(255)),
			R: uint8(rand.Int31n(255)),
		},
		Width: rand.Float64()*(config.MaxLineWidth-1) + 1,
	}
}

func (mut *LineMutator) mutateValue(min float64, max float64, minDelta float64, maxDelta float64, value float64) float64 {
	amt := rand.Float64()*(maxDelta-minDelta) + minDelta
	value = value + amt
	// Make the new value wrap around at the inclusive boundaries
	for value < min {
		value = value + (max - min)
	}
	for value > max {
		value = value - (max - min)
	}
	return value
}
