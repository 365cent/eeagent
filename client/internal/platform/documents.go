package platform

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"strings"
)

// CreateManualFallback creates a signal from a user-pasted source URL and body.
func (c *Client) CreateManualFallback(ctx context.Context, in ManualFallbackInput) (*Signal, error) {
	if strings.TrimSpace(in.URL) == "" || strings.TrimSpace(in.Title) == "" || strings.TrimSpace(in.Body) == "" {
		return nil, errors.New("manual fallback requires url, title, and body")
	}
	if int64(len(in.Body)) > c.maxBytes {
		return nil, fmt.Errorf("manual fallback body is %d bytes, over max_upload_mb", len(in.Body))
	}
	if in.Channel == "" {
		in.Channel = InferChannel(in.URL)
		if in.Channel == "" {
			in.Channel = "web"
		}
	}
	payload := struct {
		Title              string `json:"title"`
		URL                string `json:"url"`
		ChannelCode        string `json:"channel_code"`
		EvidenceStatusCode string `json:"evidence_status_code"`
		BodyText           string `json:"body_text"`
	}{
		Title:              strings.TrimSpace(in.Title),
		URL:                strings.TrimSpace(in.URL),
		ChannelCode:        in.Channel,
		EvidenceStatusCode: "pending_review",
		BodyText:           in.Body,
	}
	body, err := json.Marshal(payload)
	if err != nil {
		return nil, fmt.Errorf("encode manual fallback: %w", err)
	}
	var out Signal
	if err := c.doJSON(ctx, http.MethodPost, "/api/v1/signals", "application/json", body, &out); err != nil {
		return nil, err
	}
	if out.ID == "" {
		return nil, errors.New("manual fallback response did not include a signal id")
	}
	return &out, nil
}
