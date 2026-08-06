param(
  [Parameter(Mandatory = $true)][string]$BackgroundPath,
  [Parameter(Mandatory = $true)][string]$QrPath,
  [Parameter(Mandatory = $true)][string]$OutputPath
)

Add-Type -AssemblyName System.Drawing

$background = [System.Drawing.Bitmap]::FromFile($BackgroundPath)
$qr = [System.Drawing.Bitmap]::FromFile($QrPath)
$canvas = New-Object System.Drawing.Bitmap($background.Width, $background.Height, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$graphics = [System.Drawing.Graphics]::FromImage($canvas)

try {
  $graphics.DrawImageUnscaled($background, 0, 0)
  $graphics.CompositingMode = [System.Drawing.Drawing2D.CompositingMode]::SourceOver
  $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
  $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality

  # The transparent QR margins align its white tile with the generated placement panel.
  $target = New-Object System.Drawing.Rectangle(816, 836, 274, 274)
  $graphics.DrawImage($qr, $target)

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
