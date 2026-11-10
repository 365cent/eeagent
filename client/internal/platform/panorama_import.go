package platform

import (
	"bytes"
	"context"
	"fmt"
	"mime/multipart"
	"net/http"
	"net/url"
	"path"
	"strings"
)

// CaptureJobAwaiting is a server-side import job waiting for browser capture.
type CaptureJobAwaiting struct {
	CaptureJob
	SourceURL   string `json:"source_url"`
	ChannelCode string `json:"channel_code"`
}

// ListAwaitingCaptureJobs returns durable jobs in awaiting_client status.
func (c *Client) ListAwaitingCaptureJobs(ctx context.Context, limit int) ([]CaptureJobAwaiting, error) {
	if limit <= 0 {
		limit = 20
	}
	query := url.Values{}
	query.Set("status", "awaiting_client")
	query.Set("limit", fmt.Sprintf("%d", limit))
	var jobs []CaptureJobAwaiting
	path := "/api/v1/capture/jobs?" + query.Encode()
	if err := c.doJSON(ctx, http.MethodGet, path, "", nil, &jobs); err != nil {
		return nil, err
	}
	return jobs, nil
}

// ClaimCaptureJob reserves a job for this client instance.
func (c *Client) ClaimCaptureJob(ctx context.Context, jobID, workerID string) (*CaptureJobAwaiting, error) {
	var body bytes.Buffer
	mw := multipart.NewWriter(&body)
	if err := mw.WriteField("worker_id", workerID); err != nil {
		return nil, err
	}
	if err := mw.Close(); err != nil {
		return nil, err
	}
	var job CaptureJobAwaiting
	path := "/api/v1/capture/jobs/" + url.PathEscape(jobID) + "/claim"
	if err := c.doJSON(ctx, http.MethodPost, path, mw.FormDataContentType(), body.Bytes(), &job); err != nil {
		return nil, err
	}
	return &job, nil
}

// ClientReleaseCaptureJob returns a reserved job to awaiting_client (abort or disconnect).
func (c *Client) ClientReleaseCaptureJob(ctx context.Context, jobID, workerID, reason string) error {
	var body bytes.Buffer
	mw := multipart.NewWriter(&body)
	if err := mw.WriteField("worker_id", workerID); err != nil {
		return err
	}
	if reason != "" {
		if err := mw.WriteField("reason", reason); err != nil {
			return err
		}
	}
	if err := mw.Close(); err != nil {
		return err
	}
	path := "/api/v1/capture/jobs/" + url.PathEscape(jobID) + "/client-release"
	return c.doJSON(ctx, http.MethodPost, path, mw.FormDataContentType(), body.Bytes(), nil)
}

// ClientFailCaptureJob records a terminal browser-side failure for an import job.
func (c *Client) ClientFailCaptureJob(ctx context.Context, jobID, workerID, errText string) error {
	var body bytes.Buffer
	mw := multipart.NewWriter(&body)
	if err := mw.WriteField("worker_id", workerID); err != nil {
		return err
	}
	if err := mw.WriteField("error", errText); err != nil {
		return err
	}
	if err := mw.Close(); err != nil {
		return err
	}
	path := "/api/v1/capture/jobs/" + url.PathEscape(jobID) + "/client-fail"
	return c.doJSON(ctx, http.MethodPost, path, mw.FormDataContentType(), body.Bytes(), nil)
}

// ClientSubmitCaptureJob uploads captured bytes for a reserved import job.
func (c *Client) ClientSubmitCaptureJob(
	ctx context.Context,
	jobID string,
	filename string,
	contentType string,
	data []byte,
	workerID string,
) (*CaptureJob, error) {
	if int64(len(data)) > c.maxBytes {
		return nil, fmt.Errorf("payload is %d bytes, over max_upload_mb", len(data))
	}
	var body bytes.Buffer
	mw := multipart.NewWriter(&body)
	if err := mw.WriteField("worker_id", workerID); err != nil {
		return nil, err
	}
	part, err := createFilePart(mw, "file", filename, contentType)
	if err != nil {
		return nil, err
	}
	if _, err := part.Write(data); err != nil {
		return nil, err
	}
	if err := mw.Close(); err != nil {
		return nil, err
	}
	var job CaptureJob
	path := "/api/v1/capture/jobs/" + url.PathEscape(jobID) + "/client-submit"
	if err := c.doJSON(ctx, http.MethodPost, path, mw.FormDataContentType(), body.Bytes(), &job); err != nil {
		return nil, err
	}
	return &job, nil
}

// CaptureJobTerminal reports whether a durable job has finished processing.
func CaptureJobTerminal(status string) bool {
	switch status {
	case "succeeded", "failed", "cancelled":
		return true
	default:
		return false
	}
}

// IsPDFImportJob reports whether the server expects a document upload instead of HTML.
func IsPDFImportJob(rawURL, mime string) bool {
	if strings.Contains(strings.ToLower(mime), "pdf") {
		return true
	}
	return strings.HasSuffix(strings.ToLower(path.Clean(rawURL)), ".pdf")
}

// MaxUploadBytes returns the configured upload size limit.
func (c *Client) MaxUploadBytes() int64 {
	return c.maxBytes
}
