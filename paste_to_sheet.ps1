Add-Type @"
    using System;
    using System.Runtime.InteropServices;
    public class Win32 {
        [DllImport("user32.dll")]
        [return: MarshalAs(UnmanagedType.Bool)]
        public static extern bool SetForegroundWindow(IntPtr hWnd);
        [DllImport("user32.dll")]
        public static extern IntPtr GetForegroundWindow();
    }
"@

$data = Get-Content -Raw "e:\wab\StyleSense\clean_remaining.tsv"
Set-Clipboard -Value $data

$chrome = Get-Process chrome | Where-Object { $_.MainWindowTitle -match "Google Sheets" -or $_.MainWindowTitle -match "produts" } | Select-Object -First 1

if ($chrome) {
    Write-Host "Found Chrome Window: " $chrome.MainWindowTitle
    [Win32]::SetForegroundWindow($chrome.MainWindowHandle)
    Start-Sleep -Seconds 1
    Add-Type -AssemblyName System.Windows.Forms
    [System.Windows.Forms.SendKeys]::SendWait("^v")
    Write-Host "Pasted!"
} else {
    Write-Host "Could not find Google Sheets window."
}
