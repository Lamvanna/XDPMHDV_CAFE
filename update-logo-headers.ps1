# Script to update logo in all HTML headers

$files = @(
    "frontend/cart.html",
    "frontend/checkout.html",
    "frontend/contact.html",
    "frontend/detail.html",
    "frontend/profile.html",
    "frontend/promotion.html",
    "frontend/my-orders.html",
    "frontend/reservation.html",
    "frontend/reservation-history.html"
)

$oldPattern = @'
                    <div class="w-10 h-10 sm:w-12 sm:h-12 bg-coffee rounded-full flex items-center justify-center">
                        <i class="fas fa-coffee text-white text-lg sm:text-xl"></i>
                    </div>
'@

$newPattern = @'
                    <div class="w-10 h-10 sm:w-12 sm:h-12 bg-coffee rounded-full flex items-center justify-center overflow-hidden shop-logo-container">
                        <i class="fas fa-coffee text-white text-lg sm:text-xl shop-logo-icon"></i>
                        <img src="" alt="Logo" class="shop-logo w-full h-full object-cover hidden">
                    </div>
'@

foreach ($file in $files) {
    if (Test-Path $file) {
        Write-Host "Updating $file..."
        $content = Get-Content $file -Raw
        $content = $content -replace [regex]::Escape($oldPattern), $newPattern
        Set-Content $file $content -NoNewline
        Write-Host "✓ Updated $file"
    } else {
        Write-Host "✗ File not found: $file"
    }
}

Write-Host "`n✅ Done! Updated logo structure in all files."
