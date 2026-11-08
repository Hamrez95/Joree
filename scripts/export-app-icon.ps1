# Run with Windows PowerShell 5.1. Exports sizes without changing the generated logo.
$ErrorActionPreference='Stop'
Add-Type -AssemblyName System.Drawing
$projectRoot=Split-Path $PSScriptRoot -Parent
$source=New-Object System.Drawing.Bitmap((Join-Path $projectRoot 'public\assets\joree-app-icon.png'))
$iconFolder=Join-Path $projectRoot 'src-tauri\icons'
New-Item -ItemType Directory -Force $iconFolder | Out-Null
$frames=New-Object 'System.Collections.Generic.List[byte[]]'
$sizes=@(16,24,32,48,64,128,256)
try {
    foreach($size in $sizes) {
        $frame=New-Object System.Drawing.Bitmap($size,$size,[System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
        $graphics=[System.Drawing.Graphics]::FromImage($frame)
        try {
            $graphics.Clear([System.Drawing.Color]::Transparent)
            $graphics.CompositingMode=[System.Drawing.Drawing2D.CompositingMode]::SourceCopy
            $graphics.InterpolationMode=[System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
            $graphics.PixelOffsetMode=[System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
            $graphics.DrawImage($source,0,0,$size,$size)
            $stream=New-Object System.IO.MemoryStream
            try { $frame.Save($stream,[System.Drawing.Imaging.ImageFormat]::Png); $frames.Add($stream.ToArray()) } finally { $stream.Dispose() }
            if($size -eq 256){ $frame.Save((Join-Path $iconFolder 'icon.png'),[System.Drawing.Imaging.ImageFormat]::Png) }
        } finally { $graphics.Dispose(); $frame.Dispose() }
    }
    $file=[System.IO.File]::Create((Join-Path $iconFolder 'icon.ico'))
    $writer=New-Object System.IO.BinaryWriter($file)
    try {
        $writer.Write([uint16]0);$writer.Write([uint16]1);$writer.Write([uint16]$sizes.Count)
        $offset=6+16*$sizes.Count
        for($i=0;$i -lt $sizes.Count;$i++) {
            $dimension=if($sizes[$i] -eq 256){0}else{$sizes[$i]}
            $writer.Write([byte]$dimension);$writer.Write([byte]$dimension);$writer.Write([byte]0);$writer.Write([byte]0)
            $writer.Write([uint16]1);$writer.Write([uint16]32);$writer.Write([uint32]$frames[$i].Length);$writer.Write([uint32]$offset)
            $offset+=$frames[$i].Length
        }
        foreach($frame in $frames){$writer.Write([byte[]]$frame)}
    } finally { $writer.Dispose(); $file.Dispose() }
} finally { $source.Dispose() }
