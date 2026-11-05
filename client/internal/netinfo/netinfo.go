// Package netinfo picks the LAN address the platform is reached on.
package netinfo

import (
	"net"
	"strconv"
	"strings"
)

var virtualHints = []string{
	"vmware", "virtualbox", "vethernet", "hyper-v", "docker", "wsl",
	"loopback", "bluetooth", "tap", "tun", "vpn", "zerotier", "tailscale",
}

type candidate struct {
	name string
	ip   net.IP
}

// pick prefers a physical WLAN/Ethernet adapter carrying a private IPv4 over
// virtual adapters (VMnet8, Hyper-V, Docker) or loopback.
func pick(candidates []candidate) string {
	best := ""
	bestScore := -1
	for _, c := range candidates {
		ip := c.ip.To4()
		if ip == nil || ip.IsLoopback() || ip.IsLinkLocalUnicast() {
			continue
		}
		name := strings.ToLower(c.name)
		virtual := false
		for _, hint := range virtualHints {
			if strings.Contains(name, hint) {
				virtual = true
				break
			}
		}
		if virtual {
			continue
		}
		score := 0
		switch {
		case strings.Contains(name, "wlan"), strings.Contains(name, "wi-fi"), strings.Contains(name, "wifi"):
			score += 30
		case strings.Contains(name, "ethernet"), strings.Contains(name, "以太网"), strings.Contains(name, "eth"):
			score += 20
		}
		if ip[0] == 10 {
			score += 6
		} else if ip[0] == 192 && ip[1] == 168 {
			score += 4
		} else if ip[0] == 172 && ip[1] >= 16 && ip[1] <= 31 {
			score += 3
		} else {
			continue // public address: not what the LAN client should bind to
		}
		if score > bestScore {
			bestScore = score
			best = ip.String()
		}
	}
	return best
}

// PrimaryIPv4 returns the best LAN IPv4 address, or "" when none qualifies.
func PrimaryIPv4() string {
	ifaces, err := net.Interfaces()
	if err != nil {
		return ""
	}
	var candidates []candidate
	for _, iface := range ifaces {
		if iface.Flags&net.FlagUp == 0 || iface.Flags&net.FlagLoopback != 0 {
			continue
		}
		addrs, err := iface.Addrs()
		if err != nil {
			continue
		}
		for _, addr := range addrs {
			ipNet, ok := addr.(*net.IPNet)
			if !ok {
				continue
			}
			candidates = append(candidates, candidate{name: iface.Name, ip: ipNet.IP})
		}
	}
	return pick(candidates)
}

// BaseURL builds http://<lan-ip>:<port>, falling back to loopback.
func BaseURL(port int) string {
	ip := PrimaryIPv4()
	if ip == "" {
		return "http://127.0.0.1:8000"
	}
	return "http://" + net.JoinHostPort(ip, strconv.Itoa(port))
}
