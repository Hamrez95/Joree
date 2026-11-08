param([switch]$SkipFrontend)
$ErrorActionPreference='Stop'
$projectRoot=Split-Path $PSScriptRoot -Parent
Push-Location $projectRoot
try {
    $version=([xml](Get-Content -LiteralPath 'windows/Directory.Build.props' -Raw)).Project.PropertyGroup.Version
    if(-not $SkipFrontend){ & npm.cmd run check; if($LASTEXITCODE -ne 0){throw 'Frontend check failed'}; & npm.cmd run build; if($LASTEXITCODE -ne 0){throw 'Frontend build failed'} }
    $releaseRoot=Join-Path $projectRoot 'release'
    $appOutput=Join-Path $releaseRoot "app-$version"
    New-Item -ItemType Directory -Force $releaseRoot | Out-Null
    & dotnet restore windows/Joree.Desktop/Joree.Desktop.csproj --locked-mode --ignore-failed-sources
    if($LASTEXITCODE -ne 0){throw 'Desktop dependency restore failed'}
    & dotnet publish windows/Joree.Desktop/Joree.Desktop.csproj -c Release --no-restore -p:OutputPath="$releaseRoot\build\" -o $appOutput
    if($LASTEXITCODE -ne 0){throw 'Desktop build failed'}
    $manifest=[ordered]@{}
    Get-ChildItem -LiteralPath $appOutput -File -Recurse | Where-Object {$_.Name -ne 'package-manifest.json' -and $_.Extension -notin @('.pdb','.xml')} | ForEach-Object {
        $relative=[IO.Path]::GetRelativePath($appOutput,$_.FullName).Replace('\','/')
        $manifest[$relative]=(Get-FileHash -LiteralPath $_.FullName -Algorithm SHA256).Hash
    }
    $manifest | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $appOutput 'package-manifest.json') -Encoding utf8NoBOM
    $archive=Join-Path $releaseRoot "Joree-$version-win-x64.zip"
    if(Test-Path -LiteralPath $archive){Remove-Item -LiteralPath $archive}
    Add-Type -AssemblyName System.IO.Compression
    $zip=[IO.Compression.ZipFile]::Open($archive,[IO.Compression.ZipArchiveMode]::Create)
    try {
        @($manifest.Keys)+@('package-manifest.json') | ForEach-Object { [IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip,(Join-Path $appOutput $_),$_,[IO.Compression.CompressionLevel]::Optimal) | Out-Null }
    } finally { $zip.Dispose() }
    & dotnet publish windows/Joree.Setup/Joree.Setup.csproj -c Release -o (Join-Path $releaseRoot 'installer') --ignore-failed-sources
    if($LASTEXITCODE -ne 0){throw 'Installer build failed'}
    Copy-Item -LiteralPath (Join-Path $releaseRoot 'installer\JoreeSetup.exe') -Destination (Join-Path $releaseRoot 'JoreeSetup.exe') -Force
    Copy-Item -LiteralPath 'examples/template-fa.md' -Destination (Join-Path $releaseRoot 'Joree-lesson-template.md') -Force
    Copy-Item -LiteralPath 'docs/installation.md' -Destination (Join-Path $releaseRoot 'INSTALL.md') -Force
    $downloads=@('JoreeSetup.exe',"Joree-$version-win-x64.zip",'Joree-lesson-template.md','INSTALL.md')
    $checksums=foreach($download in $downloads){$hash=Get-FileHash -LiteralPath (Join-Path $releaseRoot $download) -Algorithm SHA256;"$($hash.Hash.ToLowerInvariant())  $download"}
    $checksums | Set-Content -LiteralPath (Join-Path $releaseRoot 'SHA256SUMS.txt') -Encoding ascii
    Get-FileHash -LiteralPath (Join-Path $releaseRoot 'JoreeSetup.exe'),$archive -Algorithm SHA256 | Format-Table -AutoSize
} finally { Pop-Location }
