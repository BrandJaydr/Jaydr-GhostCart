# One-shot repair: copy every node_modules package missing inside the container
$ErrorActionPreference = 'Continue'
$ws = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)

# --- 1. Container inventory (top-level + scoped children, lines like "@scope/pkg") ---
$contRaw = docker exec ghostcart_app sh -c 'cd /app/node_modules && ls -1 && for s in @*/; do for p in $s*; do echo "$p"; done; done' 2>$null
$contSet = @{}
foreach ($line in ($contRaw | Out-String).Split("`n")) {
  $t = $line.Trim()
  if ($t -match '^[@a-zA-Z0-9][a-zA-Z0-9._\-/]*$') { $contSet[$t] = $true }
}

# --- 2. Host inventory ---
$hostMap = @{}
Get-ChildItem -Directory (Join-Path $ws 'node_modules') | ForEach-Object {
  if ($_.Name.StartsWith('@')) {
    Get-ChildItem -Directory $_.FullName | ForEach-Object { $hostMap["$($_.Parent.Name)/$($_.Name)"] = $_.FullName }
  } else { $hostMap[$_.Name] = $_.FullName }
}

# --- 3. Diff ---
$missing = @($hostMap.Keys | Where-Object { -not $contSet.ContainsKey($_) } | Sort-Object)
Write-Output ("Container pkgs: " + $contSet.Count + " | Host pkgs: " + $hostMap.Count + " | Missing in container: " + $missing.Count)

# --- 4. Copy each missing package (create scope parent dirs as needed) ---
$madeDirs = @{}
$ok = 0; $fail = 0
foreach ($k in $missing) {
  try {
    if ($k.Contains('/')) {
      $scope = $k.Split('/')[0]
      if (-not $madeDirs.ContainsKey($scope)) {
        docker exec ghostcart_app mkdir -p "/app/node_modules/$scope" 2>$null | Out-Null
        $madeDirs[$scope] = $true
      }
    }
    docker cp $hostMap[$k] "ghostcart_app:/app/node_modules/$k" 2>$null | Out-Null
    if ($LASTEXITCODE -eq 0) { $ok++ } else { $fail++; Write-Output ("FAIL copy: " + $k) }
  } catch { $fail++; Write-Output ("FAIL exc: " + $k + " :: " + $_.Exception.Message) }
}
Write-Output ("Copied OK: " + $ok + " | Failed: " + $fail)

# --- 5. Sanity check the previously failing module ---
docker exec ghostcart_app node -e "console.log('i18n check:', require.resolve('@react-aria/i18n'))" 2>&1 | Select-Object -First 2
