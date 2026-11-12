package ui

import (
	"fmt"
	"strconv"
	"strings"
)

func bounded(text string, lo, hi int) (int, error) {
	n, err := strconv.Atoi(strings.TrimSpace(text))
	if err != nil || n < lo || n > hi {
		return 0, fmt.Errorf("out of range")
	}
	return n, nil
}
