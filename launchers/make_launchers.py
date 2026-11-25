"""Generate one self-contained launcher per app: an Android project (tap icon -> opens the URL)
and a Windows installer script (desktop + Start menu shortcut with the app's .ico).

python launchers/make_launchers.py <gradle-wrapper-dir>
Icons come from assets/icons/apps/out/<slug>/ (built by icon-forge). Change a URL here and re-run.
"""
import os, shutil, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ICONS = os.path.join(ROOT, "assets", "icons", "apps", "out")
# (folder, display name, icon-forge slug, Java package suffix, URL to open)
APPS = [
    ("gap-mining", "Gap-Mining", "gap_mining", "gapmining", "https://claude.ai/artifact/DbSJahY6U5KLtgZrkwEZTT"),
    ("war-room", "War Room", "war_room", "warroom", "https://claude.ai/artifact/2PzxFJ5oDQHpnNjUeC7rD2"),
    ("skill-tree", "Skill Tree", "skill_tree", "skilltree", "https://claude.ai/artifact/FdE6GAtPFz5Je6VLtAMAsZ"),
]

SETTINGS = """pluginManagement {{
    repositories {{ google(); mavenCentral(); gradlePluginPortal() }}
}}
dependencyResolutionManagement {{
    repositories {{ google(); mavenCentral() }}
}}
rootProject.name = "{name}"
include ':app'
"""
ROOT_BUILD = "plugins { id 'com.android.application' version '8.5.2' apply false }\n"
APP_BUILD = """plugins {{ id 'com.android.application' }}

android {{
    namespace '{pkg}'
    compileSdk 34
    defaultConfig {{
        applicationId '{pkg}'
        minSdk 26
        targetSdk 34
        versionCode 1
        versionName '1.0'
    }}
    compileOptions {{
        sourceCompatibility JavaVersion.VERSION_17
        targetCompatibility JavaVersion.VERSION_17
    }}
}}
"""
MANIFEST = """<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    <application
        android:label="@string/app_name"
        android:icon="@mipmap/ic_launcher"
        android:roundIcon="@mipmap/ic_launcher_round">
        <activity
            android:name=".OpenActivity"
            android:exported="true"
            android:excludeFromRecents="true"
            android:noHistory="true"
            android:theme="@android:style/Theme.Translucent.NoTitleBar">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>
"""
ACTIVITY = """package {pkg};

import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;

/** Opens the app's URL in the browser and gets out of the way. */
public class OpenActivity extends Activity {{
    @Override
    protected void onCreate(Bundle state) {{
        super.onCreate(state);
        startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse(getString(R.string.launch_url))));
        finish();
    }}
}}
"""
STRINGS = """<?xml version="1.0" encoding="utf-8"?>
<resources>
    <string name="app_name">{name}</string>
    <string name="launch_url" translatable="false">{url}</string>
</resources>
"""
# Edge --app gives the artifact its own window; falls back to a plain .url shortcut without Edge.
PS1 = r"""# Installs a "{name}" shortcut (Desktop + Start menu) with its own icon.
# Run: right-click > Run with PowerShell   (or: powershell -ExecutionPolicy Bypass -File Install-Shortcut.ps1)
$ErrorActionPreference = 'Stop'
$Name = '{name}'
$Url  = '{url}'
$Home_ = Join-Path $env:LOCALAPPDATA 'VibPulse\{folder}'
New-Item -ItemType Directory -Force -Path $Home_ | Out-Null
$Icon = Join-Path $Home_ 'app.ico'
Copy-Item -Force (Join-Path $PSScriptRoot 'app.ico') $Icon

$Edge = @("${{env:ProgramFiles(x86)}}\Microsoft\Edge\Application\msedge.exe",
          "$env:ProgramFiles\Microsoft\Edge\Application\msedge.exe") | Where-Object {{ Test-Path $_ }} | Select-Object -First 1
$Targets = @([Environment]::GetFolderPath('Desktop'), (Join-Path ([Environment]::GetFolderPath('Programs')) 'VibPulse'))
$Shell = New-Object -ComObject WScript.Shell
foreach ($Dir in $Targets) {{
    New-Item -ItemType Directory -Force -Path $Dir | Out-Null
    if ($Edge) {{
        $Lnk = $Shell.CreateShortcut((Join-Path $Dir "$Name.lnk"))
        $Lnk.TargetPath = $Edge
        $Lnk.Arguments = "--app=$Url"
        $Lnk.IconLocation = "$Icon,0"
        $Lnk.Description = $Name
        $Lnk.Save()
    }} else {{
        Set-Content -Encoding ASCII -Path (Join-Path $Dir "$Name.url") -Value @(
            '[InternetShortcut]', "URL=$Url", "IconFile=$Icon", 'IconIndex=0')
    }}
}}
Write-Host "$Name installed on the Desktop and in Start > VibPulse."
"""


def write(path, text):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8", newline="\n") as f:
        f.write(text)


def main(wrapper_dir):
    for folder, name, slug, suffix, url in APPS:
        src = os.path.join(ICONS, slug)
        out = os.path.join(ROOT, "launchers", folder)
        shutil.rmtree(out, ignore_errors=True)
        pkg = f"com.vibpulse.launcher.{suffix}"
        proj = os.path.join(out, "android")
        write(os.path.join(proj, "settings.gradle"), SETTINGS.format(name=name.replace(" ", "")))
        write(os.path.join(proj, "build.gradle"), ROOT_BUILD)
        write(os.path.join(proj, "gradle.properties"), "android.useAndroidX=false\norg.gradle.jvmargs=-Xmx2g\n")
        write(os.path.join(proj, "app", "build.gradle"), APP_BUILD.format(pkg=pkg))
        main_dir = os.path.join(proj, "app", "src", "main")
        write(os.path.join(main_dir, "AndroidManifest.xml"), MANIFEST)
        write(os.path.join(main_dir, "java", *pkg.split("."), "OpenActivity.java"), ACTIVITY.format(pkg=pkg))
        write(os.path.join(main_dir, "res", "values", "strings.xml"), STRINGS.format(name=name, url=url))
        shutil.copytree(os.path.join(src, "android", "res"), os.path.join(main_dir, "res"), dirs_exist_ok=True)
        for f in ("gradlew", "gradlew.bat", os.path.join("gradle", "wrapper")):
            s, d = os.path.join(wrapper_dir, f), os.path.join(proj, f)
            shutil.copytree(s, d) if os.path.isdir(s) else shutil.copy2(s, d)
        win = os.path.join(out, "windows")
        os.makedirs(win)
        shutil.copy2(os.path.join(src, "windows", "app.ico"), win)
        write(os.path.join(win, "Install-Shortcut.ps1"), PS1.format(name=name, url=url, folder=folder))
        # For launchers that let you pick a custom icon image (Nova, Lawnchair, etc.).
        shutil.copy2(os.path.join(src, "android", "play_store_512.png"), os.path.join(out, "icon-512.png"))
        print(f"{folder}: {pkg} -> {url}")


if __name__ == "__main__":
    main(sys.argv[1])
