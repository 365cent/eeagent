package platform

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
)

// Reachable reports whether /openapi.json answers, used by doctor.
func (c *Client) Reachable(ctx context.Context) error {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, c.base+"/openapi.json", nil)
	if err != nil {
		return err
	}
	c.authorize(req)
	resp, err := c.http.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	io.Copy(io.Discard, io.LimitReader(resp.Body, 4096))
	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("%s: %s", c.base, resp.Status)
	}
	return nil
}

// SupportsCapture reports whether the backend exposes capture and document routes.
func (c *Client) SupportsCapture(ctx context.Context) (bool, error) {
	doc, err := c.openapiDocument(ctx)
	if err != nil {
		return false, err
	}
	pageCapture := hasPath(doc.Paths, "/api/v1/capture/jobs") ||
		hasPath(doc.Paths, "/api/v1/capture") ||
		hasPath(doc.Paths, "/api/v1/signals/capture")
	return pageCapture && hasPath(doc.Paths, "/api/v1/documents/raw") && hasPath(doc.Paths, "/api/v1/signals/{signal_id}/archive"), nil
}

func (c *Client) captureRoute(ctx context.Context) (string, bool, error) {
	c.routeMu.Lock()
	defer c.routeMu.Unlock()
	if c.capturePath != "" {
		return c.capturePath, c.captureIdempotent, nil
	}
	doc, err := c.openapiDocument(ctx)
	if err != nil || len(doc.Paths) == 0 {
		return "/api/v1/signals/capture", false, nil
	}
	if hasPath(doc.Paths, "/api/v1/capture/jobs") {
		c.capturePath = "/api/v1/capture/jobs"
		c.captureIdempotent = true
		return c.capturePath, c.captureIdempotent, nil
	}
	if hasPath(doc.Paths, "/api/v1/capture") {
		c.capturePath = "/api/v1/capture"
		c.captureIdempotent = captureHasSubmissionID(*doc)
		return c.capturePath, c.captureIdempotent, nil
	}
	if hasPath(doc.Paths, "/api/v1/signals/capture") {
		c.capturePath = "/api/v1/signals/capture"
		c.captureIdempotent = false
		return c.capturePath, c.captureIdempotent, nil
	}
	return "", false, fmt.Errorf("%s advertises neither unified nor legacy page capture", c.base)
}

type openAPIDocument struct {
	Paths      map[string]json.RawMessage `json:"paths"`
	Components struct {
		Schemas map[string]struct {
			Properties map[string]json.RawMessage `json:"properties"`
		} `json:"schemas"`
	} `json:"components"`
}

func captureHasSubmissionID(doc openAPIDocument) bool {
	var operation struct {
		Post struct {
			RequestBody struct {
				Content map[string]struct {
					Schema struct {
						Ref string `json:"$ref"`
					} `json:"schema"`
				} `json:"content"`
			} `json:"requestBody"`
		} `json:"post"`
	}
	if err := json.Unmarshal(doc.Paths["/api/v1/capture"], &operation); err != nil {
		return false
	}
	media, ok := operation.Post.RequestBody.Content["multipart/form-data"]
	if !ok {
		return false
	}
	const schemaPrefix = "#/components/schemas/"
	if !strings.HasPrefix(media.Schema.Ref, schemaPrefix) {
		return false
	}
	schema, ok := doc.Components.Schemas[strings.TrimPrefix(media.Schema.Ref, schemaPrefix)]
	if !ok {
		return false
	}
	_, ok = schema.Properties["submission_id"]
	return ok
}

func (c *Client) openapiDocument(ctx context.Context) (*openAPIDocument, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, c.base+"/openapi.json", nil)
	if err != nil {
		return nil, err
	}
	c.authorize(req)
	resp, err := c.http.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("%s: %s", c.base, resp.Status)
	}
	var doc openAPIDocument
	if err := json.NewDecoder(io.LimitReader(resp.Body, 8<<20)).Decode(&doc); err != nil {
		return nil, err
	}
	return &doc, nil
}

func hasPath(paths map[string]json.RawMessage, path string) bool {
	_, ok := paths[path]
	return ok
}
