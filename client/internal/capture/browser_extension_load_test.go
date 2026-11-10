package capture

import "testing"

func TestBlocksCommandLineExtensionLoad(t *testing.T) {
	cases := []struct {
		exe   string
		block bool
	}{
		{"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", true},
		{`C:\Program Files\Google\Chrome\Application\chrome.exe`, true},
		{"/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge", false},
		{`C:\Program Files\Microsoft\Edge\Application\msedge.exe`, false},
		{"/Applications/Chromium.app/Contents/MacOS/Chromium", false},
		{"/Applications/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing", false},
	}
	for _, c := range cases {
		got := blocksCommandLineExtensionLoad(c.exe)
		if got != c.block {
			t.Errorf("%q: got block=%v want %v", c.exe, got, c.block)
		}
	}
}
