# Build a debug APK using D: drive for Gradle cache and temp files (helps when C: is low on space).
$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path $PSScriptRoot -Parent
$AndroidDir = Join-Path $ProjectRoot "android"
$GradleHome = "D:\gradle-cache"
$TempDir = "D:\temp-build"
$SdkRoot = "D:\Android\Sdk"
$SdkManager = Join-Path $SdkRoot "cmdline-tools\latest\bin\sdkmanager.bat"

New-Item -ItemType Directory -Force -Path $GradleHome, $TempDir | Out-Null

$env:ANDROID_HOME = $SdkRoot
$env:ANDROID_SDK_ROOT = $SdkRoot
$env:GRADLE_USER_HOME = $GradleHome
$env:TEMP = $TempDir
$env:TMP = $TempDir

Set-Location $ProjectRoot
Write-Host "Building web app..."
npm run build

Write-Host "Syncing Capacitor Android..."
npx cap sync android

if (-not (Test-Path $SdkManager)) {
    Write-Error @"
Android SDK command-line tools not found at:
  $SdkManager

Install Android Studio SDK Manager or download commandlinetools-win from:
  https://developer.android.com/studio#command-line-tools-only

Extract to: $SdkRoot\cmdline-tools\latest\
"@
}

Write-Host "Accepting SDK licenses and installing required packages..."
$yes = ('y' + [Environment]::NewLine) * 100
$yes | & $SdkManager --licenses | Out-Null
& $SdkManager "platforms;android-35" "build-tools;34.0.0" "platform-tools"

$localProps = Join-Path $AndroidDir "local.properties"
"sdk.dir=$($SdkRoot -replace '\\','\\')" | Set-Content -Path $localProps -Encoding ASCII

Write-Host "Building debug APK..."
Set-Location $AndroidDir
& .\gradlew.bat assembleDebug --no-daemon

$Apk = Join-Path $AndroidDir "app\build\outputs\apk\debug\app-debug.apk"
if (-not (Test-Path $Apk)) {
    Write-Error "APK was not produced at $Apk"
}

$OutApk = Join-Path $ProjectRoot "Theta-AI-debug.apk"
Copy-Item $Apk $OutApk -Force
Write-Host ""
Write-Host "APK ready:"
Write-Host "  $OutApk"
Write-Host "  $Apk"
