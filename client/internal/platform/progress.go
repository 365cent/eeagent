package platform

// CaptureJobProgressPercent maps backend capture job status/stage to 0–100.
func CaptureJobProgressPercent(status, stage string) int {
	switch status {
	case "succeeded":
		return 100
	case "failed", "cancelled":
		return 0
	}
	switch stage {
	case "queued":
		return 12
	case "fetching":
		return 30
	case "processing":
		return 68
	case "completed":
		return 100
	default:
		return 45
	}
}

// LocalJobProgressPercent combines client-side stage with optional server poll state.
func LocalJobProgressPercent(localStage, serverStatus, serverStage string) int {
	switch localStage {
	case "capturing":
		return 22
	case "uploading":
		return 42
	case "processing":
		if serverStatus != "" || serverStage != "" {
			return CaptureJobProgressPercent(serverStatus, serverStage)
		}
		return 58
	case "done":
		return 100
	case "failed":
		return 0
	default:
		return 10
	}
}
