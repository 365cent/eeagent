// Package httpx builds shared outbound HTTP clients for the capture client.
package httpx

import (
	"context"
	"crypto/tls"
	"crypto/x509"
	"net"
	"net/http"
	"os"
	"strings"
	"time"

	"eea/capture/internal/netinfo"
)

const defaultRequestTimeout = 15 * time.Minute

// ClientOptions configures TLS roots and LAN bind for API uploads.
type ClientOptions struct {
	BindIP     string
	CACertPath string
}

// PrimaryClient returns the LAN-bound client used for platform API uploads.
// When bindIP is empty, connections use the default local route.
func PrimaryClient(bindIP string) *http.Client {
	return PrimaryClientWithOptions(ClientOptions{BindIP: bindIP})
}

// PrimaryClientWithOptions builds a client with optional enterprise CA PEM.
func PrimaryClientWithOptions(opts ClientOptions) *http.Client {
	bindIP := opts.BindIP
	if bindIP == "" {
		bindIP = netinfo.PrimaryIPv4()
	}
	dialer := func(ctx context.Context, network, addr string) (net.Conn, error) {
		host, _, err := net.SplitHostPort(addr)
		if err != nil {
			host = addr
		}
		if bindIP != "" && !isLoopbackHost(host) {
			local := &net.Dialer{
				Timeout:   30 * time.Second,
				LocalAddr: &net.TCPAddr{IP: net.ParseIP(bindIP)},
			}
			return local.DialContext(ctx, network, addr)
		}
		return (&net.Dialer{Timeout: 30 * time.Second}).DialContext(ctx, network, addr)
	}
	transport := &http.Transport{
		Proxy:               http.ProxyFromEnvironment,
		DialContext:         dialer,
		MaxIdleConnsPerHost: 4,
		IdleConnTimeout:     90 * time.Second,
	}
	if strings.TrimSpace(opts.CACertPath) != "" {
		pool, err := x509.SystemCertPool()
		if err != nil || pool == nil {
			pool = x509.NewCertPool()
		}
		pem, err := os.ReadFile(opts.CACertPath)
		if err != nil {
			panic("httpx: read ca_cert_path: " + err.Error())
		}
		if !pool.AppendCertsFromPEM(pem) {
			panic("httpx: ca_cert_path did not contain a PEM certificate")
		}
		transport.TLSClientConfig = &tls.Config{RootCAs: pool, MinVersion: tls.VersionTLS12}
	}
	return &http.Client{Transport: transport, Timeout: defaultRequestTimeout}
}

// OutboundClient returns a plain http.Client for external URLs (no LAN bind).
// Use explicit timeouts for devtools probes, extension downloads, and bulk fetches.
func OutboundClient(timeout time.Duration) *http.Client {
	return &http.Client{
		Transport: &http.Transport{Proxy: http.ProxyFromEnvironment},
		Timeout:   timeout,
	}
}

func isLoopbackHost(host string) bool {
	if strings.EqualFold(host, "localhost") {
		return true
	}
	ip := net.ParseIP(host)
	return ip != nil && ip.IsLoopback()
}
