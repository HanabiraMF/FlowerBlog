$url = 'http://localhost:5173/'

for ($attempt = 0; $attempt -lt 80; $attempt++) {
    try {
        $response = Invoke-WebRequest -UseBasicParsing -Uri $url -TimeoutSec 1
        if ($response.StatusCode -ge 200 -and $response.StatusCode -lt 500) {
            Start-Process $url
            break
        }
    } catch {
        # Vite is still starting.
    }
    Start-Sleep -Milliseconds 750
}
