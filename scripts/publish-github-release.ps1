param([string]$Repository='Hamrez95/Joree',[switch]$Publish,[switch]$UpdateRepository)
$ErrorActionPreference='Stop'
if($Repository -notmatch '^[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+$'){throw 'Use owner/repository format'}
$projectRoot=Split-Path $PSScriptRoot -Parent
$version=([xml](Get-Content -LiteralPath (Join-Path $projectRoot 'windows/Directory.Build.props') -Raw)).Project.PropertyGroup.Version
$tag="v$version"
$releaseRoot=Join-Path $projectRoot 'release'
$files=@('JoreeSetup.exe',"Joree-$version-win-x64.zip",'Joree-lesson-template.md','INSTALL.md','SHA256SUMS.txt')
foreach($file in $files){if(-not(Test-Path -LiteralPath (Join-Path $releaseRoot $file))){throw "Build the package first; missing $file"}}

# Read the already-authorized Git credential into memory; never print or persist the token.
$owner=$Repository.Split('/')[0]
$credentialLines="protocol=https`nhost=github.com`nusername=$owner`n`n" | git -c credential.interactive=never credential fill
if($LASTEXITCODE -ne 0){throw 'GitHub Git credentials are unavailable'}
$credential=@{}
foreach($line in $credentialLines){$separator=$line.IndexOf('=');if($separator -ge 0){$credential[$line.Substring(0,$separator)]=$line.Substring($separator+1)}}
if(-not $credential['password']){throw 'GitHub credential did not contain a token'}
$headers=@{Authorization="Bearer $($credential['password'])";Accept='application/vnd.github+json';'X-GitHub-Api-Version'='2022-11-28';'User-Agent'='Joree-release'}
$api="https://api.github.com/repos/$Repository"
try {
    if($UpdateRepository){
        $metadata=@{description='A cozy Persian-first flashcard console for Windows. Markdown in, tiny lessons out. Plus a well-earned Snake break.';homepage="https://github.com/$Repository#readme";has_issues=$true} | ConvertTo-Json
        Invoke-RestMethod -Uri $api -Method Patch -Headers $headers -ContentType 'application/json' -Body $metadata | Out-Null
        $topics=@{names=@('flashcards','spaced-repetition','windows','desktop-app','persian','rtl','svelte','typescript','webview2','dotnet','markdown','offline-first','retro-games')} | ConvertTo-Json
        Invoke-RestMethod -Uri "$api/topics" -Method Put -Headers $headers -ContentType 'application/json' -Body $topics | Out-Null
    }
    $release=$null
    try {$release=Invoke-RestMethod -Uri "$api/releases/tags/$tag" -Headers $headers}
    catch {if([int]$_.Exception.Response.StatusCode -ne 404){throw}}
    # Drafts aren't returned by the tag endpoint in every API context; inspect the release list too.
    if(-not $release){$release=Invoke-RestMethod -Uri "$api/releases" -Headers $headers | Where-Object tag_name -eq $tag | Select-Object -First 1}
    if(-not $release){
        $commit=git -C $projectRoot rev-parse HEAD
        $notes=Get-Content -LiteralPath (Join-Path $projectRoot "docs/releases/$tag.md") -Raw
        $body=@{tag_name=$tag;target_commitish=$commit;name="Joree $tag - Your first little sip";body=$notes;draft=$true;prerelease=$false} | ConvertTo-Json -Depth 5
        $release=Invoke-RestMethod -Uri "$api/releases" -Method Post -Headers $headers -ContentType 'application/json' -Body $body
    }
    foreach($file in $files){
        $path=Join-Path $releaseRoot $file
        $existing=$release.assets | Where-Object name -eq $file | Select-Object -First 1
        if($existing){
            $digest='sha256:'+(Get-FileHash -LiteralPath $path -Algorithm SHA256).Hash.ToLowerInvariant()
            if($existing.digest -ne $digest){throw "Release already has a different $file; refusing to overwrite it"}
            continue
        }
        $upload=$release.upload_url -replace '\{.*$',''
        if(([uri]$upload).Host -ne 'uploads.github.com'){throw 'Unexpected release upload host'}
        $upload+='?name='+[Uri]::EscapeDataString($file)
        try {Invoke-RestMethod -Uri $upload -Method Post -Headers $headers -ContentType 'application/octet-stream' -InFile $path | Out-Null}
        catch {throw "GitHub asset upload failed for $file. If your network blocks uploads.github.com, use the repository's Publish verified Windows release workflow to publish GitHub-built artifacts instead."}
    }
    $release=Invoke-RestMethod -Uri "$api/releases/$($release.id)" -Headers $headers
    foreach($file in $files){if(-not($release.assets | Where-Object {$_.name -eq $file -and $_.state -eq 'uploaded'})){throw "Release upload not complete: $file"}}
    if($Publish -and $release.draft){
        $release=Invoke-RestMethod -Uri "$api/releases/$($release.id)" -Method Patch -Headers $headers -ContentType 'application/json' -Body (@{draft=$false;make_latest='true'} | ConvertTo-Json)
    }
    [pscustomobject]@{tag=$release.tag_name;url=$release.html_url;draft=$release.draft;assets=@($release.assets | Select-Object name,browser_download_url,size)} | ConvertTo-Json -Depth 5
} finally {$headers.Clear();$credential.Clear();$credentialLines=$null}
