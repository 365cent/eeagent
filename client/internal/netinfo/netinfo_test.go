package netinfo

import (
	"net"
	"testing"
)

func TestPickSkipsVirtualAdapters(t *testing.T) {
	got := pick([]candidate{
		{name: "VMware Network Adapter VMnet8", ip: net.ParseIP("192.168.184.1")},
		{name: "WLAN", ip: net.ParseIP("10.215.8.74")},
		{name: "Loopback Pseudo-Interface 1", ip: net.ParseIP("127.0.0.1")},
	})
	if got != "10.215.8.74" {
		t.Fatalf("pick = %q", got)
	}
}

func TestPickPrefersPhysicalOverVirtual(t *testing.T) {
	got := pick([]candidate{
		{name: "Hyper-V Virtual Ethernet Adapter", ip: net.ParseIP("172.20.1.5")},
		{name: "以太网", ip: net.ParseIP("192.168.1.20")},
	})
	if got != "192.168.1.20" {
		t.Fatalf("pick = %q", got)
	}
}

func TestPickRejectsPublicOnly(t *testing.T) {
	if got := pick([]candidate{{name: "Ethernet", ip: net.ParseIP("8.8.8.8")}}); got != "" {
		t.Fatalf("pick = %q, want empty", got)
	}
}

func TestPickPrefersWLAN(t *testing.T) {
	got := pick([]candidate{
		{name: "Ethernet", ip: net.ParseIP("10.0.0.5")},
		{name: "WLAN", ip: net.ParseIP("10.215.8.74")},
	})
	if got != "10.215.8.74" {
		t.Fatalf("pick = %q", got)
	}
}
