param(
  [Parameter(Mandatory = $true)][string]$BackgroundPath,
  [Parameter(Mandatory = $true)][string]$QrPath,
  [Parameter(Mandatory = $true)][string]$OutputPath
)

Add-Type -AssemblyName System.Drawing

$background = [System.Drawing.Bitmap]::FromFile($BackgroundPath)
$qr = [System.Drawing.Bitmap]::FromFile($QrPath)
$canvas = New-Object System.Drawing.Bitmap(1080, 1920, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$graphics = [System.Drawing.Graphics]::FromImage($canvas)

try {
  $graphics.CompositingMode = [System.Drawing.Drawing2D.CompositingMode]::SourceOver
  $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
  $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
  $graphics.DrawImage($background, 0, 0, 1080, 1920)

  # Transparent source margins align the QR's white tile with the reserved panel.
  $qrTarget = New-Object System.Drawing.Rectangle(351, 1316, 378, 378)
  $graphics.DrawImage($qr, $qrTarget)

  $outputDirectory = Split-Path -Parent $OutputPath
  New-Item -ItemType Directory -Force -Path $outputDirectory | Out-Null
  $canvas.Save($OutputPath, [System.Drawing.Imaging.ImageFormat]::Png)
}
finally {
  $graphics.Dispose()
  $canvas.Dispose()
  $qr.Dispose()
  $background.Dispose()
}
