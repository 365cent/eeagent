package cdp

import (
	"bufio"
	"crypto/rand"
	"encoding/base64"
	"encoding/binary"
	"errors"
	"fmt"
	"io"
	"net"
	"net/url"
	"sync"
	"time"
)

const (
	opText   = 0x1
	opBinary = 0x2
	opClose  = 0x8
	opPing   = 0x9
	opPong   = 0xa

	maxMessageSize = 96 << 20
)

// wsConn is a minimal RFC 6455 client: text frames, fragmentation, ping/pong.
// Go's stdlib has no websocket support and the target network blocks module
// proxies, so CDP transport is implemented here over net.Conn.
type wsConn struct {
	conn    net.Conn
	br      *bufio.Reader
	writeMu sync.Mutex
}

func dialWS(rawURL string, timeout time.Duration) (*wsConn, error) {
	u, err := url.Parse(rawURL)
	if err != nil {
		return nil, fmt.Errorf("parse ws url: %w", err)
	}
	if u.Scheme != "ws" {
		return nil, fmt.Errorf("unsupported scheme %q", u.Scheme)
	}
	conn, err := net.DialTimeout("tcp", u.Host, timeout)
	if err != nil {
		return nil, err
	}
	key := make([]byte, 16)
	if _, err := rand.Read(key); err != nil {
		conn.Close()
		return nil, err
	}
	path := u.RequestURI()
	if path == "" {
		path = "/"
	}
	req := "GET " + path + " HTTP/1.1\r\n" +
		"Host: " + u.Host + "\r\n" +
		"Upgrade: websocket\r\n" +
		"Connection: Upgrade\r\n" +
		"Sec-WebSocket-Key: " + base64.StdEncoding.EncodeToString(key) + "\r\n" +
		"Sec-WebSocket-Version: 13\r\n\r\n"
	conn.SetDeadline(time.Now().Add(timeout))
	if _, err := io.WriteString(conn, req); err != nil {
		conn.Close()
		return nil, err
	}
	br := bufio.NewReaderSize(conn, 64<<10)
	status, err := br.ReadString('\n')
	if err != nil {
		conn.Close()
		return nil, err
	}
	if len(status) < 12 || status[9:12] != "101" {
		conn.Close()
		return nil, fmt.Errorf("websocket handshake rejected: %s", trimCRLF(status))
	}
	for {
		line, err := br.ReadString('\n')
		if err != nil {
			conn.Close()
			return nil, err
		}
		if line == "\r\n" || line == "\n" {
			break
		}
	}
	conn.SetDeadline(time.Time{})
	return &wsConn{conn: conn, br: br}, nil
}

func trimCRLF(s string) string {
	for len(s) > 0 && (s[len(s)-1] == '\n' || s[len(s)-1] == '\r') {
		s = s[:len(s)-1]
	}
	return s
}

func (c *wsConn) writeFrame(op byte, payload []byte) error {
	c.writeMu.Lock()
	defer c.writeMu.Unlock()
	header := make([]byte, 0, 14)
	header = append(header, 0x80|op)
	n := len(payload)
	switch {
	case n < 126:
		header = append(header, 0x80|byte(n))
	case n <= 0xffff:
		header = append(header, 0x80|126, byte(n>>8), byte(n))
	default:
		header = append(header, 0x80|127)
		var buf [8]byte
		binary.BigEndian.PutUint64(buf[:], uint64(n))
		header = append(header, buf[:]...)
	}
	mask := make([]byte, 4)
	if _, err := rand.Read(mask); err != nil {
		return err
	}
	header = append(header, mask...)
	masked := make([]byte, n)
	for i := 0; i < n; i++ {
		masked[i] = payload[i] ^ mask[i&3]
	}
	if _, err := c.conn.Write(header); err != nil {
		return err
	}
	_, err := c.conn.Write(masked)
	return err
}

func (c *wsConn) writeText(b []byte) error { return c.writeFrame(opText, b) }

func (c *wsConn) readFrame() (op byte, fin bool, payload []byte, err error) {
	var head [2]byte
	if _, err = io.ReadFull(c.br, head[:]); err != nil {
		return 0, false, nil, err
	}
	fin = head[0]&0x80 != 0
	op = head[0] & 0x0f
	masked := head[1]&0x80 != 0
	n := uint64(head[1] & 0x7f)
	switch n {
	case 126:
		var ext [2]byte
		if _, err = io.ReadFull(c.br, ext[:]); err != nil {
			return 0, false, nil, err
		}
		n = uint64(binary.BigEndian.Uint16(ext[:]))
	case 127:
		var ext [8]byte
		if _, err = io.ReadFull(c.br, ext[:]); err != nil {
			return 0, false, nil, err
		}
		n = binary.BigEndian.Uint64(ext[:])
	}
	if n > maxMessageSize {
		return 0, false, nil, fmt.Errorf("frame too large: %d bytes", n)
	}
	var mask [4]byte
	if masked {
		if _, err = io.ReadFull(c.br, mask[:]); err != nil {
			return 0, false, nil, err
		}
	}
	payload = make([]byte, n)
	if _, err = io.ReadFull(c.br, payload); err != nil {
		return 0, false, nil, err
	}
	if masked {
		for i := range payload {
			payload[i] ^= mask[i&3]
		}
	}
	return op, fin, payload, nil
}

// readMessage returns the next complete text/binary message.
// Control frames are handled inline.
func (c *wsConn) readMessage() ([]byte, error) {
	var (
		msg    []byte
		fragOp byte
		inFrag bool
	)
	for {
		op, fin, payload, err := c.readFrame()
		if err != nil {
			return nil, err
		}
		switch op {
		case opPing:
			if err := c.writeFrame(opPong, payload); err != nil {
				return nil, err
			}
			continue
		case opPong:
			continue
		case opClose:
			_ = c.writeFrame(opClose, nil)
			return nil, io.EOF
		case opText, opBinary:
			if fin {
				return payload, nil
			}
			fragOp, inFrag = op, true
			msg = append(msg[:0], payload...)
		case 0: // continuation
			if !inFrag {
				return nil, errors.New("unexpected continuation frame")
			}
			if len(msg)+len(payload) > maxMessageSize {
				return nil, errors.New("message too large")
			}
			msg = append(msg, payload...)
			if fin {
				_ = fragOp
				return msg, nil
			}
		default:
			return nil, fmt.Errorf("unsupported opcode %#x", op)
		}
	}
}

func (c *wsConn) close() error {
	_ = c.writeFrame(opClose, nil)
	return c.conn.Close()
}
