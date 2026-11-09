package queue

import "regexp"

var (
	diagnosticURL    = regexp.MustCompile(`(?i)https?://[^\s\"'<>]+`)
	diagnosticBearer = regexp.MustCompile(`(?i)\bBearer\s+[A-Za-z0-9._~+/=-]+`)
	diagnosticSecret = regexp.MustCompile(`(?i)\b(authorization|proxy-authorization|cookie|set-cookie|access[_-]?token|refresh[_-]?token|token|api[_-]?key|password|passwd|secret|credential)\b(\s*[:=]\s*|\s+)(?:\"[^\"]*\"|'[^']*'|[^&\s,;]+)`)
)

// safeDiagnostic keeps queue errors useful without retaining URLs that may
// contain userinfo/query credentials or common credential values.
func safeDiagnostic(message string) string {
	message = diagnosticURL.ReplaceAllString(message, "[URL 已隐藏]")
	message = diagnosticBearer.ReplaceAllString(message, "Bearer [已隐藏]")
	message = diagnosticSecret.ReplaceAllString(message, "$1$2[已隐藏]")
	return message
}
