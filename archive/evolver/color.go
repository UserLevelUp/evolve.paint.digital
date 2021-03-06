package main

import (
	"image/color"

	colorful "github.com/lucasb-eyer/go-colorful"
)

// MakeColor returns a colorful.Color from an RGB color
func MakeColor(clr color.Color) colorful.Color {
	r, g, b, _ := clr.RGBA()
	return MakeColorRGB(r, g, b)
}

func MakeColorRGB(r uint32, g uint32, b uint32) colorful.Color {
	result := colorful.Color{
		R: float64(r) / 255.0,
		G: float64(g) / 255.0,
		B: float64(b) / 255.0,
	}
	return result
}

func ColorKey(clr color.Color) uint32 {
	r, g, b, _ := clr.RGBA()
	return r<<16 + g<<8 + b
	// return fmt.Sprintf("%v|%v|%v", r, g, b)
}

type SavedColor struct {
	R uint8
	G uint8
	B uint8
	A uint8
}

// SaveColor saves the color to a persistable form
// Deprecated: use SaveColorHex instead
func SaveColor(color color.Color) *SavedColor {
	r, g, b, a := color.RGBA()
	return &SavedColor{
		R: uint8(r),
		G: uint8(g),
		B: uint8(b),
		A: uint8(a),
	}
}

// SaveColorHex saves the color to a hex string
func SaveColorHex(clr color.Color) string {
	return MakeColor(clr).Hex()
}

// LoadColor loads the color from a persisted form
func LoadColor(savedColor *SavedColor) *color.RGBA {
	return &color.RGBA{
		savedColor.R,
		savedColor.G,
		savedColor.B,
		savedColor.A,
	}
}

// LoadColorHex loads the color from a hex string
func LoadColorHex(encoded string) *color.RGBA {
	clr, _ := colorful.Hex(encoded)
	r, g, b, _ := clr.RGBA()
	return &color.RGBA{
		uint8(r),
		uint8(g),
		uint8(b),
		uint8(255),
	}
	// return MakeColorRGB(r, g, b)
}
