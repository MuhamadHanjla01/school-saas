New-Item -ItemType Directory -Force -Path C:\src
git clone https://github.com/flutter/flutter.git -b stable C:\src\flutter
$oldPath = [Environment]::GetEnvironmentVariable('Path', 'User')
if ($oldPath -notlike '*C:\src\flutter\bin*') {
    [Environment]::SetEnvironmentVariable('Path', "$oldPath;C:\src\flutter\bin", 'User')
    Write-Host "Flutter added to User PATH!"
} else {
    Write-Host "Flutter is already in User PATH."
}
