param(
  [int]$Port = 8765,
  [switch]$NoBrowser
)

$ErrorActionPreference = 'Stop'
$root = (Resolve-Path -LiteralPath $PSScriptRoot).Path

function Test-LocalPortAvailable {
  param([int]$CandidatePort)

  $probe = $null
  try {
    $probe = [System.Net.Sockets.TcpListener]::new([Net.IPAddress]::Loopback, $CandidatePort)
    $probe.Start()
    return $true
  }
  catch {
    return $false
  }
  finally {
    if ($probe) { $probe.Stop() }
  }
}

function Select-AvailablePort {
  param([int]$PreferredPort)

  foreach ($candidate in $PreferredPort..($PreferredPort + 20)) {
    if (Test-LocalPortAvailable -CandidatePort $candidate) {
      return $candidate
    }
  }

  throw "No available local port was found between $PreferredPort and $($PreferredPort + 20)."
}

function Send-HttpResponse {
  param(
    [System.Net.Sockets.NetworkStream]$Stream,
    [int]$StatusCode,
    [string]$Reason,
    [string]$ContentType,
    [byte[]]$Body,
    [bool]$HeadOnly = $false
  )

  if ($null -eq $Body) { $Body = [byte[]]::new(0) }
  $header = "HTTP/1.1 $StatusCode $Reason`r`nContent-Type: $ContentType`r`nContent-Length: $($Body.Length)`r`nCache-Control: no-store`r`nConnection: close`r`n`r`n"
  $headerBytes = [Text.Encoding]::ASCII.GetBytes($header)
  $Stream.Write($headerBytes, 0, $headerBytes.Length)
  if (-not $HeadOnly -and $Body.Length -gt 0) {
    $Stream.Write($Body, 0, $Body.Length)
  }
  $Stream.Flush()
}

function Start-TestServer {
  param([int]$SelectedPort)

  $listener = [System.Net.Sockets.TcpListener]::new([Net.IPAddress]::Loopback, $SelectedPort)
  $listener.Start()

  $testUrl = "http://127.0.0.1:$SelectedPort/test-environment.html"
  Write-Host ''
  if ($SelectedPort -ne $requestedPort) {
    Write-Host "Port $requestedPort is busy. Using port $SelectedPort instead." -ForegroundColor Yellow
  }
  Write-Host 'Test server started.' -ForegroundColor Green
  Write-Host "Test URL: $testUrl" -ForegroundColor Cyan
  Write-Host 'Press Ctrl+C in this window to stop the server.' -ForegroundColor Yellow

  if (-not $NoBrowser) { Start-Process $testUrl }

  $mimeTypes = @{
    '.html' = 'text/html; charset=utf-8'
    '.css'  = 'text/css; charset=utf-8'
    '.js'   = 'text/javascript; charset=utf-8'
    '.csv'  = 'text/csv; charset=utf-8'
    '.txt'  = 'text/plain; charset=utf-8'
    '.json' = 'application/json; charset=utf-8'
    '.png'  = 'image/png'
    '.jpg'  = 'image/jpeg'
    '.jpeg' = 'image/jpeg'
    '.svg'  = 'image/svg+xml'
    '.ico'  = 'image/x-icon'
  }

  $rootPrefix = $root.TrimEnd([IO.Path]::DirectorySeparatorChar) + [IO.Path]::DirectorySeparatorChar

  try {
    while ($true) {
      $client = $listener.AcceptTcpClient()
      $stream = $null
      $reader = $null
      try {
        $stream = $client.GetStream()
        $reader = [IO.StreamReader]::new($stream, [Text.Encoding]::ASCII, $false, 1024, $true)
        $requestLine = $reader.ReadLine()
        if ([string]::IsNullOrWhiteSpace($requestLine)) { continue }

        do {
          $line = $reader.ReadLine()
        } while ($null -ne $line -and $line -ne '')

        $parts = $requestLine.Split(' ')
        if ($parts.Length -lt 2) {
          $body = [Text.Encoding]::UTF8.GetBytes('Bad request')
          Send-HttpResponse -Stream $stream -StatusCode 400 -Reason 'Bad Request' -ContentType 'text/plain; charset=utf-8' -Body $body
          continue
        }

        $method = $parts[0].ToUpperInvariant()
        $headOnly = $method -eq 'HEAD'
        if ($method -ne 'GET' -and -not $headOnly) {
          $body = [Text.Encoding]::UTF8.GetBytes('Method not allowed')
          Send-HttpResponse -Stream $stream -StatusCode 405 -Reason 'Method Not Allowed' -ContentType 'text/plain; charset=utf-8' -Body $body
          continue
        }

        $rawPath = ($parts[1] -split '\?', 2)[0]
        $relative = [Uri]::UnescapeDataString($rawPath).TrimStart('/')
        if ([string]::IsNullOrWhiteSpace($relative)) { $relative = 'test-environment.html' }
        $relative = $relative.Replace('/', [IO.Path]::DirectorySeparatorChar)
        $target = [IO.Path]::GetFullPath((Join-Path $root $relative))
        $insideRoot = $target -eq $root -or $target.StartsWith($rootPrefix, [StringComparison]::OrdinalIgnoreCase)

        if (-not $insideRoot) {
          $body = [Text.Encoding]::UTF8.GetBytes('Forbidden')
          Send-HttpResponse -Stream $stream -StatusCode 403 -Reason 'Forbidden' -ContentType 'text/plain; charset=utf-8' -Body $body -HeadOnly $headOnly
          continue
        }

        if (-not (Test-Path -LiteralPath $target -PathType Leaf)) {
          $body = [Text.Encoding]::UTF8.GetBytes('Not found')
          Send-HttpResponse -Stream $stream -StatusCode 404 -Reason 'Not Found' -ContentType 'text/plain; charset=utf-8' -Body $body -HeadOnly $headOnly
          continue
        }

        $body = [IO.File]::ReadAllBytes($target)
        $extension = [IO.Path]::GetExtension($target).ToLowerInvariant()
        $contentType = if ($mimeTypes.ContainsKey($extension)) { $mimeTypes[$extension] } else { 'application/octet-stream' }
        Send-HttpResponse -Stream $stream -StatusCode 200 -Reason 'OK' -ContentType $contentType -Body $body -HeadOnly $headOnly
      }
      catch {
        if ($stream) {
          try {
            $body = [Text.Encoding]::UTF8.GetBytes('Internal server error')
            Send-HttpResponse -Stream $stream -StatusCode 500 -Reason 'Internal Server Error' -ContentType 'text/plain; charset=utf-8' -Body $body
          }
          catch {}
        }
      }
      finally {
        if ($reader) { $reader.Dispose() }
        if ($stream) { $stream.Dispose() }
        $client.Close()
      }
    }
  }
  finally {
    $listener.Stop()
  }
}

$requestedPort = $Port
$selectedPort = Select-AvailablePort -PreferredPort $Port
Start-TestServer -SelectedPort $selectedPort
