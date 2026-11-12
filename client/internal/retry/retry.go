// Package retry centralizes HTTP retry-after parsing and retryable status rules.
package retry

import (
	"net/http"
	"strconv"
	"strings"
	"time"
)

const maxRetryAfter = 10 * time.Minute

// HTTPStatusRetryable reports whether an HTTP status may succeed when repeated.
func HTTPStatusRetryable(code int) bool {
	return code == http.StatusTooManyRequests || code >= 500
}

// ParseRetryAfter interprets a Retry-After header value relative to now.
func ParseRetryAfter(value string, now time.Time) time.Duration {
	value = strings.TrimSpace(value)
	if value == "" {
		return 0
	}
	if seconds, err := strconv.ParseInt(value, 10, 64); err == nil {
		if seconds <= 0 {
			return 0
		}
		if seconds > int64(maxRetryAfter/time.Second) {
			return maxRetryAfter
		}
		return time.Duration(seconds) * time.Second
	}
	when, err := http.ParseTime(value)
	if err != nil || !when.After(now) {
		return 0
	}
	delay := when.Sub(now)
	if delay > maxRetryAfter {
		return maxRetryAfter
	}
	return delay
}
