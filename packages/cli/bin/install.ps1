#!/usr/bin/env pwsh

# Stop executing script on any error
$ErrorActionPreference = 'Stop'
# Do not show download progress
$ProgressPreference = 'SilentlyContinue'

# Taken from https://stackoverflow.com/a/34559554/6537420
# create a temporary directory
function New-TemporaryDirectory {
  # get the path of the current user's temporary folder
  $parent = [System.IO.Path]::GetTempPath()
  # create a new GUID 
  [string] $name = [System.Guid]::NewGuid()
  # create a new directory in the temporary folder with the GUID as its name
  New-Item -ItemType Directory -Path (Join-Path $parent $name)
}

# current client platform
$platform = $null
# current client architecture
$architecture = $null
$cliName = $null

# PowerShell versions before 6.* were only for Windows OS
if ($PSVersionTable.PSVersion.Major -eq 5) {
  $platform = 'win'
}

if ($PSVersionTable.PSVersion.Major -ge 6) {
  if ($PSVersionTable.Platform -eq 'Unix') {
    if ($PSVersionTable.OS -like 'Darwin*') {
      $platform = 'macos'
    }

    if ($PSVersionTable.OS -like 'Linux*') {
      $platform = 'linux'
    }

    # PowerShell does not seem to have normal cmdlets for retrieving system information, so we use UNAME(1) for this.
    $arch = uname -m
    switch -Wildcard ($arch) {
      'x86_64' { $architecture = 'x64'; Break }
      'amd64' { $architecture = 'x64'; Break }
      'armv*' { $architecture = 'arm'; Break }
      'arm64' { $architecture = 'arm64'; Break }
      'aarch64' { $architecture = 'arm64'; Break }
    }

    # 'uname -m' in some cases mis-reports 32-bit OS as 64-bit, so double check
    if ([System.Environment]::Is64BitOperatingSystem -eq $false) {
      if ($architecture -eq 'x64') {
        $architecture = 'i686'
      }

      if ($architecture -eq 'arm64') {
        $architecture = 'arm'
      }
    }

    $cliName = "quickly-dev-cli"
  }

  if ($PSVersionTable.Platform -eq 'Win32NT') {
    $platform = 'win'
  }
}

if ($platform -eq 'win') {
  if ([System.Environment]::Is64BitOperatingSystem -eq $true) {
    $architecture = 'x64'
  }

  if ([System.Environment]::Is64BitOperatingSystem -eq $false) {
    $architecture = 'i686'
  }

  $cliName = "quickly-dev-cil.exe"
}

if ($null -eq $platform) {
  Write-Error "Platform could not be determined! Only Windows, Linux and MacOS are supported."
}

switch ($architecture) {
  'x64' { ; Break }
  'arm64' { ; Break }
  Default {
    Write-Error "Sorry! pnpm currently only provides pre-built binaries for x86_64/arm64 architectures."
  }
}

[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

$pkgInfo = Invoke-WebRequest "https://registry.npmjs.org/@amihhs/quickly-dev-cli" -UseBasicParsing
$versionJson = $pkgInfo.Content | ConvertFrom-Json
$versions = Get-Member -InputObject $versionJson.versions -Type NoteProperty | Select-Object -ExpandProperty Name
$distTags = Get-Member -InputObject $versionJson.'dist-tags' -Type NoteProperty | Select-Object -ExpandProperty Name

$version = $null
$preferredVersion = "latest"

# env VERSION=<version> will override the default version
if ($null -ne $env:VERSION -and $env:VERSION -ne "") {
  $preferredVersion = $env:VERSION
}

if ($null -eq $version -and $preferredVersion -in $distTags) {
  $version = $versionJson.'dist-tags' | Select-Object -ExpandProperty $preferredVersion
}

if ($null -eq $version -and $preferredVersion -in $versions) {
  $version = $preferredVersion
}

# if version is still null, then the preferred version is not found
if ($null -eq $version) {
  Write-Host "Current tags:" -ForegroundColor Yellow -NoNewline
  $versionJson.'dist-tags' | Format-List

  Write-Host "Versions:" -ForegroundColor Yellow -NoNewline
  $versionJson.versions | Get-Member -Type NoteProperty | Format-Wide -Property Name -AutoSize

  Write-Error "Sorry! quickly-dev-cli '$preferredVersion' version could not be found. Use one of the tags or published versions from the provided list"
}

Write-Host "Downloading pnpm from GitHub...`n" -ForegroundColor Green

# create a temporary directory
$tempFileFolder = New-TemporaryDirectory

$tempFile = (Join-Path $tempFileFolder.FullName $cliName)
$archiveUrl="https://github.com/amihhs/quickly-dev-cli/releases/download/v$version/qdev-$platform-$architecture"
if ($platform -eq 'win') {
  $archiveUrl="$archiveUrl.exe"
}

Invoke-WebRequest $archiveUrl -OutFile $tempFile -UseBasicParsing
Write-Host "Running setup...`n" -ForegroundColor Green
if ($platform -ne 'win') {
  chmod +x $tempFile
}

Start-Process -FilePath $tempFile -ArgumentList "setup" -NoNewWindow -Wait -ErrorAction Continue

Remove-Item $tempFile
Remove-Item $tempFileFolder -Recurse