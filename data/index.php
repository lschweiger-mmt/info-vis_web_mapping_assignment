<?php
// Set headers to allow cross-origin requests
header("Access-Control-Allow-Origin: *");
header("Content-Type: text/html; charset=UTF-8");

// Get the directory contents
$files = scandir(".");
$geojsonFiles = [];

// Filter for .geojson files
foreach ($files as $file) {
    if (pathinfo($file, PATHINFO_EXTENSION) === "geojson") {
        $geojsonFiles[] = $file;
    }
}

// Output the file list as HTML links
echo "<html><head><title>GeoJSON Files</title></head><body>";
echo "<h1>Available GeoJSON Files</h1>";
echo "<ul>";
foreach ($geojsonFiles as $file) {
    echo "<li><a href=\"$file\">$file</a></li>";
}
echo "</ul>";
echo "</body></html>";
?>
