// Package httpx builds shared outbound HTTP clients for the capture client.
package httpx

import (
	"context"
	"net"
	"net/http"
	"strings"
	"time"

	"eea/capture/internal/netinfo"
)

const defaultRequestTimeout = 15 * time.Minute

// PrimaryClient returns the LAN-bound client used for platform API uploads.
// When bindIP is empty, connections use the default local route.
func PrimaryClient(bindIP string) *http.Client {
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
