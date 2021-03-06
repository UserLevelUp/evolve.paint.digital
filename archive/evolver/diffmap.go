package main

import "math"

const granularity float32 = 10000

// DiffMap provides a way to keep track of organism diffs
// by pixel. This avoids having to recalculate them later.
// Diffs are stored as int64 values to avoid weird floating point
// precision loss during calculations.
type DiffMap struct {
	// Diffs by pixel. Access by `Diffs[x][y]`
	// Granularity on a scale of 10,000 levels
	// Not sure yet if this will work with very large images.
	Diffs [][]int64
	Total int64
}

// SetDiff updates the diff at the specified coordinates
func (d *DiffMap) SetDiff(x int, y int, diff float32) {
	newValue := int64(math.Ceil(float64(diff * granularity)))
	d.Total -= d.Diffs[x][y]
	d.Diffs[x][y] = newValue
	d.Total += newValue
}

// GetDiff returns the diff at the specified coordinates
func (d *DiffMap) GetDiff(x int, y int) float32 {
	return float32(d.Diffs[x][y]) / granularity
}

// GetAverageDiff returns the average diff based on total divided
// by total number of pixels
func (d *DiffMap) GetAverageDiff() float32 {
	width := len(d.Diffs)
	height := len(d.Diffs[0])
	avg := d.Total / int64(width*height)
	return float32(avg) / granularity
}

// Clear sets all pixel differences to zero.
func (d *DiffMap) Clear() {
	for x := 0; x < len(d.Diffs); x++ {
		for y := 0; y < len(d.Diffs[0]); y++ {
			d.Diffs[x][y] = 0
		}
	}
	d.Total = 0
}

// RecalculateTotal updates the Total based on pixel values
func (d *DiffMap) RecalculateTotal() {
	d.Total = 0
	for x := 0; x < len(d.Diffs); x++ {
		for y := 0; y < len(d.Diffs[0]); y++ {
			d.Total += d.Diffs[x][y]
		}
	}
}
