package main

import (
	"encoding/json"
	"io/ioutil"
	"os"
)

// Config is the configuration for the evolver application
type Config struct {
	MinHueMutation          float64
	MaxHueMutation          float64
	MinValueMutation        float64
	MaxValueMutation        float64
	MinSaturationMutation   float64
	MaxSaturationMutation   float64
	MinCoordinateMutation   float64
	MaxCoordinateMutation   float64
	MinLineWidthMutation    float64
	MaxLineWidthMutation    float64
	MinCircleRadiusMutation float64
	MaxCircleRadiusMutation float64
	InstructionTypes        []string
	ComplexityThreshold     int     // An organism can reach this many instructions before score penalties are applied
	ComplexityPenalty       float64 // For each instruction over the threshold, this amount is added to the diff
	MinPopulation           int     // When culling organisms for fitness, don't cull lower than this amount
	MaxPopulation           int     // When repopulating, don't create more than this many organisms
	MinComplexity           int     // Lower bound of default complexity when creating random organisms
	MaxComplexity           int     // Upper bound of default complexity when creating random organisms
	MinMutations            int     // Minimum number of mutations applied to an organism
	MaxMutations            int     // Maximum number of mutations applied to an organism
}

// LoadConfig loads the application config from a file
func LoadConfig(filename string) (*Config, error) {
	config := &Config{}
	data, err := ioutil.ReadFile(filename)
	if err != nil {
		return nil, err
	}
	err = json.Unmarshal(data, config)
	if err != nil {
		return nil, err
	}
	return config, nil
}

// SaveConfig saves an application configuration to disk
func SaveConfig(filename string, config *Config) error {
	data, err := json.Marshal(config)
	if err != nil {
		return err
	}
	file, err := os.Create(filename)
	if err != nil {
		return err
	}
	defer file.Close()
	_, err = file.Write(data)
	return err
}

// DefaultConfig returns the default application configuration
func DefaultConfig() *Config {
	return &Config{
		MinHueMutation:          0,
		MaxHueMutation:          10,
		MinValueMutation:        0,
		MaxValueMutation:        0.1,
		MinSaturationMutation:   0,
		MaxSaturationMutation:   0.1,
		MinCoordinateMutation:   0,
		MaxCoordinateMutation:   100,
		MinLineWidthMutation:    0,
		MaxLineWidthMutation:    10,
		MinCircleRadiusMutation: 0,
		MaxCircleRadiusMutation: 10,
		ComplexityThreshold:     10000,
		ComplexityPenalty:       0.01,
		MinPopulation:           50,
		MaxPopulation:           1000,
		MinComplexity:           1000,
		MaxComplexity:           5000,
		MinMutations:            1,
		MaxMutations:            10,
		InstructionTypes: []string{
			TypeLine, TypeCircle,
		},
	}
}
