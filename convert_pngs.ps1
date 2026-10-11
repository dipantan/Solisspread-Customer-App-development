Add-Type -AssemblyName System.Drawing
$assets = Get-ChildItem -Path "assets" -Filter "*.png"
foreach ($file in $assets) {
    $bytes = [System.IO.File]::ReadAllBytes($file.FullName)
    if ($bytes[0] -eq 0xFF -and $bytes[1] -eq 0xD8) {
        Write-Host "Converting $($file.Name) to true PNG"
        $img = [System.Drawing.Image]::FromFile($file.FullName)
        $tempPath = $file.FullName + ".tmp.png"
        $img.Save($tempPath, [System.Drawing.Imaging.ImageFormat]::Png)
        $img.Dispose()
        Remove-Item $file.FullName
        Rename-Item $tempPath $file.Name
    }
}
