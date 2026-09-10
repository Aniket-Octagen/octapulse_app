$ErrorActionPreference = 'Continue'
$Log = 'D:\temp-build\finish-apk.log'
function Log($m) { "$(Get-Date -Format o) $m" | Tee-Object -FilePath $Log -Append }

Log 'START'
$ProjectRoot = 'd:\Aniket\My WorkSpace\Professional\Projects\Aplia - AI Projects\pmo-app'
$AndroidDir = Join-Path $ProjectRoot 'android'
$GradleHome = 'D:\gradle-cache'
$TempDir = 'D:\temp-build'
$SdkRoot = 'D:\Android\Sdk'
$JdkHome = 'D:\jdk-21'
$ExtractedTools = 'D:\temp-build\android-sdk-setup\extracted\cmdline-tools'
$DestTools = Join-Path $SdkRoot 'cmdline-tools\latest'

New-Item -ItemType Directory -Force -Path $GradleHome, $TempDir, $SdkRoot | Out-Null

$env:ANDROID_HOME = $SdkRoot
$env:ANDROID_SDK_ROOT = $SdkRoot
$env:JAVA_HOME = $JdkHome
$env:PATH = "$JdkHome\bin;$env:PATH"
$env:GRADLE_USER_HOME = $GradleHome
$env:TEMP = $TempDir
$env:TMP = $TempDir

if (-not (Test-Path (Join-Path $ExtractedTools 'bin\sdkmanager.bat'))) {
    $zip = 'D:\temp-build\android-sdk-setup\cmdline-tools.zip'
    if (-not (Test-Path $zip) -or (Get-Item $zip).Length -lt 140000000) {
        Log 'DOWNLOAD_CMDLINE_TOOLS'
        New-Item -ItemType Directory -Force -Path 'D:\temp-build\android-sdk-setup' | Out-Null
        & curl.exe -L --retry 5 --retry-delay 3 -o $zip 'https://dl.google.com/android/repository/commandlinetools-win-11076708_latest.zip'
    }
    $extractRoot = 'D:\temp-build\android-sdk-setup\extracted'
    if (Test-Path $extractRoot) { Remove-Item $extractRoot -Recurse -Force }
    Expand-Archive -Path $zip -DestinationPath $extractRoot -Force
    $bin = Get-ChildItem $extractRoot -Recurse -Filter sdkmanager.bat | Select-Object -First 1
    if (-not $bin) { throw 'sdkmanager.bat not found after extract' }
    $ExtractedTools = $bin.Directory.Parent.FullName
}

$CmdlineToolsRoot = Join-Path $SdkRoot 'cmdline-tools'
if (Test-Path $CmdlineToolsRoot) { Remove-Item $CmdlineToolsRoot -Recurse -Force }
New-Item -ItemType Directory -Force -Path $DestTools | Out-Null
Copy-Item -Path (Join-Path $ExtractedTools '*') -Destination $DestTools -Recurse -Force
Log "CMDLINE_TOOLS=$DestTools"

$SdkManager = Join-Path $DestTools 'bin\sdkmanager.bat'
$yes = ('y' + [Environment]::NewLine) * 100
cmd /c "(for /l %i in (1,1,100) do @echo y) | `"$SdkManager`" --licenses" 2>&1 | Out-File (Join-Path $TempDir 'sdk-licenses.log') -Append
Log 'LICENSES_DONE'
cmd /c "`"$SdkManager`" `"platforms;android-35`" `"build-tools;34.0.0`" platform-tools" 2>&1 | Out-File (Join-Path $TempDir 'sdk-install.log') -Append
if ($LASTEXITCODE -ne 0) { throw "sdkmanager install failed with exit code $LASTEXITCODE" }
Log 'PACKAGES_DONE'

$localProps = Join-Path $AndroidDir 'local.properties'
"sdk.dir=$($SdkRoot -replace '\\','\\')" | Set-Content -Path $localProps -Encoding ASCII
Log "LOCAL_PROPERTIES=$localProps"

Set-Location $AndroidDir
cmd /c "set GRADLE_USER_HOME=$GradleHome&& set TEMP=$TempDir&& set TMP=$TempDir&& set ANDROID_HOME=$SdkRoot&& gradlew.bat assembleDebug --no-daemon" 2>&1 | Tee-Object -FilePath (Join-Path $TempDir 'gradle-build.log')
if ($LASTEXITCODE -ne 0) { throw "Gradle failed with exit code $LASTEXITCODE" }
Log 'GRADLE_DONE'

$ApkSrc = Join-Path $AndroidDir 'app\build\outputs\apk\debug\app-debug.apk'
$ApkDst = Join-Path $ProjectRoot 'Theta-AI-debug.apk'
if (-not (Test-Path $ApkSrc)) { throw "APK missing at $ApkSrc" }
Copy-Item $ApkSrc $ApkDst -Force
$info = Get-Item $ApkDst
Log "APK_PATH=$($info.FullName)"
Log "APK_SIZE=$($info.Length)"
Log 'SUCCESS'
