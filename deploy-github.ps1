# Publish jesus-life to GitHub Pages (run after: gh auth login)
$ErrorActionPreference = 'Stop'
$gh = 'C:\Program Files\GitHub CLI\gh.exe'
$repo = 'jesus-life'

& $gh auth status | Out-Null
if ($LASTEXITCODE -ne 0) {
  Write-Host 'Not logged in. Run: gh auth login' -ForegroundColor Red
  exit 1
}

Set-Location $PSScriptRoot

$remotes = git remote 2>$null
if ($remotes -notcontains 'origin') {
  $user = (& $gh api user -q .login)
  & $gh repo create $repo --public --source=. --remote=origin --description 'Interactive journey through the life of Jesus in the Holy Land'
  git push -u origin main
} else {
  git push -u origin main
}

& $gh api --method PUT "repos/{owner}/$repo/pages" -f build_type=workflow | Out-Null

$user = (& $gh api user -q .login)
$url = "https://$user.github.io/$repo/"
Write-Host ""
Write-Host "Deployed! GitHub Actions is building your site." -ForegroundColor Green
Write-Host "Live URL (1-2 min): $url" -ForegroundColor Cyan
Write-Host "Track progress: https://github.com/$user/$repo/actions" -ForegroundColor Gray