// Package cdp implements the subset of the Chrome DevTools Protocol used by
// the capture client: a small RFC 6455 websocket client plus flattened
// browser/target sessions. It has no third-party dependencies.
package cdp

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"sync"
	"time"
)

// ProtocolError is a CDP error object returned for a failed command.
type ProtocolError struct {
	Code    int             `json:"code"`
	Message string          `json:"message"`
	Data    json.RawMessage `json:"data,omitempty"`
}

func (e *ProtocolError) Error() string { return fmt.Sprintf("cdp error %d: %s", e.Code, e.Message) }

// Event is a CDP event, scoped to a session when SessionID is set.
type Event struct {
	Method    string
	Params    json.RawMessage
	SessionID string
}

type inbound struct {
	ID        int64           `json:"id,omitempty"`
	Method    string          `json:"method,omitempty"`
	Params    json.RawMessage `json:"params,omitempty"`
	Result    json.RawMessage `json:"result,omitempty"`
	Error     *ProtocolError  `json:"error,omitempty"`
	SessionID string          `json:"sessionId,omitempty"`
}

type waiter struct {
	match func(Event) bool
	ch    chan Event
}

// Client is a CDP connection multiplexed across flattened sessions.
type Client struct {
	ws       *wsConn
	writeMu  sync.Mutex
	nextID   int64
	mu       sync.Mutex
	pending  map[int64]chan inbound
	waiters  []*waiter
	closed   chan struct{}
	closeErr error
	once     sync.Once
}

// Dial connects to a browser-level DevTools websocket endpoint.
func Dial(wsURL string, timeout time.Duration) (*Client, error) {
	ws, err := dialWS(wsURL, timeout)
	if err != nil {
		return nil, err
	}
	c := &Client{
		ws:      ws,
		pending: make(map[int64]chan inbound),
		closed:  make(chan struct{}),
	}
	go c.readLoop()
	return c, nil
}

func (c *Client) readLoop() {
	for {
		data, err := c.ws.readMessage()
		if err != nil {
			c.shutdown(err)
			return
		}
		var msg inbound
		if err := json.Unmarshal(data, &msg); err != nil {
			continue
		}
		if msg.ID != 0 {
			c.mu.Lock()
			ch, ok := c.pending[msg.ID]
			delete(c.pending, msg.ID)
			c.mu.Unlock()
			if ok {
				ch <- msg
			}
			continue
		}
		if msg.Method == "" {
			continue
		}
		ev := Event{Method: msg.Method, Params: msg.Params, SessionID: msg.SessionID}
		c.dispatch(ev)
	}
}

func (c *Client) dispatch(ev Event) {
	c.mu.Lock()
	var keep []*waiter
	var fire []*waiter
	for _, w := range c.waiters {
		if w.match(ev) {
			fire = append(fire, w)
		} else {
			keep = append(keep, w)
		}
	}
	c.waiters = keep
	c.mu.Unlock()
	for _, w := range fire {
		select {
		case w.ch <- ev:
		default:
		}
		close(w.ch)
	}
}

func (c *Client) shutdown(err error) {
	c.once.Do(func() {
		c.closeErr = err
		close(c.closed)
		c.mu.Lock()
		for id, ch := range c.pending {
			ch <- inbound{ID: id, Error: &ProtocolError{Code: -1, Message: "connection closed: " + err.Error()}}
			delete(c.pending, id)
		}
		waiters := c.waiters
		c.waiters = nil
		c.mu.Unlock()
		for _, w := range waiters {
			close(w.ch)
		}
		_ = c.ws.close()
	})
}

// Close terminates the connection.
func (c *Client) Close() error {
	c.shutdown(errors.New("client closed"))
	return nil
}

// Watch registers an event filter. Events are delivered until the returned
// cancel function is called; the channel closes on cancel or disconnect.
func (c *Client) Watch(match func(Event) bool) (<-chan Event, func()) {
	w := &waiter{match: match, ch: make(chan Event, 4)}
	c.mu.Lock()
	select {
	case <-c.closed:
		c.mu.Unlock()
		close(w.ch)
		return w.ch, func() {}
	default:
	}
	c.waiters = append(c.waiters, w)
	c.mu.Unlock()
	return w.ch, func() {
		c.mu.Lock()
		defer c.mu.Unlock()
		for i, other := range c.waiters {
			if other == w {
				c.waiters = append(c.waiters[:i], c.waiters[i+1:]...)
				close(w.ch)
				return
			}
		}
	}
}

// Call sends a browser-level command and waits for its result.
func (c *Client) Call(ctx context.Context, method string, params any) (json.RawMessage, error) {
	return c.call(ctx, "", method, params)
}

func (c *Client) call(ctx context.Context, sessionID, method string, params any) (json.RawMessage, error) {
	select {
	case <-c.closed:
		return nil, fmt.Errorf("cdp: %w", c.closeErr)
	default:
	}

	var rawParams json.RawMessage
	if params != nil {
		b, err := json.Marshal(params)
		if err != nil {
			return nil, err
		}
		rawParams = b
	}

	c.mu.Lock()
	c.nextID++
	id := c.nextID
	ch := make(chan inbound, 1)
	c.pending[id] = ch
	c.mu.Unlock()

	msg := struct {
		ID        int64           `json:"id"`
		Method    string          `json:"method"`
		Params    json.RawMessage `json:"params,omitempty"`
		SessionID string          `json:"sessionId,omitempty"`
	}{ID: id, Method: method, Params: rawParams, SessionID: sessionID}

	data, err := json.Marshal(msg)
	if err != nil {
		return nil, err
	}

	c.writeMu.Lock()
	err = c.ws.writeText(data)
	c.writeMu.Unlock()
	if err != nil {
		c.mu.Lock()
		delete(c.pending, id)
		c.mu.Unlock()
		return nil, err
	}

	select {
	case res := <-ch:
		if res.Error != nil {
			return nil, res.Error
		}
		return res.Result, nil
	case <-ctx.Done():
		c.mu.Lock()
		delete(c.pending, id)
		c.mu.Unlock()
		return nil, ctx.Err()
	}
}

// Session is a flattened DevTools session bound to one target.
type Session struct {
	c        *Client
	ID       string
	TargetID string
}

// Call sends a session-scoped command.
func (s *Session) Call(ctx context.Context, method string, params any) (json.RawMessage, error) {
	return s.c.call(ctx, s.ID, method, params)
}

// CallDecode sends a session-scoped command and decodes its result.
func (s *Session) CallDecode(ctx context.Context, method string, params, out any) error {
	raw, err := s.Call(ctx, method, params)
	if err != nil {
		return err
	}
	if out == nil || len(raw) == 0 {
		return nil
	}
	return json.Unmarshal(raw, out)
}

// Browser drives a browser-level CDP connection.
type Browser struct {
	*Client
}

// NewBrowser wraps an existing connection.
func NewBrowser(wsURL string, timeout time.Duration) (*Browser, error) {
	c, err := Dial(wsURL, timeout)
	if err != nil {
		return nil, err
	}
	return &Browser{Client: c}, nil
}

// NewTarget creates a tab and attaches a flattened session to it.
func (b *Browser) NewTarget(ctx context.Context, url string) (*Session, error) {
	var created struct {
		TargetID string `json:"targetId"`
	}
	raw, err := b.Call(ctx, "Target.createTarget", map[string]any{"url": url})
	if err != nil {
		return nil, err
	}
	if err := decodeInto(raw, &created); err != nil {
		return nil, err
	}
	var attached struct {
		SessionID string `json:"sessionId"`
	}
	raw, err = b.Call(ctx, "Target.attachToTarget", map[string]any{
		"targetId": created.TargetID,
		"flatten":  true,
	})
	if err != nil {
		return nil, err
	}
	if err := decodeInto(raw, &attached); err != nil {
		return nil, err
	}
	return &Session{c: b.Client, ID: attached.SessionID, TargetID: created.TargetID}, nil
}

// AttachTarget returns a flattened session for an existing target id.
func (b *Browser) AttachTarget(ctx context.Context, targetID string) (*Session, error) {
	var attached struct {
		SessionID string `json:"sessionId"`
	}
	raw, err := b.Call(ctx, "Target.attachToTarget", map[string]any{
		"targetId": targetID,
		"flatten":  true,
	})
	if err != nil {
		return nil, err
	}
	if err := decodeInto(raw, &attached); err != nil {
		return nil, err
	}
	return &Session{c: b.Client, ID: attached.SessionID, TargetID: targetID}, nil
}

func decodeInto(raw json.RawMessage, out any) error {
	return json.Unmarshal(raw, out)
}
